import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { sendTelegramOrderNotification } from "../../../lib/telegram";

function nid() { return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

async function createNotification({ userEmail, type, title, body, orderId }) {
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Notification" (id, "userEmail", type, title, body, "orderId", read, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
    nid(), userEmail, type, title, body, orderId || null
  ).catch(() => {});
}

// GET /api/orders — admin: todas; usuario: las suyas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (session.user.role === "admin" || session.user.role === "support") {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  const orders = await prisma.order.findMany({
    where: { userEmail: session.user.email },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

// POST /api/orders — crear orden (usuario autenticado)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { items, subtotal, discount, coupon, total, network, creditUsed } = await req.json();
  if (!items?.length || !network || total == null) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  // Generate unique amount: sequential per-hour counter (01, 02, 03…)
  // Count orders created in the last hour to get sequential position
  const parsedTotal = parseFloat(total);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentCount = await prisma.order.count({ where: { createdAt: { gte: hourAgo } } });
  const sequentialCents = ((recentCount % 99) + 1) / 100; // 0.01 → 0.99, wraps
  const uniqueAmount = parseFloat((parsedTotal + sequentialCents).toFixed(2));
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const order = await prisma.order.create({
    data: {
      status: "pending",
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      coupon: coupon || null,
      creditUsed: parseFloat(creditUsed) || 0,
      total: parsedTotal,
      uniqueAmount,
      expiresAt,
      network,
      userId: session.user.id || null,
      items: {
        create: items.map(i => ({
          name: i.name,
          price: parseFloat(i.price),
          cost: parseFloat(i.cost) || 0,
          qty: parseInt(i.qty) || 1,
          productId: i.productId || null,
        })),
      },
    },
    include: { items: true },
  });

  // Notification: order created
  const productSummary = order.items.map(i => `${i.name.slice(0, 30)} ×${i.qty}`).join(", ");
  await createNotification({
    userEmail: session.user.email,
    type: "order_created",
    title: "✅ Orden creada",
    body: `#${order.id.slice(-8)} · ${productSummary} · ${order.total.toFixed(2)} USD`,
    orderId: order.id,
  });

  // Telegram: nueva compra
  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
  const itemLines = order.items.map(i => `  • ${i.name} ×${i.qty} — $${(i.price * i.qty).toFixed(2)}`).join("\n");
  await sendTelegramOrderNotification(
    `🛒 <b>Compra iniciada — esperando pago</b>\n\n` +
    `👤 <b>${order.userName}</b>\n` +
    `📧 ${order.userEmail}\n\n` +
    `📦 <b>Productos:</b>\n${itemLines}\n\n` +
    (order.discount > 0 ? `🏷️ Descuento: -$${order.discount.toFixed(2)}${order.coupon ? ` (${order.coupon})` : ""}\n` : "") +
    `💰 <b>Total: ${order.uniqueAmount.toFixed(2)} USDT · ${order.network}</b>\n` +
    `🆔 Orden: #${order.id.slice(-8)}\n` +
    `⏰ ${hora}\n\n` +
    `⏳ <i>Aguardando confirmación de pago…</i>`
  ).catch(() => {});

  return NextResponse.json(order);
}
