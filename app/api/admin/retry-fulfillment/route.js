import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { supplierCreateOrder, supplierGetBalance } from "../../../../lib/npprteam";
import { sendDeliveryEmail } from "../../../../lib/mailer";
import { sendTelegramOrderWithButton, sendTelegramOrderNotification } from "../../../../lib/telegram";

const CRON_SECRET = process.env.CRON_SECRET || "bmverif_cron_2026";
const BASE_URL    = process.env.NEXTAUTH_URL  || "https://bmverificada.space";

function nid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
async function createNotification({ userEmail, type, title, body, orderId }) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" (id, "userEmail", type, title, body, "orderId", read, "createdAt") VALUES ($1,$2,$3,$4,$5,$6,false,NOW())`,
    nid(), userEmail, type, title, body, orderId || null
  ).catch(() => {});
}

// GET /api/admin/retry-fulfillment?orderId=XXX&secret=bmverif_cron_2026
// El admin hace click en el botón de Telegram después de recargar saldo.
// Re-intenta el auto-fulfillment para esa orden y muestra el resultado.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const secret  = searchParams.get("secret");
  const orderId = searchParams.get("orderId");

  if (secret !== CRON_SECRET) {
    return new Response("❌ No autorizado", { status: 401, headers: { "Content-Type": "text/plain" } });
  }
  if (!orderId) {
    return new Response("❌ orderId requerido", { status: 400, headers: { "Content-Type": "text/plain" } });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return new Response("❌ Orden no encontrada", { status: 404, headers: { "Content-Type": "text/plain" } });
  if (order.status === "delivered") {
    return new Response("✅ Esta orden ya fue entregada anteriormente.", { headers: { "Content-Type": "text/plain" } });
  }
  if (order.status !== "paid") {
    return new Response(`⚠️ La orden está en estado "${order.status}" — solo se puede reintentar en estado "paid".`, { headers: { "Content-Type": "text/plain" } });
  }

  // Verificar saldo antes de intentar
  let balance = 0;
  try {
    const b = await supplierGetBalance();
    // Usamos totalBalance (primary + cashback) para no bloquear compras cuando el cashback alcanza
    balance = parseFloat(b.totalBalance ?? b.primaryBalance ?? 0);
  } catch { /* continuar igual */ }

  // Obtener items y productos
  const orderItems = await prisma.orderItem.findMany({ where: { orderId: order.id } });
  const itemsWithProduct = orderItems.filter(i => i.productId);
  if (itemsWithProduct.length === 0) {
    return new Response("⚠️ La orden no tiene items con productId vinculado.", { headers: { "Content-Type": "text/plain" } });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: itemsWithProduct.map(i => i.productId) } },
    select: { id: true, supplierProductId: true, cost: true },
  });
  const productMap = Object.fromEntries(products.map(p => [p.id, p]));
  const allHaveSupplier = itemsWithProduct.every(i => productMap[i.productId]?.supplierProductId);

  if (!allHaveSupplier) {
    return new Response("⚠️ Algún producto no tiene supplierProductId configurado.", { headers: { "Content-Type": "text/plain" } });
  }

  // Chequeo de saldo
  const totalCost = itemsWithProduct.reduce((sum, i) => sum + (parseFloat(productMap[i.productId]?.cost || 0) * (i.qty ?? 1)), 0);
  if (balance < totalCost * 0.9) { // margen de 10% por diferencias de precio
    const retryUrl = `${BASE_URL}/api/admin/retry-fulfillment?orderId=${order.id}&secret=${CRON_SECRET}`;
    sendTelegramOrderWithButton(
      `⚠️ <b>SALDO AÚN INSUFICIENTE</b>\n\n` +
      `🆔 Orden: #${order.id.slice(-8)}\n` +
      `💰 Saldo disponible: <b>$${balance.toFixed(2)}</b>\n` +
      `🛒 Costo estimado: <b>$${totalCost.toFixed(2)}</b>\n\n` +
      `Recargá saldo y volvé a intentar.`,
      "✅ Saldo cargado · Reintentar",
      retryUrl
    ).catch(() => {});
    return new Response(
      `⚠️ Saldo insuficiente.\nDisponible: $${balance.toFixed(2)}\nNecesario: ~$${totalCost.toFixed(2)}\n\nRecargá y hacé click de nuevo en el botón de Telegram.`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }

  // Intentar compra al proveedor
  let deliveryParts = [];
  let allCredentials = true;
  let supplierOrderIds = [];

  for (const item of itemsWithProduct) {
    const spId = productMap[item.productId].supplierProductId;
    const { ok, data } = await supplierCreateOrder(spId, item.qty ?? 1);
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
      deliveryParts.push(`📦 ${item.name}:\n[Error: ${data?.message || "desconocido"}]`);
      allCredentials = false;
    }
  }

  const deliveryContent = deliveryParts.join("\n\n---\n\n");

  if (allCredentials) {
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
    sendDeliveryEmail({ to: order.userEmail, orderId: order.id, productSummary: deliveryContent }).catch(() => {});
    for (const item of itemsWithProduct) {
      prisma.product.update({ where: { id: item.productId }, data: { sales: { increment: item.qty ?? 1 } } }).catch(() => {});
    }
    sendTelegramOrderNotification(
      `✅ <b>RETRY EXITOSO — AUTO-ENTREGADO</b>\n\n` +
      `🆔 Orden: #${order.id.slice(-8)}\n` +
      `👤 ${order.userName || order.userEmail}\n` +
      `📦 Proveedor #${supplierOrderIds.join(", ")}`
    ).catch(() => {});
    return new Response(
      `✅ ¡Entrega exitosa!\nOrden #${order.id.slice(-8)} marcada como entregada.\nEl cliente recibió el email con sus credenciales.`,
      { headers: { "Content-Type": "text/plain" } }
    );
  } else {
    await prisma.order.update({ where: { id: order.id }, data: { deliveryContent } });
    sendTelegramOrderNotification(
      `⚠️ <b>RETRY PARCIAL — revisión manual</b>\n\n` +
      `🆔 Orden: #${order.id.slice(-8)}\n` +
      `📦 Proveedor #${supplierOrderIds.join(", ")}\n` +
      `⚠️ Algunos items no tienen credenciales aún`
    ).catch(() => {});
    return new Response(
      `⚠️ Compra realizada al proveedor (#${supplierOrderIds.join(", ")}) pero sin credenciales aún.\nRevisá el panel admin para completar la entrega manualmente.`,
      { headers: { "Content-Type": "text/plain" } }
    );
  }
}
