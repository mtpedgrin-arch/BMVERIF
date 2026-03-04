/**
 * BM Verificada — Dropshipping Watcher
 * ──────────────────────────────────────────────────────────────────────────────
 * Corre en tu PC 24/7. Cada 30 segundos revisa si hay órdenes pagas sin
 * entregar. Si el saldo de npprteam es insuficiente, fondea automáticamente
 * usando Playwright + Cryptomus Payout, y luego compra y entrega al cliente.
 *
 * Setup: ver README.md
 */

require("dotenv").config();
const { chromium } = require("playwright");
const { Pool }     = require("pg");
const crypto       = require("crypto");

// ── Config ────────────────────────────────────────────────────────────────────
const NPPRTEAM_BASE      = "https://npprteam.shop/api/shop";
const NPPRTEAM_SITE      = "https://npprteam.shop";
const NPPRTEAM_API_KEY   = process.env.NPPRTEAM_API_KEY   || "";
const NPPRTEAM_EMAIL     = process.env.NPPRTEAM_EMAIL     || "";
const NPPRTEAM_PASSWORD  = process.env.NPPRTEAM_PASSWORD  || "";

const CRYPTOMUS_MERCHANT = process.env.CRYPTOMUS_MERCHANT_UUID || "";
const CRYPTOMUS_API_KEY  = process.env.CRYPTOMUS_API_KEY  || "";

const TELEGRAM_TOKEN     = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

const DEPOSIT_BUFFER     = parseFloat(process.env.DEPOSIT_BUFFER || "10"); // $extra por encima del costo
const POLL_INTERVAL_MS   = 30_000;  // revisar cada 30 segundos
const BALANCE_POLL_MS    = 20_000;  // esperar 20s entre chequeos de balance
const BALANCE_MAX_WAIT   = 18;      // máx 18 intentos = 6 minutos

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

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
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

// ── Cryptomus Payout ──────────────────────────────────────────────────────────
function cryptomusSign(body) {
  const json = JSON.stringify(body);
  const b64  = Buffer.from(json).toString("base64");
  return crypto.createHash("md5").update(b64 + CRYPTOMUS_API_KEY).digest("hex");
}

async function cryptomusPayout(address, amount, refId) {
  const body = {
    amount:      String(parseFloat(amount).toFixed(2)),
    currency:    "USDT",
    order_id:    `watcher_${refId}_${Date.now()}`,
    address,
    is_subtract: false,
    network:     "TRON",
  };
  const res = await fetch("https://api.cryptomus.com/v1/payout", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      merchant: CRYPTOMUS_MERCHANT,
      sign:     cryptomusSign(body),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.state !== 0) {
    throw new Error(data.message || `Cryptomus payout error ${res.status}`);
  }
  return data;
}

