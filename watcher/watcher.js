/**
 * BM Verificada — Dropshipping Watcher
 * ──────────────────────────────────────────────────────────────────────────────
 * Corre en tu PC 24/7. Cada 30 segundos revisa si hay órdenes pagas sin
 * entregar. Si el saldo en npprteam es insuficiente, usa Playwright para
 * obtener la wallet + monto exacto del depósito, y TronWeb para enviarlo
 * directamente con precisión de 6 decimales (sin el límite de 2 decimales
 * de Cryptomus). Luego compra al proveedor y entrega al cliente.
 *
 * Setup: ver README.md
 */

require("dotenv").config();
const { chromium } = require("playwright");
const { Pool }     = require("pg");
const TronWeb      = require("tronweb");
const { ethers }   = require("ethers");

// ── Config ────────────────────────────────────────────────────────────────────
const NPPRTEAM_BASE     = "https://npprteam.shop/api/shop";
const NPPRTEAM_SITE     = "https://npprteam.shop";
const NPPRTEAM_API_KEY  = process.env.NPPRTEAM_API_KEY  || "";
const NPPRTEAM_EMAIL    = process.env.NPPRTEAM_EMAIL    || "";
const NPPRTEAM_PASSWORD = process.env.NPPRTEAM_PASSWORD || "";

// Red para fondear npprteam: "TRC20" (TRON) — npprteam solo acepta TRC20
// BEP20 disponible si en el futuro cambiás de proveedor
const TOPUP_NETWORK     = (process.env.TOPUP_NETWORK || "TRC20").toUpperCase();

// TRC20 (TRON)
const TRON_PRIVATE_KEY  = process.env.TRON_PRIVATE_KEY  || "";
const USDT_TRC20        = "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t";

// BEP20 (BSC) — fee ~$0.10, mucho más barato que TRC20
const EVM_PRIVATE_KEY   = process.env.EVM_PRIVATE_KEY   || "";
const USDT_BEP20        = "0x55d398326f99059fF775485246999027B3197955"; // USDT en BSC
const BSC_RPC           = "https://bsc-dataseed1.binance.org";

const BASE_URL          = process.env.NEXTAUTH_URL || "https://bmverificada.space";
const CRON_SECRET       = process.env.CRON_SECRET  || "bmverif_cron_2026";

const TELEGRAM_TOKEN    = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_CHAT_ID  = process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID || "";

// Cuándo disparar recarga: si el saldo baja de este monto, recarga aunque pueda cubrir la orden
const MIN_BALANCE      = parseFloat(process.env.MIN_BALANCE   || "30");  // recargar cuando balance < $30
// A cuánto dejar el saldo después de recargar (cubre muchas órdenes de una sola vez)
const TOPUP_TARGET     = parseFloat(process.env.TOPUP_TARGET  || "100"); // dejar $100 en npprteam

const POLL_INTERVAL_MS = 30_000;  // revisar cada 30 segundos
const BALANCE_POLL_MS  = 20_000;  // esperar 20s entre chequeos de balance npprteam
const BALANCE_MAX_WAIT = 18;      // máx 18 intentos = 6 minutos

// ── DB ────────────────────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// ── Helpers ───────────────────────────────────────────────────────────────────
const processing = new Set();

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
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: msg, parse_mode: "HTML" }),
    });
  } catch { /* no bloquear */ }
}

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
        reply_markup: { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] },
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

// ── Envío USDT directo — TRC20 (TronWeb) o BEP20 (ethers/BSC) ────────────────
async function sendUSDTDirect(toAddress, amountUSDT) {
  if (TOPUP_NETWORK === "BEP20") return sendUSDTBEP20(toAddress, amountUSDT);
  return sendUSDTTRC20(toAddress, amountUSDT);
}

// TRC20 via TronWeb — fee ~$1-2, necesita TRX en la wallet
async function sendUSDTTRC20(toAddress, amountUSDT) {
  const tronWeb = new TronWeb({ fullHost: "https://api.trongrid.io", privateKey: TRON_PRIVATE_KEY });
  // USDT TRC20 = 6 decimales → entero exacto, sin redondeo bancario
  const amountUnits = Math.round(parseFloat(amountUSDT) * 1_000_000);
  log(`   🔑 TRC20: ${amountUSDT} USDT (${amountUnits} units) → ${toAddress}`);
  const contract = await tronWeb.contract().at(USDT_TRC20);
  const txId = await contract.transfer(toAddress, amountUnits).send({
    feeLimit: 30_000_000, shouldPollResponse: false,
  });
  log(`   ✅ TX TRC20: ${txId}`);
  return txId;
}

