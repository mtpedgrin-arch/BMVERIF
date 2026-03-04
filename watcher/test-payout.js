/**
 * Test rápido del Cryptomus Payout API
 * Uso: node test-payout.js <wallet_TRC20> <monto>
 * Ejemplo: node test-payout.js TQ1vZTEuoJmqpasUJcyp7HFRygLJdtcZL7 5
 */

require("dotenv").config();
const crypto = require("crypto");

const CRYPTOMUS_MERCHANT = process.env.CRYPTOMUS_MERCHANT_UUID;
const CRYPTOMUS_API_KEY  = process.env.CRYPTOMUS_API_KEY;

const address = process.argv[2];
const amount  = process.argv[3];

if (!address || !amount) {
  console.log("Uso: node test-payout.js <wallet_TRC20> <monto>");
  console.log("Ejemplo: node test-payout.js TQtu8oBnaEh3CCRv8koQaTKPLHf8ABCDEF 5");
  process.exit(1);
}

if (!CRYPTOMUS_MERCHANT || !CRYPTOMUS_API_KEY) {
  console.log("❌ Falta CRYPTOMUS_MERCHANT_UUID o CRYPTOMUS_API_KEY en .env");
  process.exit(1);
}

function sign(body) {
  const json = JSON.stringify(body);
  const b64  = Buffer.from(json).toString("base64");
  return crypto.createHash("md5").update(b64 + CRYPTOMUS_API_KEY).digest("hex");
}

async function main() {
  const body = {
    amount:      String(parseFloat(amount).toFixed(2)),
    currency:    "USDT",
    order_id:    `test_${Date.now()}`,
    address,
    is_subtract: false,
    network:     "TRON",
  };

  console.log("\n📤 Enviando payout...");
  console.log(`   Monto:   ${body.amount} USDT`);
  console.log(`   Wallet:  ${address}`);
  console.log(`   Red:     TRC20 (TRON)\n`);

  const res = await fetch("https://api.cryptomus.com/v1/payout", {
    method:  "POST",
    headers: {
      "Content-Type": "application/json",
      merchant: CRYPTOMUS_MERCHANT,
      sign:     sign(body),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (res.ok && data.state === 0) {
    console.log("✅ Payout creado exitosamente!");
    console.log(`   UUID:   ${data.result?.uuid}`);
    console.log(`   Estado: ${data.result?.status}`);
    console.log("\n🎉 El payout API funciona. El watcher está listo para usar.");
  } else {
    console.log("❌ Error en el payout:");
    console.log(JSON.stringify(data, null, 2));
    console.log("\nPosibles causas:");
    console.log("  - KYC no verificado en Cryptomus");
    console.log("  - Saldo insuficiente en el merchant");
    console.log("  - API key incorrecta");
  }
}

main().catch(console.error);
