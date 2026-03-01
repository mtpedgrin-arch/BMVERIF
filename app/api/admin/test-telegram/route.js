import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { sendTelegramOrderNotification, sendTelegramNotification } from "../../../../lib/telegram";

// POST /api/admin/test-telegram — solo admin, manda mensajes de prueba
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  // 1. Alerta de orden creada (canal de ventas)
  await sendTelegramOrderNotification(
    `🛒 <b>Compra iniciada — esperando pago</b>\n\n` +
    `👤 <b>Cliente de Prueba</b>\n` +
    `📧 test@bmverificada.store\n\n` +
    `📦 <b>Productos:</b>\n  • BM Verificado Premium ×1 — $85.00\n\n` +
    `💰 <b>Total: 85.00 USDT · TRC20</b>\n` +
    `🆔 Orden: #TEST1234\n` +
    `⏰ ${hora}\n\n` +
    `⏳ <i>Aguardando confirmación de pago…</i>\n\n` +
    `🧪 <i>— Mensaje de prueba —</i>`
  ).catch(() => {});

  // Pequeña pausa para que lleguen en orden
  await new Promise(r => setTimeout(r, 1500));

  // 2. Alerta de pago confirmado (canal de ventas)
  await sendTelegramOrderNotification(
    `💰 <b>PAGO CONFIRMADO</b>\n\n` +
    `👤 <b>Cliente de Prueba</b>\n` +
    `📧 test@bmverificada.store\n\n` +
    `📦 <b>Productos:</b>\n  • BM Verificado Premium ×1 — $85.00\n\n` +
    `💵 <b>Total: 85.00 USDT · TRC20</b>\n` +
    `🆔 Orden: #TEST1234\n` +
    `🔗 Tx: 0xTEST_TX_HASH_PRUEBA\n` +
    `⏰ ${hora}\n\n` +
    `⚡️ <b>¡Ir a comprar al proveedor!</b>\n\n` +
    `🧪 <i>— Mensaje de prueba —</i>`
  ).catch(() => {});

  await new Promise(r => setTimeout(r, 1500));

  // 3. Alerta de soporte (canal de soporte)
  await sendTelegramNotification(
    `🎧 <b>Nuevo mensaje de soporte</b>\n\n` +
    `👤 <b>Cliente de Prueba</b>\n` +
    `📧 test@bmverificada.store\n\n` +
    `💬 "Hola, ¿cuándo llega mi pedido?"\n\n` +
    `🧪 <i>— Mensaje de prueba —</i>`
  ).catch(() => {});

  return NextResponse.json({ ok: true, mensaje: "3 alertas de prueba enviadas a Telegram" });
}
