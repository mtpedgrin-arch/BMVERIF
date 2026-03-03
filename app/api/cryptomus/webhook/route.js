import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendPaymentConfirmedEmail, sendReferralRewardEmail, sendDeliveryEmail } from "../../../../lib/mailer";
import { sendCapiEvent } from "../../../../lib/metaCapi";
import { sendTelegramOrderNotification, sendTelegramOrderWithButton } from "../../../../lib/telegram";
import { supplierCreateOrder, supplierGetBalance } from "../../../../lib/npprteam";

const BASE_URL    = process.env.NEXTAUTH_URL || "https://bmverificada.space";
const CRON_SECRET = process.env.CRON_SECRET  || "bmverif_cron_2026";
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

    // ── Auto-fulfillment via npprteam.shop ──────────────────────────────────
    let autoFulfillStatus = null; // null | "delivered" | "partial" | "no_supplier"
    let supplierOrderIds = [];

    if (process.env.NPPRTEAM_API_KEY) {
      try {
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
        const itemsWithProduct = orderItems.filter(i => i.productId);

        if (itemsWithProduct.length > 0 && itemsWithProduct.length === orderItems.length) {
          const products = await prisma.product.findMany({
            where: { id: { in: itemsWithProduct.map(i => i.productId) } },
            select: { id: true, supplierProductId: true },
          });
          const productMap = Object.fromEntries(products.map(p => [p.id, p]));
          const allHaveSupplier = itemsWithProduct.every(i => productMap[i.productId]?.supplierProductId);

          if (allHaveSupplier) {
            // ── Chequeo de saldo antes de comprar ────────────────────────────
            let supplierBalance = Infinity; // si falla la consulta, intentamos igual
            try {
              const b = await supplierGetBalance();
              // Usamos totalBalance (primary + cashback) para no bloquear compras cuando el cashback alcanza
              supplierBalance = parseFloat(b.totalBalance ?? b.primaryBalance ?? 0);
            } catch { /* no bloquear el flujo */ }

            const totalCostNeeded = itemsWithProduct.reduce((sum, i) => {
              return sum + (parseFloat(productMap[i.productId]?.cost || 0) * (i.qty ?? 1));
            }, 0);

            if (supplierBalance < totalCostNeeded * 0.9) {
              // Saldo insuficiente — alertar con botón de retry
              autoFulfillStatus = "failed_balance";
              const retryUrl = `${BASE_URL}/api/admin/retry-fulfillment?orderId=${order.id}&secret=${CRON_SECRET}`;
              sendTelegramOrderWithButton(
                `🚨 <b>SALDO INSUFICIENTE — Fulfillment pendiente</b>\n\n` +
                `🆔 Orden: #${order.id.slice(-8)}\n` +
                `👤 ${order.userName || order.userEmail}\n` +
                `💰 Saldo disponible: <b>$${supplierBalance.toFixed(2)}</b>\n` +
                `🛒 Costo estimado: <b>$${totalCostNeeded.toFixed(2)}</b>\n\n` +
                `Recargá el saldo en npprteam.shop y presioná el botón.`,
                "✅ Saldo cargado · Reintentar ahora",
                retryUrl
              ).catch(() => {});
            } else {

            let deliveryParts = [];
            let allCredentials = true;

            for (const item of itemsWithProduct) {
              const spId = productMap[item.productId].supplierProductId;
              const { ok, data } = await supplierCreateOrder(spId, item.qty);

              if (ok && data.orderId) {
                supplierOrderIds.push(data.orderId);
                const realItems = (data.items || []).filter(x => x && x !== "Please contact website admin");
                if (realItems.length > 0) {
                  deliveryParts.push(`📦 ${item.name}:\n${realItems.join("\n")}`);
                } else {
                  deliveryParts.push(`📦 ${item.name}:\n[Pedido proveedor #${data.orderId} — esperar accesos]`);
                  allCredentials = false;
                }
              } else {
                deliveryParts.push(`📦 ${item.name}:\n[Error proveedor: ${data.message || "desconocido"}]`);
                allCredentials = false;
              }
            }

            const deliveryContent = deliveryParts.join("\n\n---\n\n");

            if (allCredentials) {
              autoFulfillStatus = "delivered";
              await prisma.order.update({
                where: { id: order.id },
                data: { deliveryContent, status: "delivered" },
              });
              await createNotification({
                userEmail: order.userEmail,
                type: "order_delivered",
                title: "📦 ¡Tu pedido fue entregado!",
                body: `#${order.id.slice(-8)} · Recibí tus accesos`,
                orderId: order.id,
              });
              sendDeliveryEmail({
                to: order.userEmail,
                orderId: order.id,
                productSummary: deliveryContent,
              }).catch(() => {});
              // Increment sales count
              for (const item of itemsWithProduct) {
                prisma.product.update({
                  where: { id: item.productId },
                  data: { sales: { increment: item.qty } },
                }).catch(() => {});
              }
            } else {
              autoFulfillStatus = "partial";
              await prisma.order.update({
                where: { id: order.id },
                data: { deliveryContent },
              });
            }
            } // end else (saldo suficiente)
          } else {
            autoFulfillStatus = "no_supplier";
          }
        } else {
          autoFulfillStatus = "no_supplier";
        }
      } catch (fulfillErr) {
        console.error("Auto-fulfillment error:", fulfillErr);
        autoFulfillStatus = "error";
      }
    }
    // ── End auto-fulfillment ─────────────────────────────────────────────────

    // Telegram: adaptar mensaje según resultado del fulfillment
    const orderItems2 = await prisma.orderItem.findMany({ where: { orderId: order.id } });
    const itemLines = orderItems2.length > 0
      ? orderItems2.map(i => `  • ${i.name} ×${i.qty ?? 1} — $${((i.price ?? 0) * (i.qty ?? 1)).toFixed(2)}`).join("\n")
      : "  • (sin detalle)";
    const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    const discountLine = order.discount > 0
      ? `🏷️ Descuento: -$${order.discount.toFixed(2)}${order.coupon ? ` (${order.coupon})` : ""}\n` +
        `💲 Subtotal original: $${order.subtotal.toFixed(2)}\n`
      : "";
    const fulfillLine =
      autoFulfillStatus === "delivered"      ? `✅ <b>AUTO-ENTREGADO</b> · Proveedor #${supplierOrderIds.join(", ")}\n` :
      autoFulfillStatus === "partial"        ? `⚠️ <b>Comprado al proveedor #${supplierOrderIds.join(", ")} — entrega manual pendiente</b>\n` :
      autoFulfillStatus === "failed_balance" ? `🚨 <b>SALDO INSUFICIENTE — ver botón en mensaje anterior</b>\n` :
      autoFulfillStatus === "no_supplier"    ? `🔔 Sin proveedor configurado — <b>entregar manualmente</b>\n` :
      autoFulfillStatus === "error"          ? `❌ Error en auto-fulfillment — <b>entregar manualmente</b>\n` :
                                              `⚡️ <b>¡Ir a comprar al proveedor!</b>\n`;
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
      fulfillLine
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
