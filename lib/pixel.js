// ─── CLIENT-SIDE META PIXEL HELPER ────────────────────────────────────────────
// Pixel ID is public (NEXT_PUBLIC_) — safe to expose in browser
export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

/**
 * Fire a standard Meta Pixel event.
 * @param {string} eventName  e.g. "AddToCart", "Purchase"
 * @param {object} params     event parameters (value, currency, etc.)
 * @param {object} options    fbq options — use { eventID: "..." } for CAPI deduplication
 */
export function trackEvent(eventName, params = {}, options = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  if (Object.keys(options).length > 0) {
    window.fbq("track", eventName, params, options);
  } else {
    window.fbq("track", eventName, params);
  }
}

/**
 * Fire a custom Meta Pixel event (not a standard event).
 */
export function trackCustom(eventName, params = {}) {
  if (typeof window === "undefined" || !window.fbq) return;
  window.fbq("trackCustom", eventName, params);
}

/**
 * Re-initialize the pixel with Advanced Matching data for a logged-in user.
 * Call this once after the user session is loaded.
 * Meta handles the SHA-256 hashing internally.
 */
export function initPixelWithUser(user) {
  if (!PIXEL_ID || !user?.email) return;
  if (typeof window === "undefined" || !window.fbq) return;
  const nameParts = (user.name || "").trim().split(" ");
  window.fbq("init", PIXEL_ID, {
    em: user.email,
    ...(nameParts[0] ? { fn: nameParts[0].toLowerCase() } : {}),
    ...(nameParts[1] ? { ln: nameParts[nameParts.length - 1].toLowerCase() } : {}),
  });
}
