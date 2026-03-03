import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendPaymentConfirmedEmail, sendReferralRewardEmail } from "../../../../lib/mailer";
import { sendCapiEvent } from "../../../../lib/metaCapi";
import { sendTelegramOrderNotification } from "../../../../lib/telegram";
import crypto from "crypto";

async function handleReferralReward(order) {
  try {
    if (order.creditUsed > 0) {
      await prisma.user.update({
        where: { email: order.userEmail },
        data: { referralCredit: { decrement: order.creditUsed } },
      }).catch(() => {});
    }
    const paidCount = await prisma.order.count({ where: { userEmail: order.userEmail, status: "paid" } });
    if (paidCount !== 1) return;
    const referral = await prisma.referral.findFirst({ where: { referredEmail: order.userEmail, status: "pending" } });
    if (!referral) return;
    const creditEarned = parseFloat((order.total * 0.05).toFixed(2));
    await prisma.referral.update({ where: { id: referral.id }, data: { status: "rewarded", creditEarned } });
    await prisma.user.update({ where: { id: referral.referrerId }, data: { referralCredit: { increment: creditEarned } } });
    const referrer = await prisma.user.findUnique({ where: { id: referral.referrerId }, select: { email: true, name: true } });
    if (referrer) sendReferralRewardEmail({ to: referrer.email, name: referrer.name, creditEarned, referredEmail: order.userEmail }).catch(() => {});
  } catch { /* non-critical */ }
}

const API_KEY = process.env.CRYPTOMUS_API_KEY;

function nid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function createNotification({ userEmail, type, title, body, orderId }) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" (id, "userEmail", type, title, body, "orderId", read, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
    nid(), userEmail, type, title, body, orderId || null
  ).catch(() => {});
}

function verifySign(payload) {
  if (!API_KEY || API_KEY === "REPLACE_WITH_YOUR_KEY") return false;
  const { sign, ...rest } = payload;
  const json = JSON.stringify(rest);
  const b64  = Buffer.from(json).toString("base64");
  const expected = crypto.createHash("md5").update(b64 + API_KEY).digest("hex");
  return sign === expected;
}

// POST /api/cryptomus/webhook — called by Cryptomus on payment status changes
export async function POST(req) {
  try {
    const payload = await req.json();

    if (!verifySign(payload)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const { order_id, status, uuid: paymentUuid, txid } = payload;

    // Only act on confirmed paid statuses
    if (status !== "paid" && status !== "paid_over") {
      return NextResponse.json({ ok: true });
    }

    // ── Check if this is a WalletTopup (not a product order) ──────────────────
    const topup = await prisma.walletTopup.findUnique({ where: { id: order_id } });
    if (topup) {
      if (topup.status === "paid") return NextResponse.json({ ok: true }); // idempotent
      const txRef = txid || paymentUuid || "cryptomus";
      await prisma.walletTopup.update({ where: { id: topup.id }, data: { status: "paid", txHash: txRef } });
      await prisma.user.update({ where: { email: topup.userEmail }, data: { walletBalance: { increment: topup.amount } } });
      const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      sendTelegramOrderNotification(
        `💰 <b>RECARGA DE BILLETERA</b>\n\n` +
        `👤 <b>${topup.userName}</b>\n` +
        `📧 ${topup.userEmail}\n` +
        `💵 <b>+$${topup.amount.toFixed(2)} USDT acreditados</b>\n` +
        `🔗 Tx: ${txRef}\n` +
        `⏰ ${hora}`
      ).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    // ── Regular product order ──────────────────────────────────────────────────
    const order = await prisma.order.findUnique({ where: { id: order_id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "paid") return NextResponse.json({ ok: true }); // idempotent

    const txRef = txid || paymentUuid || "cryptomus";

    await prisma.order.update({
      where: { id: order.id },
      data: { status: "paid", txHash: txRef },
    });

    await createNotification({
      userEmail: order.userEmail,
      type: "order_paid",
      title: "💰 Pago confirmado",
      body: `#${order.id.slice(-8)} · ${(order.uniqueAmount ?? order.total).toFixed(2)} USDT · Cryptomus`,
      orderId: order.id,
    });

    sendPaymentConfirmedEmail({
      to: order.userEmail,
      orderId: order.id,
      amount: (order.uniqueAmount ?? order.total).toFixed(2),
      network: "Cryptomus",
      txHash: txRef,
    }).catch(() => {});

    // Telegram: pago confirmado → notificar para ir a comprar al proveedor
    const itemLines = Array.isArray(order.items)
      ? order.items.map(i => `  • ${i.name} ×${i.qty ?? 1} — $${((i.price ?? 0) * (i.qty ?? 1)).toFixed(2)}`).join("\n")
      : "  • (sin detalle)";
    const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const discountLine = order.discount > 0
      ? `🏷️ Descuento: -$${order.discount.toFixed(2)}${order.coupon ? ` (${order.coupon})` : ""}\n` +
        `💲 Subtotal original: $${order.subtotal.toFixed(2)}\n`
      : "";
    sendTelegramOrderNotification(
      `💰 <b>PAGO CONFIRMADO</b>\n\n` +
      `👤 <b>${order.userName || order.userEmail}</b>\n` +
      `📧 ${order.userEmail}\n\n` +
      `📦 <b>Productos:</b>\n${itemLines}\n\n` +
      discountLine +
      `💵 <b>Transferido: ${(order.uniqueAmount ?? order.total).toFixed(2)} USDT · ${order.network ?? "Cryptomus"}</b>\n` +
      `🆔 Orden: #${order.id.slice(-8)}\n` +
      `🔗 Tx: ${txRef}\n` +
      `⏰ ${hora}\n\n` +
      `⚡️ <b>¡Ir a comprar al proveedor!</b>`
    ).catch(() => {});

    // CAPI Purchase event — incluye fbp/fbc guardados en la orden para mejor matching
    sendCapiEvent({
      eventName:  "Purchase",
      eventId:    `purchase_${order.id}`,
      email:      order.userEmail,
      externalId: order.userEmail,
      fbp:        order.fbp || undefined,
      fbc:        order.fbc || undefined,
      orderId:    order.id,
      value:      order.uniqueAmount ?? order.total,
    }).catch(() => {});

    // Referral reward (non-blocking)
    handleReferralReward({ ...order, status: "paid" }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
