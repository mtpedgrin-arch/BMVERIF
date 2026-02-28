import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendPaymentConfirmedEmail } from "../../../../lib/mailer";
import { sendCapiEvent } from "../../../../lib/metaCapi";
import crypto from "crypto";

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

    // CAPI Purchase event (no browser data available in webhook, but email match is enough)
    sendCapiEvent({
      eventName: "Purchase",
      eventId:   `purchase_${order.id}`,
      email:     order.userEmail,
      orderId:   order.id,
      value:     order.uniqueAmount ?? order.total,
    }).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
