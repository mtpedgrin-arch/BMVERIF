/**
 * BM Verificada — Dropshipping Watcher
 * ──────────────────────────────────────────────────────────────────────────────
 * Corre en tu PC 24/7. Cada 30 segundos revisa si hay órdenes pagas sin
 * entregar. Si el saldo alcanza, compra al proveedor y entrega automáticamente.
 * Si el saldo es insuficiente, manda alerta Telegram con botón de retry.
 *
 * Setup: ver README.md
 */

require("dotenv").config();
const { Pool } = require("pg");

// ── Config ────────────────────────────────────────────────────────────────────
const NPPRTEAM_BASE    = "https://npprteam.shop/api/shop";
const NPPRTEAM_API_KEY = process.env.NPPRTEAM_API_KEY || "";

const BASE_URL         = process.env.NEXTAUTH_URL || "https://bmverificada.space";
const CRON_SECRET      = process.env.CRON_SECRET  || "bmverif_cron_2026";

const TELEGRAM_TOKEN   = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

const DEPOSIT_BUFFER   = parseFloat(process.env.DEPOSIT_BUFFER || "10"); // $extra para el cálculo del aviso
const POLL_INTERVAL_MS = 30_000; // revisar cada 30 segundos

// ── DB ────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const processing = new Set(); // evita procesar la misma orden dos veces

function log(msg) {
  const t = new Date().toLocaleTimeString("es-AR", { hour12: false });
  console.log(`[${t}] ${msg}`);
}

function nid() {
  return "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Telegram ──────────────────────────────────────────────────────────────────
async function telegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:    TELEGRAM_CHAT_ID,
        text:       msg,
        parse_mode: "HTML",
      }),
    });
  } catch { /* no bloquear */ }
}

// ── npprteam API ──────────────────────────────────────────────────────────────
async function getSupplierBalance() {
  const res = await fetch(`${NPPRTEAM_BASE}/balance`, {
    headers: { "X-API-KEY": NPPRTEAM_API_KEY, "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`npprteam balance error: ${res.status}`);
  const d = await res.json();
  return parseFloat(d.totalBalance ?? d.primaryBalance ?? 0);
}

async function supplierCreateOrder(productId, qty) {
  const res = await fetch(`${NPPRTEAM_BASE}/order`, {
    method: "POST",
    headers: { "X-API-KEY": NPPRTEAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ productId: parseInt(productId), qty: parseInt(qty) }),
  });
  let data;
  try   { data = await res.json(); }
  catch { data = { message: `HTTP ${res.status}` }; }
  return { ok: res.ok, data };
}

// ── Telegram con botón inline ─────────────────────────────────────────────────
async function telegramWithButton(msg, buttonText, buttonUrl) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id:      TELEGRAM_CHAT_ID,
        text:         msg,
        parse_mode:   "HTML",
        reply_markup: {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]],
        },
      }),
    });
  } catch { /* no bloquear */ }
}


// ── Notificación in-app ───────────────────────────────────────────────────────
async function createNotification({ userEmail, type, title, body, orderId }) {
  await pool.query(
    `INSERT INTO "Notification" (id, "userEmail", type, title, body, "orderId", read, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
    [nid(), userEmail, type, title, body, orderId || null]
  ).catch(() => {});
}

// ── Email de entrega (via Resend directo) ─────────────────────────────────────
async function sendDeliveryEmail({ to, orderId, productSummary }) {
  const SMTP_API = process.env.SMTP_PASS; // Resend API key
  if (!SMTP_API) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${SMTP_API}`,
      },
      body: JSON.stringify({
        from:    `BM Verificada <${process.env.SMTP_FROM || "soporte@mail.bmverificada.space"}>`,
        to:      [to],
        subject: `📦 Tu pedido #${orderId.slice(-8)} fue entregado`,
        html: `
          <h2>¡Tu pedido fue entregado!</h2>
          <p>Orden: <strong>#${orderId.slice(-8)}</strong></p>
          <pre style="background:#f5f5f5;padding:16px;border-radius:8px;font-size:13px;">${productSummary}</pre>
          <p>Gracias por tu compra en <strong>BM Verificada</strong>.</p>
        `,
      }),
    });
  } catch { /* no-blocking */ }
}

