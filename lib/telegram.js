const TOKEN = () => process.env.TELEGRAM_BOT_TOKEN;

async function send(chatId, text, extra = {}) {
  const token = TOKEN();
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
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

// Ventas con botón URL inline (para retry de fulfillment)
export async function sendTelegramOrderWithButton(text, buttonText, buttonUrl) {
  const chatId = process.env.TELEGRAM_ORDERS_CHAT_ID || process.env.TELEGRAM_CHAT_ID;
  await send(chatId, text, {
    reply_markup: { inline_keyboard: [[{ text: buttonText, url: buttonUrl }]] },
  });
}
