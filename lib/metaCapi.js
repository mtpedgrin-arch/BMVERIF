// ─── SERVER-SIDE META CONVERSIONS API (CAPI) HELPER ───────────────────────────
// Runs only on the server (API routes). Never exposed to the browser.
import crypto from "crypto";

const PIXEL_ID   = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const SITE_URL   = process.env.NEXTAUTH_URL || "https://bmverificada.com";

function sha256(value) {
  if (!value) return undefined;
  return crypto.createHash("sha256").update(String(value).trim().toLowerCase()).digest("hex");
}

/**
 * Send an event to Meta Conversions API.
 *
 * @param {object} opts
 * @param {string}  opts.eventName   "Purchase" | "Lead" | etc.
 * @param {string}  opts.eventId     Deduplication ID — must match the fbq eventID on the client
 * @param {string}  [opts.email]     User email (will be SHA-256 hashed)
 * @param {string}  [opts.ip]        Client IP (from x-forwarded-for header)
 * @param {string}  [opts.userAgent] Browser UA (from user-agent header)
 * @param {string}  [opts.orderId]   Order ID for Purchase events
 * @param {number}  [opts.value]     Transaction value in USD
 * @param {string}  [opts.currency]  Default "USD"
 */
export async function sendCapiEvent({
  eventName,
  eventId,
  email,
  ip,
  userAgent,
  orderId,
  value,
  currency = "USD",
}) {
  if (!PIXEL_ID || !CAPI_TOKEN) return;

  const event = {
    event_name:       eventName,
    event_time:       Math.floor(Date.now() / 1000),
    event_id:         eventId || `${eventName}_${orderId || Date.now()}`,
    action_source:    "website",
    event_source_url: SITE_URL,
    user_data:        {},
    custom_data:      {},
  };

  // ── User data (hashed) ──
  if (email)     event.user_data.em                  = sha256(email);
  if (ip)        event.user_data.client_ip_address   = ip;
  if (userAgent) event.user_data.client_user_agent   = userAgent;

  // ── Custom data ──
  if (orderId != null) event.custom_data.order_id = orderId;
  if (value   != null) { event.custom_data.value = value; event.custom_data.currency = currency; }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ data: [event] }),
      }
    );
    if (!res.ok) {
      const text = await res.text();
      console.error("[MetaCAPI] Error:", text);
    }
  } catch (e) {
    console.error("[MetaCAPI] Fetch failed:", e.message);
  }
}
