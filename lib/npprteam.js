// ─── npprteam.shop API client ─────────────────────────────────────────────────
// Docs: https://npprteam.shop — API key en env var NPPRTEAM_API_KEY

const BASE = "https://npprteam.shop/api/shop";

function getHeaders() {
  return {
    "X-API-KEY": process.env.NPPRTEAM_API_KEY || "",
    "Content-Type": "application/json",
  };
}

/** Saldo disponible en la cuenta del proveedor */
export async function supplierGetBalance() {
  const res = await fetch(`${BASE}/balance`, { headers: getHeaders() });
  if (!res.ok) throw new Error(`npprteam balance error: ${res.status}`);
  return res.json(); // { currency, primaryBalance, cashbackBalance, totalBalance }
}

/** Lista todos los productos del proveedor */
export async function supplierGetProducts() {
  const res = await fetch(`${BASE}/products`, { headers: getHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`npprteam products error: ${res.status} — ${body}`);
  }
  return res.json();
}

/** Detalle de un producto por su ID */
export async function supplierGetProduct(productId) {
  const res = await fetch(`${BASE}/product/${productId}`, { headers: getHeaders() });
  const data = await res.json();
  return { ok: res.ok, data };
}

/** Crea una orden en npprteam.shop y devuelve { ok, status, data } */
export async function supplierCreateOrder(productId, qty) {
  const res = await fetch(`${BASE}/order`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      productId: parseInt(productId, 10),
      qty:       parseInt(qty, 10),
    }),
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/** Obtiene el detalle de una orden del proveedor */
export async function supplierGetOrder(orderId) {
  const res = await fetch(`${BASE}/order/${orderId}`, { headers: getHeaders() });
  return res.json();
}
