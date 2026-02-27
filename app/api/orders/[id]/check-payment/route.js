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
    return NextResponse.json({ expired: true });
  }

  if (!order.uniqueAmount) return NextResponse.json({ paid: false });

  // Get wallet address from settings
  const walletKey = order.network === "TRC20" ? "wallet_trc20" : "wallet_bep20";
  const setting = await prisma.settings.findUnique({ where: { key: walletKey } });
  const wallet = setting?.value;
  if (!wallet) return NextResponse.json({ paid: false });

  const createdAtMs = new Date(order.createdAt).getTime();
  let foundTx = null;

  if (order.network === "TRC20") {
    const USDT_TRC20 = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";
    try {
      const url = `https://api.trongrid.io/v1/accounts/${wallet}/transactions/trc20?only_confirmed=true&contract_address=${USDT_TRC20}&limit=20`;
      const tronRes = await fetch(url, { headers: { Accept: "application/json" } });
      const tronData = await tronRes.json();
      for (const tx of tronData?.data || []) {
        const amount = parseInt(tx.value) / 1e6;
        const txTime = tx.block_timestamp; // ms
        if (
          tx.to?.toLowerCase() === wallet.toLowerCase() &&
          Math.abs(amount - order.uniqueAmount) < 0.005 &&
          txTime > createdAtMs
        ) {
          foundTx = { txHash: tx.transaction_id };
          break;
        }
      }
    } catch {}
  } else if (order.network === "BEP20") {
    const USDT_BEP20 = "0x55d398326f99059fF775485246999027B3197955";
    const apiKey = process.env.BSCSCAN_API_KEY || "";
    try {
      const url = `https://api.bscscan.com/api?module=account&action=tokentx&address=${wallet}&contractaddress=${USDT_BEP20}&sort=desc&apikey=${apiKey}`;
      const bscRes = await fetch(url);
      const bscData = await bscRes.json();
      const txs = bscData?.result;
      if (Array.isArray(txs)) {
        for (const tx of txs) {
          const amount = parseInt(tx.value) / 1e18;
          const txTime = parseInt(tx.timeStamp) * 1000; // convert to ms
          if (
            tx.to?.toLowerCase() === wallet.toLowerCase() &&
            Math.abs(amount - order.uniqueAmount) < 0.005 &&
            txTime > createdAtMs
          ) {
            foundTx = { txHash: tx.hash };
            break;
          }
        }
      }
    } catch {}
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
    return NextResponse.json({ paid: true, txHash: foundTx.txHash });
  }

  return NextResponse.json({ paid: false });
}