// BEP20 via ethers/BSC — fee ~$0.10, necesita BNB en la wallet
async function sendUSDTBEP20(toAddress, amountUSDT) {
  const provider = new ethers.JsonRpcProvider(BSC_RPC);
  const wallet   = new ethers.Wallet(EVM_PRIVATE_KEY, provider);
  const usdt     = new ethers.Contract(USDT_BEP20, [
    "function transfer(address to, uint256 amount) returns (bool)",
  ], wallet);
  // ethers.parseUnits mantiene precisión exacta para cualquier cantidad de decimales
  const amountUnits = ethers.parseUnits(String(amountUSDT), 18);
  log(`   🔑 BEP20: ${amountUSDT} USDT → ${toAddress}`);
  const tx = await usdt.transfer(toAddress, amountUnits);
  await tx.wait(1); // 1 confirmación BSC (~3 segundos)
  log(`   ✅ TX BEP20: ${tx.hash}`);
  return tx.hash;
}

// ── Playwright: obtener wallet y monto exacto de npprteam ─────────────────────
async function npprteamGetDepositInfo(amount) {
  log(`🎭 Playwright: obteniendo dirección de depósito en npprteam (~$${amount.toFixed(2)})...`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page    = await context.newPage();

  try {
    // 1. Login ─────────────────────────────────────────────────────────────────
    await page.goto(`${NPPRTEAM_SITE}/en/login`, { waitUntil: "networkidle", timeout: 30_000 });

    if (page.url().includes("/login")) {
      await page.locator("input[type='email'], input[name='email'], #email").fill(NPPRTEAM_EMAIL);
      await page.locator("input[type='password'], input[name='password'], #password").fill(NPPRTEAM_PASSWORD);
      await page.locator("button[type='submit'], button:has-text('Log'), button:has-text('Sign')").first().click();
      await page.waitForURL(url => !url.includes("/login"), { timeout: 15_000 });
      log("   ✅ Login OK en npprteam");
    }

    // 2. Página de depósito ────────────────────────────────────────────────────
    await page.goto(`${NPPRTEAM_SITE}/en/profile/balance`, { waitUntil: "networkidle", timeout: 30_000 });

    // 3. Ingresar monto ────────────────────────────────────────────────────────
    const amountInput = page.locator(
      "input[placeholder*='Amount' i], input[placeholder*='amount' i], input[name='amount']"
    ).first();
    await amountInput.fill(String(Math.ceil(amount)));
    log(`   Monto ingresado: $${Math.ceil(amount)}`);

    // 4. Seleccionar red de pago ───────────────────────────────────────────────
    const networkLabel = TOPUP_NETWORK === "BEP20" ? "USDT BEP20" : "USDT TRC20";
    const methodDropdown = page.locator("[class*='select'], [class*='dropdown'], [class*='payment-method']").first();
    if (await methodDropdown.count() > 0) {
      await methodDropdown.click();
      await sleep(500);
    }
    await page.locator(`text=${networkLabel}`).first().click();
    log(`   ${networkLabel} seleccionado`);
    await sleep(500);

    // 5. Aceptar términos ──────────────────────────────────────────────────────
    const checkbox = page.locator("input[type='checkbox']").first();
    if (await checkbox.count() > 0 && !(await checkbox.isChecked())) {
      await checkbox.check();
    }

    // 6. Continue ──────────────────────────────────────────────────────────────
    await page.locator("button:has-text('Continue'), button[type='submit']").first().click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 });

    // 7. Extraer wallet address + monto exacto ─────────────────────────────────
    const bodyText = await page.locator("body").innerText();

    // Detectar dirección según red:
    // TRC20 → empieza con T, 34 chars  |  BEP20 → empieza con 0x, 42 chars
    const addrRegex = TOPUP_NETWORK === "BEP20"
      ? /0x[a-fA-F0-9]{40}/
      : /T[A-Za-z0-9]{33}/;
    const addrFallbackTest = TOPUP_NETWORK === "BEP20"
      ? (v) => /^0x[a-fA-F0-9]{40}$/.test(v.trim())
      : (v) => /^T[A-Za-z0-9]{33}$/.test(v.trim());

    const addrMatch = bodyText.match(addrRegex);

    // Monto exacto con decimales (ej: 65.0076)
    const amountMatches = [...bodyText.matchAll(/(\d+\.\d{2,6})/g)];
    const exactAmount   = amountMatches
      .map(m => parseFloat(m[1]))
      .find(v => v > amount * 0.5 && v < amount * 3);

    // Fallback: buscar en inputs readonly
    let address = addrMatch ? addrMatch[0] : null;
    if (!address) {
      const inputs = await page.locator("input[readonly], [class*='copy']").all();
      for (const el of inputs) {
        const val = (await el.inputValue().catch(() => "")) || (await el.innerText().catch(() => ""));
        if (addrFallbackTest(val)) { address = val.trim(); break; }
      }
    }

    if (!address || !exactAmount) {
      await page.screenshot({ path: "deposit-debug.png" });
      throw new Error(
        `No se pudo extraer wallet/monto [${networkLabel}]. ` +
        `address=${address}, amount=${exactAmount}. Ver deposit-debug.png`
      );
    }

    log(`   ✅ Depósito listo [${networkLabel}] → ${address} | Monto exacto: ${exactAmount} USDT`);
    return { address, exactAmount };

  } finally {
    await browser.close();
  }
}

