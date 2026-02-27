import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { prisma } from "../../../../../lib/prisma";

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
    console.log(`[check-payment] Order ${id} has no uniqueAmount`);
    return NextResponse.json({ paid: false });
  }

  // Get wallet address from settings
  const walletKey = order.network === "TRC20" ? "wallet_trc20" : "wallet_bep20";
  const setting = await prisma.settings.findUnique({ where: { key: walletKey } });
  const wallet = setting?.value;

  console.log(`[check-payment] Order ${id} | network=${order.network} | uniqueAmount=${order.uniqueAmount} | wallet=${wallet || "NOT FOUND"}`);

  if (!wallet) {
    console.log(`[check-payment] No wallet configured for key: ${walletKey}`);
    return NextResponse.json({ paid: false });
  }

  const createdAtMs = new Date(order.createdAt).getTime();
  let foundTx = null;
  let debugInfo = { network: order.network, wallet, uniqueAmount: order.uniqueAmount, createdAtMs, txsChecked: 0, apiStatus: null, apiError: null };

  if (order.network === "TRC20") {
    const USDT_TRC20 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    try {
      const url = `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20?only_confirmed=true&contract_address=${USDT_TRC20}&limit=50`;
      console.log(`[check-payment] TRC20 fetch: ${url}`);
      const tronRes = await fetch(url, { headers: { Accept: "application/json" } });
      debugInfo.apiStatus = tronRes.status;
      const tronData = await tronRes.json();
      const txs = tronData?.data || [];
      debugInfo.txsChecked = txs.length;
      console.log(`[check-payment] TRC20 API status=${tronRes.status} txs=${txs.length}`);

      for (const tx of txs) {
        const amount = parseInt(tx.value) / 1e6;
        const txTime = tx.block_timestamp;
        const toMatch = tx.to?.toLowerCase() === wallet.toLowerCase();
        const amountMatch = Math.abs(amount - order.uniqueAmount) < 0.005;
        const timeMatch = txTime > createdAtMs;
        console.log(`[check-payment] TX ${tx.transaction_id?.slice(0,12)} | amount=${amount} | to=${tx.to} | txTime=${txTime} | toMatch=${toMatch} amountMatch=${amountMatch} timeMatch=${timeMatch}`);
        if (toMatch && amountMatch && timeMatch) {
          foundTx = { txHash: tx.transaction_id };
          break;
        }
      }
    } catch (e) {
      debugInfo.apiError = e?.message || String(e);
      console.error(`[check-payment] TRC20 error:`, e);
    }
  } else if (order.network === "BEP20") {
    const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
    const apiKey = process.env.BSCSCAN_API_KEY || "";
    try {
      const url = `https://api.bscscan.com/api?module=account&action=tokentx&address=${wallet}&contractaddress=${USDT_BEP20}&sort=desc&apikey=${apiKey}`;
      console.log(`[check-payment] BEP20 fetch (apiKey set: ${!!apiKey})`);
      const bscRes = await fetch(url);
      debugInfo.apiStatus = bscRes.status;
      const bscData = await bscRes.json();
      const txs = bscData?.result;
      console.log(`[check-payment] BEP20 API status=${bscRes.status} message=${bscData?.message} txCount=${Array.isArray(txs) ? txs.length : typeof txs}`);
      debugInfo.txsChecked = Array.isArray(txs) ? txs.length : 0;
      if (bscData?.message) debugInfo.apiMessage = bscData.message;

      if (Array.isArray(txs)) {
        for (const tx of txs) {
          const amount = parseInt(tx.value) / 1e18;
          const txTime = parseInt(tx.timeStamp) * 1000;
          const toMatch = tx.to?.toLowerCase() === wallet.toLowerCase();
          const amountMatch = Math.abs(amount - order.uniqueAmount) < 0.005;
          const timeMatch = txTime > createdAtMs;
          console.log(`[check-payment] TX ${tx.hash?.slice(0,12)} | amount=${amount} | toMatch=${toMatch} amountMatch=${amountMatch} timeMatch=${timeMatch}`);
          if (toMatch && amountMatch && timeMatch) {
            foundTx = { txHash: tx.hash };
            break;
          }
        }
      }
    } catch (e) {
      debugInfo.apiError = e?.message || String(e);
      console.error(`[check-payment] BEP20 error:`, e);
    }
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
    console.log(`[check-payment] ✅ PAID! Order ${id} txHash=${foundTx.txHash}`);
    return NextResponse.json({ paid: true, txHash: foundTx.txHash });
  }

  console.log(`[check-payment] Not found. debug:`, debugInfo);
  return NextResponse.json({ paid: false, debug: debugInfo });
}
