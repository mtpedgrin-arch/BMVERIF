const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;

async function send(chatId, text) {
  const token = TOKEN();
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

// Soporte: usa TELEGRAM_CHAT_ID
export async function sendTelegramNotification(text) {
  await send(process.env.TELEGRAM_CHAT_ID, text);
}

// Ventas/compras: usa TELEGRAM_ORDERS_CHAT_ID (si no está, cae al mismo chat de soporte)
export async function sendTelegramOrderNotification(text) {
  await send(process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID, text);
}