// ── Esperar que npprteam acredite el balance ───────────────────────────────────
async function waitForBalance(needed, attempt = 0) {
  if (attempt >= BALANCE_MAX_WAIT) {
    throw new Error(
      `Timeout: npprteam no acreditó el saldo en ${(BALANCE_MAX_WAIT * BALANCE_POLL_MS / 60_000).toFixed(1)} min`
    );
  }
  const bal = await getSupplierBalance();
  if (bal >= needed) {
    log(`   ✅ Balance acreditado: $${bal.toFixed(2)}`);
    return bal;
  }
  log(`   ⏳ Balance: $${bal.toFixed(2)} / necesito $${needed.toFixed(2)} — intento ${attempt + 1}/${BALANCE_MAX_WAIT}`);
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
  const apiKey = process.env.SMTP_PASS;
  if (!apiKey) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
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
    // 1. Items con datos del producto proveedor
    const { rows: items } = await pool.query(`
      SELECT oi.id, oi.name, oi.price, oi.cost, oi.qty, oi."productId",
             p."supplierProductId", p."minQty"
      FROM "OrderItem" oi
      LEFT JOIN "Product" p ON p.id = oi."productId"
      WHERE oi."orderId" = $1
    `, [order.id]);

    if (items.length === 0) { log(`   ⚠️ Sin items — skip`); return; }

    // 2. Verificar supplierProductId
    const allHaveSupplier = items.every(i => i.supplierProductId);
    if (!allHaveSupplier) {
      log(`   ⚠️ Items sin supplierProductId — requiere entrega manual`);
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

    // 5. Fondear si es necesario — en lotes para amortizar el fee TRC20
    // Recarga cuando: no alcanza para la orden  O  el balance bajó del mínimo operativo
    const needsTopup = balance < totalCost || balance < MIN_BALANCE;
    if (needsTopup) {
      // Depositar lo necesario para llegar a TOPUP_TARGET
      // Ej: balance=$5, totalCost=$8.60, TOPUP_TARGET=$100 → depositar $95
      const depositAmount = Math.max(totalCost - balance, TOPUP_TARGET - balance);
      log(`   💸 Recargando npprteam: depositar $${depositAmount.toFixed(2)} (saldo actual $${balance.toFixed(2)}, objetivo $${TOPUP_TARGET})`);

      await telegram(
        `♻️ <b>AUTO-RECARGA NPPRTEAM</b>\n\n` +
        `🆔 Orden: #${order.id.slice(-8)}\n` +
        `👤 ${order.userName} (${order.userEmail})\n` +
        `💰 Saldo actual: <b>$${balance.toFixed(2)}</b>\n` +
        `🛒 Costo esta orden: <b>$${totalCost.toFixed(2)}</b>\n` +
        `💸 Depositando: <b>$${depositAmount.toFixed(2)}</b> USDT (objetivo: $${TOPUP_TARGET})\n` +
        `⏳ Abriendo npprteam...`
      );

      // Playwright → wallet address + monto exacto con todos sus decimales
      const { address, exactAmount } = await npprteamGetDepositInfo(depositAmount);

      // TronWeb → envío directo con 6 decimales de precisión (sin redondeo)
      log(`   💸 Enviando ${exactAmount} USDT → ${address} via TronWeb...`);
      const txId = await sendUSDTDirect(address, exactAmount);

      await telegram(
        `💸 <b>USDT ENVIADO</b>\n` +
        `${exactAmount} USDT → <code>${address}</code>\n` +
        `🔗 TX: <code>${txId}</code>\n` +
        `⏳ Esperando acreditación en npprteam (~3-6 min)...`
      );

      // Esperar que npprteam acredite el saldo
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
        const realItems = (data.items || []).filter(x => x && x !== "Please contact website admin");
        if (realItems.length > 0) {
          deliveryParts.push(`📦 ${item.name}:\n${realItems.join("\n")}`);
          log(`   ✅ ${item.name} → ${realItems.length} credencial(es)`);
        } else {
          deliveryParts.push(`📦 ${item.name}:\n[Pedido #${data.orderId} — credenciales pendientes]`);
          allDelivered = false;
          log(`   ⚠️ ${item.name} → pedido #${data.orderId} creado, credenciales pendientes`);
        }
      } else {
        deliveryParts.push(`📦 ${item.name}:\n[Error: ${data?.message || "desconocido"}]`);
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
      await createNotification({
        userEmail: order.userEmail,
        type:      "order_delivered",
        title:     "📦 ¡Tu pedido fue entregado!",
        body:      `#${order.id.slice(-8)} · Recibí tus accesos`,
        orderId:   order.id,
      });

      for (const item of items) {
        if (item.productId) {
          await pool.query(
            `UPDATE "Product" SET sales = sales + $1 WHERE id = $2`,
            [parseInt(item.qty) || 1, item.productId]
          ).catch(() => {});
        }
      }

      await sendDeliveryEmail({ to: order.userEmail, orderId: order.id, productSummary: deliveryContent });

      const margin = parseFloat(order.total) - totalCost;
      log(`   🎉 Orden #${order.id.slice(-8)} ENTREGADA ✅`);
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
      const retryUrl = `${BASE_URL}/api/admin/retry-fulfillment?orderId=${order.id}&secret=${CRON_SECRET}`;
      log(`   ⚠️ Entrega parcial — revisar manualmente`);
      await telegramWithButton(
        `⚠️ <b>Entrega parcial</b>\n\n` +
        `Orden #${order.id.slice(-8)} — comprada al proveedor pero sin credenciales aún.\n` +
        `Tocá el botón cuando el proveedor las cargue:`,
        "🔄 Reintentar entrega",
        retryUrl
      );
    }

  } catch (err) {
    log(`   ❌ Error en orden #${order.id.slice(-8)}: ${err.message}`);
    const retryUrl = `${BASE_URL}/api/admin/retry-fulfillment?orderId=${order.id}&secret=${CRON_SECRET}`;
    await telegramWithButton(
      `❌ <b>ERROR WATCHER</b>\n\n` +
      `Orden: #${order.id.slice(-8)}\n` +
      `Error: ${err.message}\n\n` +
      `La orden sigue como "paid". Podés reintentar manualmente:`,
      "🔄 Reintentar ahora",
      retryUrl
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
      for (const order of orders) await fulfillOrder(order);
    }
  } catch (err) {
    log(`❌ checkOrders error: ${err.message}`);
  }
}