// ── Fulfillment de una orden ──────────────────────────────────────────────────
async function fulfillOrder(order) {
  if (processing.has(order.id)) return;
  processing.add(order.id);

  log(`\n🔄 Orden #${order.id.slice(-8)} | ${order.userEmail} | $${parseFloat(order.total).toFixed(2)}`);

  try {
    // 1. Traer items con datos del producto proveedor
    const { rows: items } = await pool.query(`
      SELECT oi.id, oi.name, oi.price, oi.cost, oi.qty, oi."productId",
             p."supplierProductId", p."minQty"
      FROM "OrderItem" oi
      LEFT JOIN "Product" p ON p.id = oi."productId"
      WHERE oi."orderId" = $1
    `, [order.id]);

    if (items.length === 0) {
      log(`   ⚠️ Sin items — skip`);
      return;
    }

    // 2. Verificar que todos tengan proveedor
    const allHaveSupplier = items.every(i => i.supplierProductId);
    if (!allHaveSupplier) {
      log(`   ⚠️ Items sin supplierProductId — skip (necesita entrega manual)`);
      return;
    }

    // 3. Calcular costo total
    const totalCost = items.reduce((sum, i) =>
      sum + (parseFloat(i.cost || 0) * (parseInt(i.qty) || 1)), 0
    );
    log(`   💰 Costo al proveedor: $${totalCost.toFixed(2)}`);

    // 4. Chequear saldo npprteam
    let balance = await getSupplierBalance();
    log(`   💰 Saldo npprteam: $${balance.toFixed(2)}`);

    // 5. Verificar saldo — si no alcanza, alertar y esperar recarga manual
    if (balance < totalCost) {
      const needed = (totalCost + DEPOSIT_BUFFER).toFixed(2);
      log(`   ⚠️ Saldo insuficiente ($${balance.toFixed(2)} < $${totalCost.toFixed(2)}) — esperando recarga manual`);

      const retryUrl = `${BASE_URL}/api/admin/retry-fulfillment?orderId=${order.id}&secret=${CRON_SECRET}`;

      await telegramWithButton(
        `⚠️ <b>SALDO INSUFICIENTE EN NPPRTEAM</b>\n\n` +
        `🆔 Orden: #${order.id.slice(-8)}\n` +
        `👤 ${order.userName} (${order.userEmail})\n` +
        `💰 Saldo actual: <b>$${balance.toFixed(2)}</b>\n` +
        `🛒 Costo orden: <b>$${totalCost.toFixed(2)}</b>\n` +
        `💸 Necesitás recargar al menos <b>$${needed}</b> en npprteam\n\n` +
        `👇 Una vez recargado, tocá el botón para entregar automáticamente:`,
        "✅ Recargué · Entregar ahora",
        retryUrl
      );

      // La orden queda en "paid" sin deliveryContent — retry-fulfillment la procesa cuando el admin toca el botón
      return;
    }

    // 6. Comprar al proveedor
    log(`   🛒 Comprando al proveedor...`);
    const deliveryParts = [];
    let allDelivered    = true;

    for (const item of items) {
      const minQty = Math.max(1, parseInt(item.minQty) || 1);
      const qty    = Math.max(parseInt(item.qty) || 1, minQty);

      const { ok, data } = await supplierCreateOrder(item.supplierProductId, qty);

      if (ok && data.orderId) {
        const realItems = (data.items || []).filter(
          x => x && x !== "Please contact website admin"
        );
        if (realItems.length > 0) {
          deliveryParts.push(`📦 ${item.name}:\n${realItems.join("\n")}`);
          log(`   ✅ ${item.name} → ${realItems.length} credencial(es)`);
        } else {
          deliveryParts.push(`📦 ${item.name}:\n[Pedido #${data.orderId} — credenciales pendientes del proveedor]`);
          allDelivered = false;
          log(`   ⚠️ ${item.name} → pedido creado #${data.orderId} pero credenciales pendientes`);
        }
      } else {
        deliveryParts.push(`📦 ${item.name}:\n[Error proveedor: ${data?.message || "desconocido"}]`);
        allDelivered = false;
        log(`   ❌ ${item.name} → error: ${data?.message}`);
      }
    }

    const deliveryContent = deliveryParts.join("\n\n---\n\n");
    const newStatus       = allDelivered ? "delivered" : "paid";

    // 7. Actualizar orden en DB
    await pool.query(
      `UPDATE "Order" SET "deliveryContent" = $1, status = $2, "updatedAt" = NOW() WHERE id = $3`,
      [deliveryContent, newStatus, order.id]
    );

    if (allDelivered) {
      // Notificación in-app
      await createNotification({
        userEmail: order.userEmail,
        type:      "order_delivered",
        title:     "📦 ¡Tu pedido fue entregado!",
        body:      `#${order.id.slice(-8)} · Recibí tus accesos`,
        orderId:   order.id,
      });

      // Incrementar ventas del producto
      for (const item of items) {
        if (item.productId) {
          await pool.query(
            `UPDATE "Product" SET sales = sales + $1 WHERE id = $2`,
            [parseInt(item.qty) || 1, item.productId]
          ).catch(() => {});
        }
      }

      // Email al cliente
      await sendDeliveryEmail({
        to:             order.userEmail,
        orderId:        order.id,
        productSummary: deliveryContent,
      });

      log(`   🎉 Orden #${order.id.slice(-8)} ENTREGADA ✅`);

      const margin = parseFloat(order.total) - totalCost;
      await telegram(
        `🎉 <b>DROPSHIPPING COMPLETADO ✅</b>\n\n` +
        `👤 ${order.userName} (${order.userEmail})\n` +
        `🆔 Orden: #${order.id.slice(-8)}\n` +
        `💵 Cobrado: <b>$${parseFloat(order.total).toFixed(2)}</b> | ` +
        `Costo: $${totalCost.toFixed(2)} | ` +
        `Margen: <b>$${margin.toFixed(2)}</b> 💰\n` +
        `📦 Entregado automáticamente`
      );

    } else {
      log(`   ⚠️ Orden #${order.id.slice(-8)} — comprada pero entrega parcial, revisar manualmente`);
      await telegram(
        `⚠️ <b>Entrega parcial</b>\n\nOrden #${order.id.slice(-8)}\n` +
        `Productos comprados al proveedor pero algunas credenciales pendientes.\nRevisar manualmente.`
      );
    }

  } catch (err) {
    log(`   ❌ Error en orden #${order.id.slice(-8)}: ${err.message}`);
    await telegram(
      `❌ <b>ERROR WATCHER</b>\n\n` +
      `Orden: #${order.id.slice(-8)}\n` +
      `Error: ${err.message}\n\n` +
      `La orden sigue como "paid" — podés entregar manualmente desde el panel.`
    );
  } finally {
    processing.delete(order.id);
  }
}