// ── Playwright: depósito en npprteam ─────────────────────────────────────────
async function npprteamDeposit(amount) {
  log(`🎭 Playwright: abriendo npprteam para depositar $${amount.toFixed(2)}...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page    = await context.newPage();

  try {
    // ── 1. Login ────────────────────────────────────────────────────────────
    await page.goto(`${NPPRTEAM_SITE}/en/login`, { waitUntil: "networkidle", timeout: 30_000 });

    if (page.url().includes("/login")) {
      // Completar login
      await page.locator("input[type='email'], input[name='email'], #email").fill(NPPRTEAM_EMAIL);
      await page.locator("input[type='password'], input[name='password'], #password").fill(NPPRTEAM_PASSWORD);
      await page.locator("button[type='submit'], button:has-text('Log'), button:has-text('Sign')").first().click();
      await page.waitForURL(url => !url.includes("/login"), { timeout: 15_000 });
      log("✅ Login OK en npprteam");
    } else {
      log("✅ Ya había sesión activa en npprteam");
    }

    // ── 2. Ir a la página de balance/depósito ────────────────────────────────
    await page.goto(`${NPPRTEAM_SITE}/en/profile/balance`, { waitUntil: "networkidle", timeout: 30_000 });

    // ── 3. Llenar monto ──────────────────────────────────────────────────────
    const amountInput = page.locator("input[placeholder*='Amount' i], input[placeholder*='amount' i], input[name='amount']").first();
    await amountInput.fill(String(Math.ceil(amount)));
    log(`   Monto ingresado: $${Math.ceil(amount)}`);

    // ── 4. Seleccionar USDT TRC20 ────────────────────────────────────────────
    // Abrir el dropdown de método de pago si existe
    const methodDropdown = page.locator("[class*='select'], [class*='dropdown'], [class*='payment-method']").first();
    if (await methodDropdown.count() > 0) {
      await methodDropdown.click();
      await sleep(500);
    }
    // Click en la opción USDT TRC20
    await page.locator("text=USDT TRC20").first().click();
    log("   Método USDT TRC20 seleccionado");
    await sleep(500);

    // ── 5. Aceptar términos (checkbox) ───────────────────────────────────────
    const checkbox = page.locator("input[type='checkbox']").first();
    if (await checkbox.count() > 0) {
      const checked = await checkbox.isChecked();
      if (!checked) await checkbox.check();
      log("   Checkbox de términos aceptado");
    }

    // ── 6. Click Continue ────────────────────────────────────────────────────
    await page.locator("button:has-text('Continue'), button[type='submit']").first().click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 });
    log("   Página de pago cargada");

    // ── 7. Extraer wallet address + monto exacto ─────────────────────────────
    const bodyText = await page.locator("body").innerText();

    // Dirección TRON: empieza con T, 34 caracteres
    const addressMatch = bodyText.match(/T[A-Za-z0-9]{33}/);
    // Monto exacto: número con decimales (ej: 65.0076)
    const amountMatches = [...bodyText.matchAll(/(\d+\.\d{2,6})/g)];
    const exactAmount = amountMatches
      .map(m => parseFloat(m[1]))
      .find(v => v > amount * 0.5 && v < amount * 3); // razonable respecto al monto

    // Fallback: buscar en inputs readonly (campos de copia)
    let address = addressMatch ? addressMatch[0] : null;
    if (!address) {
      const inputs = await page.locator("input[readonly], [class*='copy']").all();
      for (const el of inputs) {
        const val = (await el.inputValue().catch(() => "")) ||
                    (await el.innerText().catch(() => ""));
        if (/^T[A-Za-z0-9]{33}$/.test(val.trim())) {
          address = val.trim();
          break;
        }
      }
    }

    if (!address || !exactAmount) {
      // Guardar screenshot para debug
      await page.screenshot({ path: "deposit-debug.png" });
      throw new Error(
        `No se pudo extraer wallet o monto. address=${address}, amount=${exactAmount}. ` +
        `Ver deposit-debug.png para debug.`
      );
    }

    log(`✅ Depósito creado → Wallet: ${address} | Monto exacto: ${exactAmount} USDT`);
    return { address, exactAmount };

  } finally {
    await browser.close();
  }
}

// ── Esperar que el balance se acredite ────────────────────────────────────────
async function waitForBalance(needed, attempt = 0) {
  if (attempt >= BALANCE_MAX_WAIT) {
    throw new Error(
      `Timeout: npprteam no acreditó el saldo en ${(BALANCE_MAX_WAIT * BALANCE_POLL_MS / 60_000).toFixed(1)} minutos`
    );
  }
  const bal = await getSupplierBalance();
  if (bal >= needed) {
    log(`✅ Balance acreditado: $${bal.toFixed(2)} (necesitaba $${needed.toFixed(2)})`);
    return bal;
  }
  log(`⏳ Balance: $${bal.toFixed(2)} / necesito $${needed.toFixed(2)} — intento ${attempt + 1}/${BALANCE_MAX_WAIT}`);
  await sleep(BALANCE_POLL_MS);
  return waitForBalance(needed, attempt + 1);
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

    // 5. Fondear si es necesario
    if (balance < totalCost) {
      const needed = totalCost + DEPOSIT_BUFFER;
      log(`   💸 Saldo insuficiente → iniciando fondeo de $${needed.toFixed(2)}...`);

      await telegram(
        `♻️ <b>AUTO-FONDEO INICIADO</b>\n\n` +
        `🆔 Orden: #${order.id.slice(-8)}\n` +
        `👤 ${order.userName} (${order.userEmail})\n` +
        `💰 Saldo actual: <b>$${balance.toFixed(2)}</b>\n` +
        `🛒 Costo orden: <b>$${totalCost.toFixed(2)}</b>\n` +
        `💸 Depositando: <b>$${needed.toFixed(2)}</b> USDT\n` +
        `⏳ Esperando confirmación blockchain...`
      );

      // Playwright → crear depósito en npprteam
      const { address, exactAmount } = await npprteamDeposit(needed);

      // Cryptomus Payout → enviar USDT
      log(`   💸 Enviando $${exactAmount} USDT a ${address} via Cryptomus...`);
      await cryptomusPayout(address, exactAmount, order.id);
      log(`   ✅ Payout enviado. Esperando acreditación en npprteam...`);

      await telegram(
        `💸 <b>PAYOUT ENVIADO</b>\n` +
        `${exactAmount} USDT → <code>${address}</code>\n` +
        `⏳ Esperando que npprteam acredite (~3-6 min)...`
      );

      // Esperar que el balance se actualice
      balance = await waitForBalance(totalCost);

      await telegram(`✅ <b>Saldo acreditado:</b> $${balance.toFixed(2)} — comprando al proveedor...`);
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
  log(`Buffer extra: $${DEPOSIT_BUFFER} | Intervalo: ${POLL_INTERVAL_MS / 1000}s`);
  log(`Balance poll: cada ${BALANCE_POLL_MS / 1000}s, máx ${BALANCE_MAX_WAIT} intentos`);

  // Validar config
  const missing = [];
  if (!process.env.DATABASE_URL)        missing.push("DATABASE_URL");
  if (!NPPRTEAM_API_KEY)                missing.push("NPPRTEAM_API_KEY");
  if (!NPPRTEAM_EMAIL)                  missing.push("NPPRTEAM_EMAIL");
  if (!NPPRTEAM_PASSWORD)               missing.push("NPPRTEAM_PASSWORD");
  if (!CRYPTOMUS_MERCHANT)              missing.push("CRYPTOMUS_MERCHANT_UUID");
  if (!CRYPTOMUS_API_KEY)               missing.push("CRYPTOMUS_API_KEY");

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