// ── Start ─────────────────────────────────────────────────────────────────────
async function main() {
  log("╔══════════════════════════════════════════════╗");
  log("║   BM Verificada — Dropshipping Watcher       ║");
  log("╚══════════════════════════════════════════════╝");
  log(`Red fondeo: ${TOPUP_NETWORK} | Min balance: $${MIN_BALANCE} | Objetivo: $${TOPUP_TARGET} | Intervalo: ${POLL_INTERVAL_MS / 1000}s`);

  const missing = [];
  if (!process.env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!NPPRTEAM_API_KEY)         missing.push("NPPRTEAM_API_KEY");
  if (!NPPRTEAM_EMAIL)           missing.push("NPPRTEAM_EMAIL");
  if (!NPPRTEAM_PASSWORD)        missing.push("NPPRTEAM_PASSWORD");
  // Validar la clave de la red elegida
  if (TOPUP_NETWORK === "BEP20" && !EVM_PRIVATE_KEY)  missing.push("EVM_PRIVATE_KEY");
  if (TOPUP_NETWORK === "TRC20" && !TRON_PRIVATE_KEY) missing.push("TRON_PRIVATE_KEY");

  if (missing.length > 0) {
    log(`\n❌ Faltan variables de entorno: ${missing.join(", ")}`);
    log("   Completá el archivo .env y reiniciá.");
    process.exit(1);
  }

  log("\n✅ Config OK — iniciando watcher...\n");
  await telegram("🚀 <b>BM Verificada Watcher iniciado</b>\nDropshipping automático activo ✅");

  await checkOrders();
  setInterval(checkOrders, POLL_INTERVAL_MS);
}

main().catch(err => {
  console.error("Error fatal:", err);
  process.exit(1);
});