// ── Loop principal ────────────────────────────────────────────────────────────
async function checkOrders() {
  try {
    const { rows: orders } = await pool.query(`
      SELECT id, "userEmail", "userName", total, network, "createdAt"
      FROM "Order"
      WHERE status = 'paid'
        AND "deliveryContent" IS NULL
        AND "createdAt" > NOW() - INTERVAL '12 hours'
      ORDER BY "createdAt" ASC
    `);

    if (orders.length > 0) {
      log(`\n🔍 ${orders.length} orden(es) paga(s) sin entregar`);
      for (const order of orders) {
        await fulfillOrder(order);
      }
    }
  } catch (err) {
    log(`❌ Error en checkOrders: ${err.message}`);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  log("╔══════════════════════════════════════════════╗");
  log("║   BM Verificada — Dropshipping Watcher       ║");
  log("╚══════════════════════════════════════════════╝");
  log(`Buffer aviso: $${DEPOSIT_BUFFER} | Intervalo: ${POLL_INTERVAL_MS / 1000}s`);

  // Validar config mínima
  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!NPPRTEAM_API_KEY)         missing.push("NPPRTEAM_API_KEY");

  if (missing.length > 0) {
    log(`\n❌ Faltan variables de entorno: ${missing.join(", ")}`);
    log("   Completá el archivo .env y reiniciá.");
    process.exit(1);
  }

  log("\n✅ Config OK — iniciando watcher...\n");
  await telegram("🚀 <b>BM Verificada Watcher iniciado</b>\nDropshipping automático activo ✅");

  // Primera corrida inmediata
  await checkOrders();

  // Loop cada 30 segundos
  setInterval(checkOrders, POLL_INTERVAL_MS);
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
