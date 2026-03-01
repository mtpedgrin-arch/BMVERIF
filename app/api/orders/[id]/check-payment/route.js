import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { prisma } from "../../../../../lib/prisma";
import { sendPaymentConfirmedEmail, sendReferralRewardEmail } from "../../../../../lib/mailer";
import { sendCapiEvent } from "../../../../../lib/metaCapi";

// Reward referrer with 10% cashback when referred user's first order is paid
async function handleReferralReward(order) {
  try {
    // Deduct credit used in this order from buyer's balance
    if (order.creditUsed > 0) {
      await prisma.user.update({
        where: { email: order.userEmail },
        data: { referralCredit: { decrement: order.creditUsed } },
      }).catch(() => {});
    }
    // Count paid orders for this user — if this is their first, reward the referrer
    const paidCount = await prisma.order.count({
      where: { userEmail: order.userEmail, status: "paid" },
    });
    if (paidCount !== 1) return; // not the first paid order
    const referral = await prisma.referral.findFirst({
      where: { referredEmail: order.userEmail, status: "pending" },
    });
    if (!referral) return;
    const creditEarned = parseFloat((order.total * 0.10).toFixed(2));
    await prisma.referral.update({
      where: { id: referral.id },
      data: { status: "rewarded", creditEarned },
    });
    await prisma.user.update({
      where: { id: referral.referrerId },
      data: { referralCredit: { increment: creditEarned } },
    });
    const referrer = await prisma.user.findUnique({
      where: { id: referral.referrerId },
      select: { email: true, name: true },
    });
    if (referrer) {
      sendReferralRewardEmail({
        to: referrer.email,
        name: referrer.name,
        creditEarned,
        referredEmail: order.userEmail,
      }).catch(() => {});
    }
  } catch { /* non-critical */ }
}

// Parse USDT BEP20 value safely (18 decimals, avoids JS float precision loss)
function parseUsdt18(valueStr) {
  const s = String(valueStr).padStart(19, "0");
  const intPart = s.slice(0, -18) || "0";
  const fracPart = s.slice(-18, -12); // 6 decimal places is enough
  return parseFloat(intPart + "." + fracPart);
}

function nid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function createNotification({ userEmail, type, title, body, orderId }) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" (id, "userEmail", type, title, body, "orderId", read, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
    nid(), userEmail, type, title, body, orderId || null
  ).catch(() => {});
}

// GET /api/orders/[id]/check-payment — polls blockchain for matching payment
export async function GET(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  // Only owner or admin can check
  if (order.userEmail !== session.user.email && session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (order.status === "paid") return NextResponse.json({ paid: true, txHash: order.txHash });

  if (order.expiresAt && new Date() > new Date(order.expiresAt)) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" } }).catch(() => {});
    return NextResponse.json({ expired: true });
  }
  if (order.status === "cancelled") {
    return NextResponse.json({ expired: true });
  }

  if (!order.uniqueAmount) {
    return NextResponse.json({ paid: false });
  }

  // Get wallet address from settings
  const walletKey = order.network === "TRC20" ? "wallet_trc20" : "wallet_bep20";
  const setting = await prisma.settings.findUnique({ where: { key: walletKey } });
  const wallet = setting?.value;

  if (!wallet) {
    return NextResponse.json({ paid: false });
  }

  const createdAtMs = new Date(order.createdAt).getTime();
  let foundTx = null;

  if (order.network === "TRC20") {
    const USDT_TRC20 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    try {
      const url = `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20?only_confirmed=true&contract_address=${USDT_TRC20}&limit=50`;
      const tronRes = await fetch(url, { headers: { Accept: "application/json" } });
      const tronData = await tronRes.json();
      const txs = tronData?.data || [];

      for (const tx of txs) {
        const amount = parseInt(tx.value) / 1e6;
        const txTime = tx.block_timestamp;
        const toMatch = tx.to?.toLowerCase() === wallet.toLowerCase();
        const amountMatch = Math.abs(amount - order.uniqueAmount) < 0.005;
        const timeMatch = txTime > createdAtMs;
        if (toMatch && amountMatch && timeMatch) {
          foundTx = { txHash: tx.transaction_id };
          break;
        }
      }
    } catch { /* blockchain fetch failed */ }
  } else if (order.network === "BEP20") {
    // Use BSC public RPC directly — no API key needed, no cost
    const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
    // Multiple fallback RPCs in case one fails or rate-limits
    const BSC_RPCS = [
      "https://bsc.publicnode.com",
      "https://binance.llamarpc.com",
      "https://bsc-dataseed1.binance.org/",
      "https://bsc-dataseed2.binance.org/",
    ];
    // Transfer(address,address,uint256) event topic
    const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const rpcPost = async (rpc, body) => {
      const r = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return r.json();
    };

    try {
      // Get current block number (try each RPC until one works)
      let currentBlock = 0;
      let workingRpc = BSC_RPCS[0];
      for (const rpc of BSC_RPCS) {
        try {
          const d = await rpcPost(rpc, { jsonrpc: "2.0", method: "eth_blockNumber", params: [], id: 1 });
          if (d.result) { currentBlock = parseInt(d.result, 16); workingRpc = rpc; break; }
        } catch {}
      }

      // Search last ~1500 blocks (~75 min at 3s/block) — covers full 1h order + buffer
      const fromBlock = Math.max(0, currentBlock - 1500);
      const paddedWallet = "0x000000000000000000000000" + wallet.replace("0x", "").toLowerCase();
      const logsData = await rpcPost(workingRpc, {
        jsonrpc: "2.0", method: "eth_getLogs",
        params: [{
          fromBlock: "0x" + fromBlock.toString(16),
          toBlock: "latest",
          address: USDT_BEP20,
          topics: [TRANSFER_TOPIC, null, paddedWallet],
        }],
        id: 2,
      });

      const logs = Array.isArray(logsData.result) ? logsData.result : [];

      for (const log of logs) {
        // data field = amount (32-byte hex)
        const rawAmount = BigInt(log.data);
        const amount = parseUsdt18(rawAmount.toString());
        const amountMatch = Math.abs(amount - order.uniqueAmount) < 0.005;
        if (amountMatch) {
          foundTx = { txHash: log.transactionHash };
          break;
        }
      }
    } catch { /* RPC fetch failed */ }
  }

  if (foundTx) {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", txHash: foundTx.txHash },
    });
    await createNotification({
      userEmail: order.userEmail,
      type: "order_paid",
      title: "💰 Pago confirmado",
      body: `#${order.id.slice(-8)} · ${order.uniqueAmount.toFixed(2)} USDT · Red ${order.network} · TX: ${foundTx.txHash.slice(0, 12)}...`,
      orderId: order.id,
    });
    // Send payment confirmed email (non-blocking)
    sendPaymentConfirmedEmail({
      to: order.userEmail,
      orderId: order.id,
      amount: order.uniqueAmount.toFixed(2),
      network: order.network,
      txHash: foundTx.txHash,
    }).catch(() => {});
    // CAPI Purchase event — deduplicates with client-side fbq via eventID
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || undefined;
    const ua = req.headers.get("user-agent") || undefined;
    sendCapiEvent({
      eventName: "Purchase",
      eventId:   `purchase_${order.id}`,
      email:     order.userEmail,
      ip,
      userAgent: ua,
      orderId:   order.id,
      value:     order.uniqueAmount ?? order.total,
    }).catch(() => {});
    // Referral reward (non-blocking)
    handleReferralReward({ ...order, status: "paid" }).catch(() => {});
    return NextResponse.json({ paid: true, txHash: foundTx.txHash });
  }

  return NextResponse.json({ paid: false });
}
