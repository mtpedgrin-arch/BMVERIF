"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// ─── WALLETS ──────────────────────────────────────────────────────────────────
const WALLETS = {
  TRC20: { addr: "TN3W4T6ATGBY9yGGxSUxxsLSzKWp1Aqbnk", network: "TRON (TRC20)", fee: "~1 USDT", time: "1–3 min", color: "#E84142", logo: "🔴" },
  BEP20: { addr: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", network: "BNB Smart Chain (BEP20)", fee: "~0.10 USDT", time: "3–5 min", color: "#F0B90B", logo: "🟡" },
};

// ─── GLOBAL ORDERS DB ─────────────────────────────────────────────────────────
const ORDERS_DB = [
  { id: "ORD-001", userEmail: "charlyxentorix@gmail.com", userName: "Charly Xentorix", items: [{ name: "BM Facebook · Verified · Europe/USA", price: 33.00, qty: 1 }], subtotal: 33.00, discount: 0, coupon: null, total: 33.00, network: "TRC20", txHash: "", status: "paid", date: "2026-02-09" },
  { id: "ORD-002", userEmail: "charlyxentorix@gmail.com", userName: "Charly Xentorix", items: [{ name: "BM Facebook · Ukraine · Reinstated", price: 34.50, qty: 1 }], subtotal: 34.50, discount: 0, coupon: null, total: 34.50, network: "BEP20", txHash: "", status: "pending", date: "2026-02-20" },
  { id: "ORD-003", userEmail: "john@example.com", userName: "John Doe", items: [{ name: "BM Facebook · Brazil · $50 Limit", price: 27.00, qty: 2 }], subtotal: 54.00, discount: 5.40, coupon: "DEMO10", total: 48.60, network: "TRC20", txHash: "abc123", status: "pending", date: "2026-02-25" },
];

// ─── GLOBAL COUPON DB ─────────────────────────────────────────────────────────
const COUPON_DB = [
  { code: "DEMO10", discount: 10, used: false, usedBy: null, usedAt: null, createdAt: "2026-02-20" },
  { code: "VIP20", discount: 20, used: false, usedBy: null, usedAt: null, createdAt: "2026-02-22" },
  { code: "EXPIRED50", discount: 50, used: true, usedBy: "john@example.com", usedAt: "2026-02-23", createdAt: "2026-02-21" },
];

const PRODUCTS = [
  { id: 1, name: "Account Business Manager (BM1) Brazil", details: "$50 Limit · Ads-only · Ad Account Created · TZ/currency/country editable", price: 27.00, stock: 1, sales: 22, rating: 0, reviews: 0 },
  { id: 2, name: "Business Manager Facebook · Verified · Created in 2024", details: "BM Limit $250 · GEO Europe/USA · For WhatsApp API & Apps", price: 33.00, stock: 1, sales: 411, rating: 5, reviews: 1 },
  { id: 3, name: "Business Manager Facebook · Country Ukraine · Verified BM", details: "Reinstated · Ad Limit 50 · Suitable for WhatsApp API & Apps · Ad Campaigns Created", price: 34.50, stock: 11, sales: 553, rating: 5, reviews: 5 },
  { id: 4, name: "Business Manager Facebook · Verified · WhatsApp API Already Linked", details: "Geo Europe/USA", price: 35.00, stock: 6, sales: 165, rating: 5, reviews: 1 },
  { id: 5, name: "Business Manager Facebook · Verified · WhatsApp API Linked", details: "No Ban Risk · Created 2019–2024 · Country MIX", price: 36.00, stock: 4, sales: 223, rating: 4.75, reviews: 4 },
  { id: 6, name: "Facebook Business Manager · Verified · Spain (ES)", details: "Suitable for WA and applications · Daily limit 50$", price: 36.50, stock: 3, sales: 15, rating: 0, reviews: 0 },
  { id: 7, name: "Business Manager Facebook · USA · BM Limit $500", details: "Premium Account · Ad Campaigns Ready · Verified 2024", price: 45.00, stock: 2, sales: 89, rating: 5, reviews: 3 },
  { id: 8, name: "Facebook BM · Global · Unlimited Spend", details: "Multiple Ad Accounts · API Access · Created 2023", price: 62.00, stock: 1, sales: 42, rating: 4.75, reviews: 2 },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --red: #D92B2B; --red-dark: #A81E1E; --red-light: #FFF0F0;
    --bg: #F5F5F5; --surface: #FFFFFF; --border: #E8E4DF;
    --text: #1A1614; --muted: #7A7470;
    --green: #1A8A4A; --green-light: #E8F7EE; --green-border: #BBF7D0;
    --amber: #C97A00; --amber-light: #FEF5E0; --amber-border: #FDE68A;
    --blue: #1B6FA4; --blue-light: #EBF5FF;
    --purple: #7C3AED; --purple-light: #F5F3FF;
    --teal: #0E7490; --teal-light: #E0F7FA;
    --usdt: #26A17B; --usdt-light: #E8F8F3;
    --shadow: 0 1px 4px rgba(0,0,0,0.07); --shadow-lg: 0 8px 40px rgba(0,0,0,0.14);
  }
  body { font-family: 'DM Sans', sans-serif; background: var(--bg); color: var(--text); min-height: 100vh; }
  h1,h2,h3,h4 { font-family: 'Syne', sans-serif; }
  button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
  input, textarea, select { font-family: 'DM Sans', sans-serif; }
  .app { min-height: 100vh; display: flex; flex-direction: column; }

  .topbar { background: var(--surface); border-bottom: 1.5px solid var(--border); padding: 0 24px; height: 60px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
  .logo { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 800; color: var(--red); letter-spacing: -0.5px; cursor: pointer; }
  .logo span { color: var(--text); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .nav-tab { background: none; border: none; padding: 6px 13px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; }
  .nav-tab:hover { background: var(--red-light); color: var(--red); }
  .nav-tab.active { background: var(--red); color: #fff; font-weight: 700; }
  .cart-fab { position: relative; background: var(--text); color: #fff; border: none; padding: 8px 15px; border-radius: 10px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 7px; }
  .cart-fab:hover { background: #333; }
  .cart-count { background: var(--red); color: #fff; width: 19px; height: 19px; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  .hero { background: linear-gradient(135deg, #1A1614 0%, #2D1F1F 55%, #3D1515 100%); color: #fff; padding: 44px 28px 36px; text-align: center; }
  .hero h1 { font-size: clamp(22px,4vw,44px); font-weight: 800; letter-spacing: -1px; margin-bottom: 8px; }
  .hero h1 span { color: #ff7070; }
  .hero p { font-size: 14px; opacity: 0.72; max-width: 440px; margin: 0 auto 18px; line-height: 1.6; }
  .hero-badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .hero-badge { background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; }

  .shop-wrap { flex: 1; max-width: 1000px; margin: 0 auto; width: 100%; padding: 24px 20px; }
  .shop-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .shop-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
  .shop-count { font-size: 13px; color: var(--muted); }
  .product-list { display: flex; flex-direction: column; background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
  .product-row { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); transition: background 0.12s; }
  .product-row:last-child { border-bottom: none; }
  .product-row:hover { background: #FAFAFA; }
  .prod-thumb { width: 64px; height: 64px; flex-shrink: 0; border-radius: 10px; overflow: hidden; position: relative; margin-right: 16px; }
  .prod-thumb-inner { width: 100%; height: 100%; background: linear-gradient(145deg, #1877F2 0%, #0d5bbf 100%); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }
  .prod-thumb-icon { font-size: 26px; line-height: 1; }
  .prod-thumb-label { font-size: 9px; font-weight: 700; color: #fff; letter-spacing: 0.3px; }
  .verified-badge { position: absolute; top: -3px; left: -3px; width: 18px; height: 18px; background: #22c55e; border-radius: 50%; border: 2px solid #fff; display: flex; align-items: center; justify-content: center; font-size: 9px; }
  .prod-info { flex: 1; min-width: 0; margin-right: 20px; }
  .prod-name { font-size: 14px; font-weight: 600; margin-bottom: 3px; line-height: 1.4; }
  .prod-details { font-size: 12px; color: var(--muted); margin-bottom: 7px; line-height: 1.4; }
  .prod-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .stars { display: flex; align-items: center; gap: 2px; }
  .star { color: #F59E0B; font-size: 13px; }
  .star-empty { color: #D1D5DB; font-size: 13px; }
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
  .chip-stock { background: #F0FDF4; color: #15803D; border: 1px solid #BBF7D0; }
  .chip-sales { background: #F8FAFC; color: #64748B; border: 1px solid #E2E8F0; }
  .prod-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .prod-price { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; white-space: nowrap; }
  .prod-actions { display: flex; align-items: center; gap: 8px; }
  .buy-btn { background: var(--red); color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; transition: all 0.15s; white-space: nowrap; }
  .buy-btn:hover { background: var(--red-dark); transform: translateY(-1px); }
  .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 15px; color: var(--muted); transition: all 0.15s; flex-shrink: 0; }
  .icon-btn:hover, .icon-btn.liked { border-color: var(--red); color: var(--red); background: var(--red-light); }
  .in-cart-badge { background: var(--green); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; }

  /* CART */
  .cart-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.42); z-index: 200; animation: fadeIn 0.18s; }
  .cart-drawer { position: fixed; right: 0; top: 0; bottom: 0; width: 400px; max-width: 100vw; background: var(--surface); box-shadow: -6px 0 36px rgba(0,0,0,0.16); z-index: 201; display: flex; flex-direction: column; animation: slideLeft 0.22s ease; }
  @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  @keyframes scaleIn { from { opacity:0; transform:scale(0.96); } to { opacity:1; transform:scale(1); } }
  @keyframes slideUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes shake { 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-5px)} 40%,80%{transform:translateX(5px)} }
  .cart-header { padding: 18px 20px; border-bottom: 1.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .cart-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; }
  .cart-close { background: var(--bg); border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 15px; display: flex; align-items: center; justify-content: center; }
  .cart-items { flex: 1; overflow-y: auto; padding: 14px 20px; }
  .cart-item { display: flex; align-items: flex-start; gap: 11px; padding: 11px 0; border-bottom: 1px solid var(--border); }
  .cart-item:last-child { border-bottom: none; }
  .cart-item-info { flex: 1; min-width: 0; }
  .cart-item-name { font-size: 13px; font-weight: 600; line-height: 1.3; }
  .cart-item-price { font-size: 12px; color: var(--muted); margin: 3px 0 7px; }
  .cart-item-remove { background: none; border: none; color: var(--muted); font-size: 15px; padding: 3px; flex-shrink: 0; }
  .cart-item-remove:hover { color: var(--red); }
  .qty-ctrl { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
  .qty-btn { background: var(--bg); border: none; width: 30px; height: 30px; font-size: 15px; }
  .qty-btn:hover { background: var(--red-light); color: var(--red); }
  .qty-num { width: 32px; text-align: center; font-weight: 700; font-size: 13px; }
  .coupon-section { padding: 12px 20px; border-top: 1px solid var(--border); }
  .coupon-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 7px; }
  .coupon-row { display: flex; gap: 8px; }
  .coupon-input { flex: 1; border: 1.5px solid var(--border); border-radius: 9px; padding: 8px 12px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; outline: none; background: var(--bg); transition: border-color 0.15s; }
  .coupon-input:focus { border-color: var(--purple); background: #fff; }
  .coupon-input.valid { border-color: var(--green); background: var(--green-light); }
  .coupon-input.invalid { border-color: var(--red); animation: shake 0.35s ease; }
  .apply-btn { background: var(--purple); color: #fff; border: none; padding: 8px 13px; border-radius: 9px; font-size: 13px; font-weight: 700; white-space: nowrap; }
  .apply-btn:disabled { background: var(--border); color: var(--muted); cursor: not-allowed; }
  .coupon-applied { display: flex; align-items: center; justify-content: space-between; background: var(--green-light); border: 1.5px solid var(--green-border); border-radius: 10px; padding: 9px 12px; margin-top: 7px; }
  .coupon-applied-code { font-size: 13px; font-weight: 800; color: var(--green); letter-spacing: 1px; }
  .coupon-applied-desc { font-size: 11px; color: var(--green); }
  .coupon-remove { background: none; border: none; color: var(--green); font-size: 15px; opacity: 0.7; }
  .coupon-error { font-size: 12px; color: var(--red); margin-top: 5px; font-weight: 500; }
  .cart-footer { padding: 14px 20px; border-top: 1.5px solid var(--border); }
  .price-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 5px; }
  .price-row.subtotal { color: var(--muted); }
  .price-row.discount { color: var(--green); font-weight: 600; }
  .price-row.total { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-top: 8px; padding-top: 8px; border-top: 1.5px solid var(--border); margin-bottom: 12px; }
  .price-row.total span:last-child { color: var(--usdt); }
  .checkout-btn { width: 100%; padding: 13px; background: var(--usdt); color: #fff; border: none; border-radius: 12px; font-size: 15px; font-weight: 700; transition: all 0.15s; font-family: 'Syne', sans-serif; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .checkout-btn:hover { background: #1f8f6a; transform: translateY(-1px); }
  .empty-cart { text-align: center; padding: 55px 20px; color: var(--muted); }

  /* MODALS */
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 300; display: flex; align-items: center; justify-content: center; padding: 20px; animation: fadeIn 0.18s; }
  .modal { background: var(--surface); border-radius: 20px; padding: 30px; max-width: 460px; width: 100%; box-shadow: var(--shadow-lg); animation: scaleIn 0.2s ease; max-height: 90vh; overflow-y: auto; }
  .modal-title { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 800; margin-bottom: 4px; }
  .modal-sub { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
  .form-group { margin-bottom: 12px; }
  .form-label { font-size: 11px; font-weight: 700; display: block; margin-bottom: 4px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
  .form-input { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 13px; font-size: 14px; outline: none; transition: border-color 0.15s; background: var(--bg); }
  .form-input:focus { border-color: var(--red); background: #fff; }
  .btn { padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 600; border: none; transition: all 0.15s; display: inline-flex; align-items: center; gap: 7px; }
  .btn-primary { background: var(--red); color: #fff; }
  .btn-primary:hover { background: var(--red-dark); }
  .btn-usdt { background: var(--usdt); color: #fff; }
  .btn-usdt:hover { background: #1f8f6a; }
  .btn-outline { background: none; border: 1.5px solid var(--border); color: var(--text); }
  .btn-outline:hover { border-color: var(--red); color: var(--red); }
  .btn-purple { background: var(--purple); color: #fff; }
  .btn-green { background: var(--green); color: #fff; }
  .btn-green:hover { background: #147a40; }
  .btn-sm { padding: 6px 13px; font-size: 12px; }
  .btn-full { width: 100%; justify-content: center; margin-top: 4px; }
  .error-msg { background: var(--red-light); color: var(--red); padding: 9px 13px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }
  .success-msg { background: var(--green-light); color: var(--green); padding: 9px 13px; border-radius: 8px; font-size: 13px; margin-bottom: 12px; }

  /* PAYMENT MODAL */
  .usdt-header { background: linear-gradient(135deg, var(--usdt-light) 0%, #d0f5e8 100%); border: 1.5px solid #a7f0d8; border-radius: 14px; padding: 16px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px; }
  .usdt-logo { width: 44px; height: 44px; background: var(--usdt); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 800; color: #fff; font-family: 'Syne', sans-serif; flex-shrink: 0; }
  .usdt-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--usdt); }
  .usdt-sub { font-size: 12px; color: #1f8f6a; }
  .network-selector { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 18px; }
  .network-card { border: 2px solid var(--border); border-radius: 13px; padding: 14px 12px; cursor: pointer; transition: all 0.15s; position: relative; }
  .network-card:hover { border-color: var(--usdt); }
  .network-card.selected { border-color: var(--usdt); background: var(--usdt-light); }
  .network-card.selected::after { content: '✓'; position: absolute; top: 8px; right: 10px; font-size: 12px; font-weight: 800; color: var(--usdt); }
  .network-logo { font-size: 22px; margin-bottom: 6px; }
  .network-name { font-size: 13px; font-weight: 800; margin-bottom: 2px; }
  .network-chain { font-size: 11px; color: var(--muted); margin-bottom: 6px; }
  .network-meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .network-tag { font-size: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 20px; padding: 2px 7px; color: var(--muted); font-weight: 600; }
  .wallet-box { background: var(--bg); border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; margin-bottom: 14px; animation: scaleIn 0.2s ease; }
  .wallet-box-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .wallet-address { font-family: monospace; font-size: 12px; word-break: break-all; line-height: 1.5; color: var(--text); margin-bottom: 10px; }
  .wallet-copy-btn { background: var(--usdt); color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 5px; transition: background 0.15s; }
  .wallet-copy-btn:hover { background: #1f8f6a; }
  .amount-highlight { background: linear-gradient(135deg, var(--usdt-light), #d0f5e8); border: 1.5px solid #a7f0d8; border-radius: 10px; padding: 12px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; }
  .amount-label { font-size: 12px; color: var(--usdt); font-weight: 600; }
  .amount-value { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--usdt); }
  .amount-ticker { font-size: 14px; color: var(--usdt); font-weight: 600; }
  .tx-input-wrap { margin-bottom: 14px; }
  .tx-input { width: 100%; border: 1.5px solid var(--border); border-radius: 10px; padding: 9px 13px; font-size: 13px; font-family: monospace; outline: none; background: var(--bg); }
  .tx-input:focus { border-color: var(--usdt); background: #fff; }
  .order-summary-mini { background: var(--bg); border-radius: 10px; padding: 12px 14px; margin-bottom: 14px; }
  .order-row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: var(--muted); }
  .order-row.bold { font-size: 14px; font-weight: 700; color: var(--text); border-top: 1px solid var(--border); padding-top: 6px; margin-top: 6px; margin-bottom: 0; }
  .order-row.discount { color: var(--green); font-weight: 600; }
  .warning-box { background: var(--amber-light); border: 1px solid var(--amber-border); border-radius: 9px; padding: 10px 13px; font-size: 12px; color: var(--amber); margin-bottom: 14px; line-height: 1.5; }

  /* BADGES */
  .badge { display: inline-block; padding: 3px 9px; border-radius: 20px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3px; }
  .badge-green { background: var(--green-light); color: var(--green); }
  .badge-amber { background: var(--amber-light); color: var(--amber); }
  .badge-blue { background: var(--blue-light); color: var(--blue); }
  .badge-red { background: var(--red-light); color: var(--red); }
  .badge-purple { background: var(--purple-light); color: var(--purple); }
  .badge-usdt { background: var(--usdt-light); color: var(--usdt); border: 1px solid #a7f0d8; }
  .badge-used { background: #F1F5F9; color: #94A3B8; font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; border: 1px solid #E2E8F0; }
  .badge-active { background: var(--green-light); color: var(--green); font-size: 10px; padding: 2px 8px; border-radius: 20px; font-weight: 700; border: 1px solid var(--green-border); }

  /* STATUS PILLS */
  .status-pending { background: var(--amber-light); color: var(--amber); border: 1px solid var(--amber-border); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; }
  .status-paid { background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; }
  .status-cancelled { background: var(--red-light); color: var(--red); padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 4px; }

  /* ADMIN */
  .admin-layout { display: flex; min-height: calc(100vh - 60px); }
  .sidebar { width: 215px; background: var(--surface); border-right: 1.5px solid var(--border); padding: 16px 9px; flex-shrink: 0; }
  .sidebar-item { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 9px; font-size: 13px; font-weight: 500; color: var(--muted); cursor: pointer; transition: all 0.13s; margin-bottom: 3px; border: none; background: none; width: 100%; text-align: left; }
  .sidebar-item:hover { background: var(--bg); color: var(--text); }
  .sidebar-item.active { background: var(--red-light); color: var(--red); font-weight: 700; }
  .sidebar-section { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; padding: 10px 11px 4px; }
  .admin-content { flex: 1; padding: 24px; overflow-x: hidden; }
  .page-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; margin-bottom: 20px; letter-spacing: -0.4px; }
  .card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: var(--shadow); margin-bottom: 20px; }
  .card-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; margin-bottom: 14px; }
  .stats-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: 12px; margin-bottom: 20px; }
  .stat-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 13px; padding: 16px; box-shadow: var(--shadow); }
  .stat-label { font-size: 11px; color: var(--muted); font-weight: 600; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-value { font-family: 'Syne', sans-serif; font-size: 21px; font-weight: 800; }
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; padding: 8px 11px; background: var(--bg); color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
  td { padding: 10px 11px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #FAFAFA; }

  /* ORDER CONFIRM ROW */
  .confirm-btn { background: var(--green); color: #fff; border: none; padding: 6px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; transition: all 0.15s; white-space: nowrap; }
  .confirm-btn:hover { background: #147a40; transform: translateY(-1px); }
  .confirmed-label { color: var(--green); font-size: 12px; font-weight: 700; display: flex; align-items: center; gap: 4px; }

  /* COUPON CREATOR */
  .coupon-creator { background: linear-gradient(135deg, var(--purple-light) 0%, #EDE9FE 100%); border: 1.5px solid #C4B5FD; border-radius: 16px; padding: 22px; margin-bottom: 22px; }
  .coupon-creator-title { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: var(--purple); margin-bottom: 3px; }
  .coupon-creator-sub { font-size: 13px; color: #6D28D9; opacity: 0.8; margin-bottom: 18px; }
  .percent-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 7px; margin-bottom: 10px; }
  .percent-btn { border: 1.5px solid #C4B5FD; background: #fff; border-radius: 8px; padding: 8px 4px; font-size: 13px; font-weight: 700; color: var(--purple); transition: all 0.13s; text-align: center; }
  .percent-btn:hover, .percent-btn.active { background: var(--purple); color: #fff; border-color: var(--purple); }
  .custom-percent { border: 1.5px solid #C4B5FD; background: #fff; border-radius: 8px; padding: 8px 12px; font-size: 14px; font-weight: 700; color: var(--purple); width: 90px; outline: none; text-align: center; }
  .coupon-result { background: #fff; border: 2px solid var(--purple); border-radius: 12px; padding: 14px 18px; margin-top: 14px; display: flex; align-items: center; justify-content: space-between; }
  .coupon-result-code { font-family: 'Syne', sans-serif; font-size: 24px; font-weight: 800; color: var(--purple); letter-spacing: 3px; }
  .coupon-result-meta { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .copy-code-btn { background: var(--purple); color: #fff; border: none; padding: 8px 14px; border-radius: 9px; font-size: 13px; font-weight: 700; }

  /* ADMIN CHAT */
  .admin-chat-layout { display: grid; grid-template-columns: 240px 1fr; height: calc(100vh - 150px); border: 1.5px solid var(--border); border-radius: 13px; overflow: hidden; background: var(--surface); }
  .convo-list { border-right: 1.5px solid var(--border); overflow-y: auto; }
  .convo-item { padding: 12px 14px; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s; }
  .convo-item:hover, .convo-item.active { background: var(--red-light); }
  .convo-name { font-size: 13px; font-weight: 700; }
  .convo-preview { font-size: 11px; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
  .unread-dot { width: 7px; height: 7px; background: var(--red); border-radius: 50%; flex-shrink: 0; }
  .chat-panel { display: flex; flex-direction: column; }
  .chat-panel-header { padding: 13px 17px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }

  /* CHAT WIDGET */
  .chat-fab-btn { position: fixed; bottom: 22px; right: 22px; width: 50px; height: 50px; background: var(--red); border: none; border-radius: 50%; color: #fff; font-size: 19px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 18px rgba(217,43,43,0.45); z-index: 150; transition: transform 0.18s; }
  .chat-fab-btn:hover { transform: scale(1.1); }
  .online-dot { position: absolute; top: -1px; right: -1px; width: 13px; height: 13px; background: #22c55e; border-radius: 50%; border: 2px solid #fff; }
  .chat-window { position: fixed; bottom: 80px; right: 22px; width: 310px; height: 430px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 17px; box-shadow: var(--shadow-lg); z-index: 150; display: flex; flex-direction: column; overflow: hidden; animation: slideUp 0.2s ease; }
  .chat-head { background: var(--red); color: #fff; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
  .chat-agent-info { display: flex; align-items: center; gap: 9px; }
  .agent-av { width: 29px; height: 29px; background: rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }
  .agent-nm { font-weight: 700; font-size: 13px; }
  .agent-st { font-size: 10px; opacity: 0.85; }
  .chat-x { background: none; border: none; color: #fff; font-size: 15px; opacity: 0.8; }
  .chat-msgs { flex: 1; overflow-y: auto; padding: 11px; display: flex; flex-direction: column; gap: 7px; }
  .cmsg { max-width: 83%; }
  .cmsg-a { align-self: flex-start; }
  .cmsg-u { align-self: flex-end; }
  .cmsg-b { padding: 8px 11px; border-radius: 12px; font-size: 13px; line-height: 1.4; }
  .cmsg-a .cmsg-b { background: var(--bg); border-bottom-left-radius: 3px; }
  .cmsg-u .cmsg-b { background: var(--red); color: #fff; border-bottom-right-radius: 3px; }
  .cmsg-t { font-size: 10px; color: var(--muted); margin-top: 2px; text-align: right; }
  .chat-input-row { padding: 9px; border-top: 1px solid var(--border); display: flex; gap: 7px; align-items: center; }
  .chat-inp { flex: 1; border: 1.5px solid var(--border); border-radius: 18px; padding: 7px 12px; font-size: 13px; outline: none; }
  .chat-inp:focus { border-color: var(--red); }
  .chat-snd { background: var(--red); border: none; color: #fff; width: 31px; height: 31px; border-radius: 50%; font-size: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }

  /* USER */
  .page { flex: 1; padding: 26px 24px; max-width: 1000px; margin: 0 auto; width: 100%; }
  .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .avatar-lg { width: 50px; height: 50px; background: linear-gradient(135deg, var(--red) 0%, #ff6b6b 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 800; color: #fff; font-family: 'Syne', sans-serif; flex-shrink: 0; }
  .tag-network { background: var(--usdt-light); color: var(--usdt); font-size: 10px; padding: 2px 7px; border-radius: 20px; font-weight: 700; border: 1px solid #a7f0d8; }
  @media (max-width: 640px) { .settings-grid { grid-template-columns: 1fr; } .cart-drawer { width: 100vw; } .network-selector { grid-template-columns: 1fr; } }
`;

// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = n => `$${Number(n).toFixed(2)}`;
const fmtUSDT = n => `${Number(n).toFixed(2)} USDT`;
const nowTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const today = () => new Date().toISOString().split("T")[0];
const genOrderId = () => `ORD-${Date.now().toString().slice(-6)}`;
const genCode = pct => { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let r = ""; for (let i = 0; i < 8; i++) r += c[Math.floor(Math.random() * c.length)]; return `SAVE${pct}-${r.slice(0,4)}`; };

const StatusPill = ({ status }) => {
  if (status === "paid") return <span className="status-paid">✓ Pagado</span>;
  if (status === "pending") return <span className="status-pending">⏳ Pendiente</span>;
  return <span className="status-cancelled">✕ Cancelado</span>;
};
const Stars = ({ rating, reviews }) => {
  if (!rating || !reviews) return null;
  const full = Math.floor(rating), partial = rating % 1 >= 0.5 ? 1 : 0, empty = 5 - full - partial;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 700, marginRight: 2 }}>{rating}</span>
      {[...Array(full)].map((_,i) => <span key={`f${i}`} className="star">★</span>)}
      {partial === 1 && <span className="star" style={{ opacity: 0.6 }}>★</span>}
      {[...Array(empty)].map((_,i) => <span key={`e${i}`} className="star-empty">★</span>)}
      <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 2 }}>({reviews})</span>
    </div>
  );
};

// ─── CHAT WIDGET ─────────────────────────────────────────────────────────────
const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ role: "a", text: "¡Hola! Soy Alex 👋 ¿En qué puedo ayudarte?", time: "08:00" }]);
  const [inp, setInp] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);
  const send = () => {
    if (!inp.trim()) return;
    setMsgs(p => [...p, { role: "u", text: inp.trim(), time: nowTime() }]);
    setInp("");
    setTimeout(() => setMsgs(p => [...p, { role: "a", text: "Gracias. Un agente te responderá pronto ✅", time: nowTime() }]), 900);
  };
  return (
    <>
      <button className="chat-fab-btn" onClick={() => setOpen(o => !o)}>💬<span className="online-dot" /></button>
      {open && (
        <div className="chat-window">
          <div className="chat-head">
            <div className="chat-agent-info"><div className="agent-av">A</div><div><div className="agent-nm">Alex — Soporte</div><div className="agent-st">● En línea</div></div></div>
            <button className="chat-x" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-msgs">
            {msgs.map((m, i) => <div key={i} className={`cmsg ${m.role === "a" ? "cmsg-a" : "cmsg-u"}`}><div className="cmsg-b">{m.text}</div><div className="cmsg-t">{m.time}</div></div>)}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input className="chat-inp" placeholder="Escribe aquí..." value={inp} onChange={e => setInp(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
            <button className="chat-snd" onClick={send}>➤</button>
          </div>
        </div>
      )}
    </>
  );
};

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
const AuthModal = ({ onClose, onSuccess, initialTab = "login" }) => {
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (res?.error) { setError("Email o contraseña incorrectos."); return; }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) { setError("Completá todos los campos."); return; }
    if (form.password !== form.confirm) { setError("Las contraseñas no coinciden."); return; }
    if (form.password.length < 6) { setError("Mínimo 6 caracteres."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al registrarse."); return; }
      const login = await signIn("credentials", {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      if (login?.error) { setError("Cuenta creada, pero hubo un error al ingresar. Iniciá sesión manualmente."); return; }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🛒</div>
        <div className="modal-title">{tab === "login" ? "Iniciá sesión" : "Creá tu cuenta"}</div>
        <div className="modal-sub">{tab === "login" ? "Ingresá para continuar con tu compra" : "Registrate para poder comprar"}</div>
        <div className="auth-tabs" style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 11, overflow: "hidden", marginBottom: 18 }}>
          <button style={{ flex: 1, padding: 9, fontSize: 13, fontWeight: 600, border: "none", background: tab === "login" ? "var(--red)" : "none", color: tab === "login" ? "#fff" : "var(--muted)", cursor: "pointer" }} onClick={() => { setTab("login"); setError(""); }}>Iniciar sesión</button>
          <button style={{ flex: 1, padding: 9, fontSize: 13, fontWeight: 600, border: "none", background: tab === "register" ? "var(--red)" : "none", color: tab === "register" ? "#fff" : "var(--muted)", cursor: "pointer" }} onClick={() => { setTab("register"); setError(""); }}>Registrarse</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        {tab === "register" && (
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Tu nombre" value={form.name} onChange={set("name")} />
          </div>
        )}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" type="email" placeholder="email@ejemplo.com" value={form.email} onChange={set("email")} />
        </div>
        <div className="form-group">
          <label className="form-label">Contraseña</label>
          <input className="form-input" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} onKeyDown={e => e.key === "Enter" && (tab === "login" ? handleLogin() : null)} />
        </div>
        {tab === "register" && (
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <input className="form-input" type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={tab === "login" ? handleLogin : handleRegister} disabled={loading}>
          {loading ? "Procesando..." : tab === "login" ? "→ Entrar" : "✓ Crear cuenta"}
        </button>
        <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

// ─── PAYMENT MODAL ────────────────────────────────────────────────────────────
const PaymentModal = ({ cart, user, coupon, finalTotal, onClose, onSuccess }) => {
  const [network, setNetwork] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = coupon ? subtotal * (coupon.discount / 100) : 0;

  const selectNetwork = (n) => { setNetwork(n); setStep(2); };
  const copy = () => {
    navigator.clipboard.writeText(WALLETS[network].addr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="usdt-header">
          <div className="usdt-logo">₮</div>
          <div>
            <div className="usdt-title">Pago en USDT</div>
            <div className="usdt-sub">Stablecoin · 1 USDT = 1 USD · Sin volatilidad</div>
          </div>
        </div>
        <div className="order-summary-mini">
          {cart.map(i => <div className="order-row" key={i.id}><span>{i.name.slice(0,32)}... ×{i.qty}</span><span>{fmtUSDT(i.price * i.qty)}</span></div>)}
          {coupon && <div className="order-row discount"><span>🏷 {coupon.code} (-{coupon.discount}%)</span><span>− {fmtUSDT(discountAmt)}</span></div>}
          <div className="order-row bold"><span>Total a pagar</span><span style={{ color: "var(--usdt)" }}>{fmtUSDT(finalTotal)}</span></div>
        </div>
        {step === 1 && (
          <>
            <div style={{ fontFamily: "Syne", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Selecciona la red:</div>
            <div className="network-selector">
              {Object.entries(WALLETS).map(([key, w]) => (
                <div key={key} className={`network-card ${network === key ? "selected" : ""}`} onClick={() => selectNetwork(key)}>
                  <div className="network-logo">{w.logo}</div>
                  <div className="network-name">{key}</div>
                  <div className="network-chain">{w.network}</div>
                  <div className="network-meta">
                    <span className="network-tag">Fee: {w.fee}</span>
                    <span className="network-tag">{w.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-outline btn-full" style={{ marginTop: 0 }} onClick={onClose}>Cancelar</button>
          </>
        )}
        {step === 2 && network && (
          <>
            <div className="amount-highlight">
              <span className="amount-label">Enviar exactamente:</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span className="amount-value">{fmtUSDT(finalTotal).split(" ")[0]}</span>
                <span className="amount-ticker">USDT</span>
              </div>
            </div>
            <div className="wallet-box">
              <div className="wallet-box-label">{WALLETS[network].logo} Wallet USDT {network} — {WALLETS[network].network}</div>
              <div className="wallet-address">{WALLETS[network].addr}</div>
              <button className="wallet-copy-btn" onClick={copy}>{copied ? "✓ Copiado!" : "📋 Copiar dirección"}</button>
            </div>
            <div className="tx-input-wrap">
              <div className="form-label">Hash de transacción (opcional pero recomendado)</div>
              <input className="tx-input" placeholder="Ej: 0xabc123def456... o TXhash..." value={txHash} onChange={e => setTxHash(e.target.value)} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Pegar el hash acelera la confirmación por parte del admin.</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-usdt" style={{ flex: 1, justifyContent: "center" }} onClick={() => onSuccess(network, txHash)}>✓ Ya realicé el pago</button>
              <button className="btn btn-outline" onClick={() => { setStep(1); setNetwork(null); }}>← Volver</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
const SuccessModal = ({ order, onClose }) => (
  <div className="modal-overlay">
    <div className="modal" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 54, marginBottom: 12 }}>✅</div>
      <div className="modal-title">¡Pago enviado!</div>
      <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
        Tu orden <strong style={{ color: "var(--text)" }}>#{order.id}</strong> fue registrada.<br />
        Quedó en estado <span className="status-pending" style={{ display: "inline-flex" }}>⏳ Pendiente</span> mientras se verifica el pago.
      </div>
      <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "var(--amber)", textAlign: "left" }}>
        <strong>Red:</strong> {order.network} · <strong>Total:</strong> {fmtUSDT(order.total)}<br />
        {order.txHash && <><strong>TX Hash:</strong> <code style={{ fontSize: 11 }}>{order.txHash.slice(0, 30)}...</code></>}
      </div>
      <button className="btn btn-primary btn-full" onClick={onClose}>Ver mis órdenes</button>
    </div>
  </div>
);

// ─── CART DRAWER ─────────────────────────────────────────────────────────────
const CartDrawer = ({ cart, onClose, onQty, onRemove, onCheckout }) => {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponState, setCouponState] = useState("idle");

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
  const total = subtotal - discountAmt;

  const applyCoupon = () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const found = COUPON_DB.find(c => c.code === code);
    if (!found) { setCouponState("invalid"); setCouponError("Cupón no encontrado."); setTimeout(() => setCouponState("idle"), 600); return; }
    if (found.used) { setCouponState("invalid"); setCouponError(`Cupón ya utilizado el ${found.usedAt}.`); setTimeout(() => setCouponState("idle"), 600); return; }
    setAppliedCoupon(found); setCouponState("valid"); setCouponInput("");
  };

  const removeCoupon = () => { setAppliedCoupon(null); setCouponState("idle"); setCouponError(""); };

  return (
    <>
      <div className="cart-overlay" onClick={onClose} />
      <div className="cart-drawer">
        <div className="cart-header">
          <div className="cart-title">🛒 Carrito ({cart.reduce((s,i)=>s+i.qty,0)})</div>
          <button className="cart-close" onClick={onClose}>✕</button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="empty-cart"><div style={{ fontSize: 48, marginBottom: 10 }}>🛒</div><div style={{ fontWeight: 600 }}>Carrito vacío</div><div style={{ fontSize: 13, marginTop: 6 }}>Agrega productos para continuar</div></div>
          ) : cart.map(item => (
            <div key={item.id} className="cart-item">
              <div style={{ width: 40, height: 40, background: "#1877F2", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👜</div>
              <div className="cart-item-info">
                <div className="cart-item-name">{item.name}</div>
                <div className="cart-item-price">{fmtUSDT(item.price)} × {item.qty} = <strong style={{ color: "var(--usdt)" }}>{fmtUSDT(item.price * item.qty)}</strong></div>
                <div className="qty-ctrl" style={{ display: "inline-flex", marginTop: 6 }}>
                  <button className="qty-btn" onClick={() => onQty(item.id, item.qty - 1)}>−</button>
                  <span className="qty-num">{item.qty}</span>
                  <button className="qty-btn" onClick={() => onQty(item.id, item.qty + 1)}>+</button>
                </div>
              </div>
              <button className="cart-item-remove" onClick={() => onRemove(item.id)}>🗑</button>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <>
            <div className="coupon-section">
              <div className="coupon-label">🏷 Código de descuento</div>
              {!appliedCoupon ? (
                <>
                  <div className="coupon-row">
                    <input className={`coupon-input ${couponState === "valid" ? "valid" : couponState === "invalid" ? "invalid" : ""}`} placeholder="Ej: DEMO10" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); setCouponState("idle"); }} onKeyDown={e => e.key === "Enter" && applyCoupon()} />
                    <button className="apply-btn" onClick={applyCoupon} disabled={!couponInput.trim()}>Aplicar</button>
                  </div>
                  {couponError && <div className="coupon-error">⚠ {couponError}</div>}
                  <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 5 }}>Prueba: <strong>DEMO10</strong> · <strong>VIP20</strong></div>
                </>
              ) : (
                <div className="coupon-applied">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>✅</span>
                    <div><div className="coupon-applied-code">{appliedCoupon.code}</div><div className="coupon-applied-desc">{appliedCoupon.discount}% off · Ahorrás {fmtUSDT(discountAmt)}</div></div>
                  </div>
                  <button className="coupon-remove" onClick={removeCoupon}>✕</button>
                </div>
              )}
            </div>
            <div className="cart-footer">
              <div className="price-row subtotal"><span>Subtotal</span><span>{fmtUSDT(subtotal)}</span></div>
              {appliedCoupon && <div className="price-row discount"><span>Descuento ({appliedCoupon.discount}%)</span><span>− {fmtUSDT(discountAmt)}</span></div>}
              <div className="price-row total"><span>Total</span><span>{fmtUSDT(total)}</span></div>
              <button className="checkout-btn" onClick={() => onCheckout(appliedCoupon, total)}>₮ Pagar con USDT →</button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

// ─── SHOP PAGE ────────────────────────────────────────────────────────────────
const ShopPage = ({ cart, onAddToCart, onCartOpen, liked, onToggleLike }) => {
  const getQty = id => cart.find(i => i.id === id)?.qty || 0;
  return (
    <>
      <div className="hero">
        <h1>Facebook <span>Accounts</span> Shop</h1>
        <p>Cuentas Business Manager verificadas · Entrega inmediata · Pago solo USDT</p>
        <div className="hero-badges">
          <span className="hero-badge">✓ Entrega inmediata</span>
          <span className="hero-badge">₮ USDT TRC20 / BEP20</span>
          <span className="hero-badge">🔒 Compra segura</span>
          <span className="hero-badge">🏷 Cupones de descuento</span>
        </div>
      </div>
      <div className="shop-wrap">
        <div className="shop-header">
          <div className="shop-title">Productos disponibles</div>
          <div className="shop-count">{PRODUCTS.length} productos</div>
        </div>
        <div className="product-list">
          {PRODUCTS.map(p => {
            const qty = getQty(p.id);
            return (
              <div key={p.id} className="product-row">
                <div className="prod-thumb">
                  <div className="prod-thumb-inner"><span className="prod-thumb-icon">👜</span><span className="prod-thumb-label">Facebook</span></div>
                  {p.sales > 100 && <div className="verified-badge">✓</div>}
                </div>
                <div className="prod-info">
                  <div className="prod-name">{p.name}</div>
                  <div className="prod-details">{p.details}</div>
                  <div className="prod-meta">
                    {p.rating > 0 && <Stars rating={p.rating} reviews={p.reviews} />}
                    <span className="chip chip-stock">In Stock: <strong>{p.stock} pcs.</strong></span>
                    <span className="chip chip-sales">Sales: <strong>{p.sales} pcs.</strong></span>
                  </div>
                </div>
                <div className="prod-right">
                  <div className="prod-price">{fmtUSDT(p.price)}</div>
                  <div className="prod-actions">
                    {qty === 0
                      ? <button className="buy-btn" onClick={() => onAddToCart(p)}>Buy now</button>
                      : <button className="in-cart-badge" onClick={onCartOpen}>✓ In cart ({qty})</button>
                    }
                    <button className="icon-btn" onClick={onCartOpen}>🛒</button>
                    <button className={`icon-btn ${liked[p.id] ? "liked" : ""}`} onClick={() => onToggleLike(p.id)}>{liked[p.id] ? "❤️" : "🤍"}</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

// ─── USER ACCOUNT ─────────────────────────────────────────────────────────────
const UserAccount = ({ user, userOrders, liked, onToggleLike, onGoShop }) => {
  const [tab, setTab] = useState("orders");
  const myOrders = userOrders.filter(o => o.userEmail === user.email);
  const favProducts = PRODUCTS.filter(p => liked[p.id]);
  const displayName = user.name || user.email || "Usuario";
  return (
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
        <div className="avatar-lg">{displayName[0].toUpperCase()}</div>
        <div><div style={{ fontFamily: "Syne", fontSize: 19, fontWeight: 800 }}>Hola, {displayName.split(" ")[0]} 👋</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{user.email}</div></div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[["orders", "📦 Mis órdenes"], ["favorites", `❤️ Favoritos${favProducts.length > 0 ? ` (${favProducts.length})` : ""}`]].map(([id, label]) => (
          <button key={id} className={`nav-tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {tab === "orders" && (
        <>
          <div className="stats-row">
            <div className="stat-card"><div className="stat-label">Órdenes totales</div><div className="stat-value" style={{ color: "var(--blue)" }}>{myOrders.length}</div></div>
            <div className="stat-card"><div className="stat-label">Pendientes</div><div className="stat-value" style={{ color: "var(--amber)" }}>{myOrders.filter(o => o.status === "pending").length}</div></div>
            <div className="stat-card"><div className="stat-label">Pagadas</div><div className="stat-value" style={{ color: "var(--green)" }}>{myOrders.filter(o => o.status === "paid").length}</div></div>
          </div>
          <div className="card">
            <div className="card-title">Historial de órdenes</div>
            {myOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: 14 }}>No tenés órdenes aún. ¡Empezá a comprar!</div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>ID</th><th>Producto(s)</th><th>Red</th><th>Total</th><th>Cupón</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {myOrders.slice().reverse().map(o => (
                      <tr key={o.id}>
                        <td><code style={{ fontSize: 11, color: "var(--purple)" }}>{o.id}</code></td>
                        <td style={{ maxWidth: 200, fontSize: 12 }}>{o.items.map(i => i.name).join(", ")}</td>
                        <td><span className="tag-network">{o.network}</span></td>
                        <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(o.total)}</strong></td>
                        <td>{o.coupon ? <span className="badge badge-purple">{o.coupon} -{o.discount}%</span> : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>}</td>
                        <td><StatusPill status={o.status} /></td>
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "favorites" && (
        <>
          {favProducts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "50px 20px" }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>🤍</div>
              <div style={{ fontFamily: "Syne", fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Sin favoritos aún</div>
              <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>Tocá el corazón ❤️ en cualquier producto de la tienda para guardarlo acá.</div>
              <button className="btn btn-primary" onClick={onGoShop}>Ir a la tienda</button>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14 }}>{favProducts.length} producto{favProducts.length > 1 ? "s" : ""} guardado{favProducts.length > 1 ? "s" : ""}</div>
              <div style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, overflow: "hidden", boxShadow: "var(--shadow)" }}>
                {favProducts.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--border)", gap: 14 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 10, background: "linear-gradient(145deg,#1877F2,#0d5bbf)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0, gap: 2 }}>
                      <span style={{ fontSize: 22 }}>👜</span>
                      <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>Facebook</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{p.name}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{p.details}</div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, flexShrink: 0 }}>
                      <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800 }}>{fmtUSDT(p.price)}</div>
                      <div style={{ display: "flex", gap: 7 }}>
                        <button className="buy-btn" style={{ padding: "7px 16px", fontSize: 13 }} onClick={onGoShop}>Comprar</button>
                        <button className="icon-btn liked" onClick={() => onToggleLike(p.id)}>❤️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// ─── ADMIN COUPON MANAGER ─────────────────────────────────────────────────────
const CouponManager = ({ coupons, setCoupons }) => {
  const PRESET = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];
  const [sel, setSel] = useState(null);
  const [custom, setCustom] = useState("");
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);
  const pct = sel !== null ? sel : parseInt(custom) || null;
  const generate = () => {
    if (!pct || pct < 1 || pct > 99) return;
    const code = genCode(pct);
    const nc = { code, discount: pct, used: false, usedBy: null, usedAt: null, createdAt: today() };
    COUPON_DB.push(nc); setCoupons([...COUPON_DB]); setGenerated(nc); setCopied(false);
  };
  return (
    <div>
      <div className="page-title">🏷 Gestión de Cupones</div>
      <div className="coupon-creator">
        <div className="coupon-creator-title">✨ Crear nuevo cupón</div>
        <div className="coupon-creator-sub">Genera un cupón de uso único para compartir con clientes</div>
        <div className="form-label" style={{ color: "#6D28D9", marginBottom: 8 }}>Porcentaje de descuento:</div>
        <div className="percent-grid">
          {PRESET.map(p => <button key={p} className={`percent-btn ${sel === p ? "active" : ""}`} onClick={() => { setSel(p); setCustom(""); }}>{p}%</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "#6D28D9", fontWeight: 600 }}>Personalizado:</span>
          <input className="custom-percent" type="number" min="1" max="99" placeholder="35" value={custom} onChange={e => { setCustom(e.target.value); setSel(null); }} />
          <span style={{ fontSize: 14, color: "#6D28D9", fontWeight: 700 }}>%</span>
        </div>
        <button className="btn btn-purple" onClick={generate} style={{ opacity: (!pct || pct < 1 || pct > 99) ? 0.5 : 1 }}>⚡ Generar cupón único</button>
        {generated && (
          <div className="coupon-result">
            <div><div className="coupon-result-code">{generated.code}</div><div className="coupon-result-meta">{generated.discount}% off · Uso único · {generated.createdAt}</div></div>
            <button className="copy-code-btn" onClick={() => { navigator.clipboard.writeText(generated.code).catch(()=>{}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? "✓ Copiado!" : "📋 Copiar"}
            </button>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-title">Todos los cupones ({coupons.length})</div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Código</th><th>Descuento</th><th>Estado</th><th>Usado por</th><th>Fecha uso</th><th>Creado</th></tr></thead>
            <tbody>
              {coupons.map((c, i) => (
                <tr key={i}>
                  <td><code style={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "1px", color: c.used ? "var(--muted)" : "var(--purple)" }}>{c.code}</code></td>
                  <td><span className="badge badge-purple">{c.discount}% OFF</span></td>
                  <td>{c.used ? <span className="badge-used">⛔ USADO</span> : <span className="badge-active">✓ ACTIVO</span>}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.usedBy || "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.usedAt || "—"}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN ORDERS ─────────────────────────────────────────────────────────────
const AdminOrders = ({ orders, onConfirm }) => {
  const pending = orders.filter(o => o.status === "pending");
  return (
    <div>
      <div className="page-title">📦 Gestión de Órdenes</div>
      {pending.length > 0 && (
        <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8 }}>
          ⏳ <strong>{pending.length} orden{pending.length > 1 ? "es" : ""} pendiente{pending.length > 1 ? "s" : ""} de confirmación de pago</strong>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Productos</th><th>Red</th><th>Total</th><th>TX Hash</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {orders.slice().reverse().map(o => (
                <tr key={o.id} style={{ background: o.status === "pending" ? "#FFFBEB" : "transparent" }}>
                  <td><code style={{ fontSize: 11, color: "var(--purple)" }}>{o.id}</code></td>
                  <td><div style={{ fontSize: 13, fontWeight: 600 }}>{o.userName}</div><div style={{ fontSize: 11, color: "var(--muted)" }}>{o.userEmail}</div></td>
                  <td style={{ fontSize: 12, maxWidth: 180 }}>{o.items.map(i => `${i.name.slice(0, 25)}...`).join(", ")}</td>
                  <td><span className="tag-network">{o.network}</span></td>
                  <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(o.total)}</strong>{o.coupon && <div style={{ fontSize: 10, color: "var(--purple)" }}>🏷 {o.coupon}</div>}</td>
                  <td>{o.txHash ? <code style={{ fontSize: 10, color: "var(--blue)" }}>{o.txHash.slice(0, 14)}...</code> : <span style={{ fontSize: 11, color: "var(--muted)" }}>—</span>}</td>
                  <td><StatusPill status={o.status} /></td>
                  <td>{o.status === "pending" ? <button className="confirm-btn" onClick={() => onConfirm(o.id)}>✓ Confirmar pago</button> : <span className="confirmed-label">✓ Confirmado</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
const AdminPanel = ({ orders, onConfirmOrder, coupons, setCoupons }) => {
  const [section, setSection] = useState("overview");
  const [selConvo, setSelConvo] = useState(0);
  const [adminMsgs, setAdminMsgs] = useState([
    [{ role: "u", name: "Charly", text: "any item ? or just account?", time: "20:30" }, { role: "a", text: "Facebook BM available. Resellers discount 10%", time: "20:30" }],
    [{ role: "u", name: "John Doe", text: "Hola, cuál es el precio por cuentas USA?", time: "10:15" }],
  ]);
  const [aInp, setAInp] = useState("");
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [adminMsgs, selConvo]);
  const sendAdmin = () => {
    if (!aInp.trim()) return;
    setAdminMsgs(prev => prev.map((m, i) => i === selConvo ? [...m, { role: "a", text: aInp.trim(), time: nowTime() }] : m));
    setAInp("");
  };
  const convos = [
    { id: 0, name: "Charly Xentorix", preview: "any item ? or just account?", time: "20:30", unread: false },
    { id: 1, name: "John Doe", preview: "Hola, cuál es el precio?", time: "10:15", unread: true },
  ];
  const pendingCount = orders.filter(o => o.status === "pending").length;
  const activeCoupons = coupons.filter(c => !c.used).length;
  const sideItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "orders", icon: "📦", label: "Órdenes", badge: pendingCount, badgeColor: "var(--amber)" },
    { id: "coupons", icon: "🏷", label: "Cupones", badge: activeCoupons, badgeColor: "var(--purple)" },
    { id: "chat", icon: "💬", label: "Chat en vivo", badge: 1, badgeColor: "var(--red)" },
    { id: "products", icon: "🛍", label: "Productos" },
  ];
  return (
    <div className="admin-layout">
      <div className="sidebar">
        <div className="sidebar-section">Menú</div>
        {sideItems.map(s => (
          <button key={s.id} className={`sidebar-item ${section === s.id ? "active" : ""}`} onClick={() => setSection(s.id)}>
            {s.icon} {s.label}
            {s.badge > 0 && <span style={{ marginLeft: "auto", background: s.badgeColor, color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 6px", fontWeight: 700 }}>{s.badge}</span>}
          </button>
        ))}
      </div>
      <div className="admin-content">
        {section === "overview" && (
          <>
            <div className="page-title">📊 Overview</div>
            <div className="stats-row">
              <div className="stat-card"><div className="stat-label">Órdenes</div><div className="stat-value" style={{ color: "var(--red)" }}>{orders.length}</div></div>
              <div className="stat-card"><div className="stat-label">Pendientes</div><div className="stat-value" style={{ color: "var(--amber)" }}>{pendingCount}</div></div>
              <div className="stat-card"><div className="stat-label">Cupones activos</div><div className="stat-value" style={{ color: "var(--purple)" }}>{activeCoupons}</div></div>
              <div className="stat-card"><div className="stat-label">Ingresos USDT</div><div className="stat-value" style={{ color: "var(--usdt)" }}>{orders.filter(o=>o.status==="paid").reduce((s,o)=>s+o.total,0).toFixed(2)}</div></div>
            </div>
            {pendingCount > 0 && (
              <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8 }}>
                ⏳ <strong>{pendingCount} orden{pendingCount > 1 ? "es" : ""} esperando confirmación</strong>
                <button className="btn btn-sm" style={{ background: "var(--amber)", color: "#fff", border: "none", marginLeft: "auto" }} onClick={() => setSection("orders")}>Ver órdenes →</button>
              </div>
            )}
            <div className="card">
              <div className="card-title">Últimas órdenes</div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>ID</th><th>Cliente</th><th>Red</th><th>Total</th><th>Estado</th><th>Fecha</th></tr></thead>
                  <tbody>{orders.slice().reverse().slice(0, 5).map(o => (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: 11, color: "var(--purple)" }}>{o.id}</code></td>
                      <td style={{ fontSize: 12 }}>{o.userName}</td>
                      <td><span className="tag-network">{o.network}</span></td>
                      <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(o.total)}</strong></td>
                      <td><StatusPill status={o.status} /></td>
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.date}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {section === "orders" && <AdminOrders orders={orders} onConfirm={onConfirmOrder} />}
        {section === "coupons" && <CouponManager coupons={coupons} setCoupons={setCoupons} />}
        {section === "chat" && (
          <>
            <div className="page-title">💬 Chat en vivo</div>
            <div className="admin-chat-layout">
              <div className="convo-list">
                {convos.map(c => (
                  <div key={c.id} className={`convo-item ${selConvo === c.id ? "active" : ""}`} onClick={() => setSelConvo(c.id)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="convo-name">{c.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.time}</span>
                        {c.unread && <div className="unread-dot" />}
                      </div>
                    </div>
                    <div className="convo-preview">{c.preview}</div>
                  </div>
                ))}
              </div>
              <div className="chat-panel">
                <div className="chat-panel-header">
                  <div><div style={{ fontFamily: "Syne", fontWeight: 700 }}>{convos[selConvo].name}</div><div style={{ fontSize: 12, color: "var(--muted)" }}>Responder como agente</div></div>
                  <span className="badge badge-green">En línea</span>
                </div>
                <div className="chat-msgs" style={{ padding: 16 }}>
                  {adminMsgs[selConvo].map((m, i) => (
                    <div key={i} className={`cmsg ${m.role === "a" ? "cmsg-u" : "cmsg-a"}`}>
                      {m.role === "u" && <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 2 }}>{m.name}</div>}
                      <div className="cmsg-b">{m.text}</div>
                      <div className="cmsg-t">{m.time}</div>
                    </div>
                  ))}
                  <div ref={endRef} />
                </div>
                <div className="chat-input-row">
                  <input className="chat-inp" placeholder="Responder al cliente..." value={aInp} onChange={e => setAInp(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAdmin()} />
                  <button className="chat-snd" onClick={sendAdmin}>➤</button>
                </div>
              </div>
            </div>
          </>
        )}
        {section === "products" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div className="page-title" style={{ margin: 0 }}>🛍 Productos</div>
              <button className="btn btn-primary btn-sm">+ Agregar</button>
            </div>
            <div className="card">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>ID</th><th>Nombre</th><th>Precio</th><th>Stock</th><th>Ventas</th><th>Acciones</th></tr></thead>
                  <tbody>{PRODUCTS.map(p => (
                    <tr key={p.id}>
                      <td><code>#{p.id}</code></td>
                      <td style={{ maxWidth: 220, fontSize: 12 }}>{p.name}</td>
                      <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(p.price)}</strong></td>
                      <td><span className="chip chip-stock">{p.stock} pcs.</span></td>
                      <td><span className="chip chip-sales">{p.sales}</span></td>
                      <td style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm">✏️</button>
                        <button className="btn btn-sm" style={{ background: "var(--red-light)", color: "var(--red)" }}>🗑</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState("shop");
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingCoupon, setPendingCoupon] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [orders, setOrders] = useState([...ORDERS_DB]);
  const [lastOrder, setLastOrder] = useState(null);
  const [coupons, setCoupons] = useState([...COUPON_DB]);
  const [liked, setLiked] = useState({});
  const toggleLike = id => setLiked(l => ({ ...l, [id]: !l[id] }));

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = p => setCart(prev => {
    const idx = prev.findIndex(i => i.id === p.id);
    if (idx === -1) return [...prev, { ...p, qty: 1 }];
    return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
  });
  const removeFromCart = id => setCart(prev => prev.filter(i => i.id !== id));
  const setQty = (id, qty) => qty <= 0 ? removeFromCart(id) : setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));

  const handleCheckout = (coupon, total) => {
    setCartOpen(false);
    setPendingCoupon(coupon);
    setPendingTotal(total);
    if (!user) { setShowAuth(true); return; }
    setShowPayment(true);
  };

  const handlePaySuccess = (network, txHash) => {
    if (pendingCoupon) {
      const idx = COUPON_DB.findIndex(c => c.code === pendingCoupon.code);
      if (idx !== -1) { COUPON_DB[idx].used = true; COUPON_DB[idx].usedBy = user.email; COUPON_DB[idx].usedAt = today(); setCoupons([...COUPON_DB]); }
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = pendingCoupon ? subtotal * (pendingCoupon.discount / 100) : 0;
    const newOrder = {
      id: genOrderId(),
      userEmail: user.email,
      userName: user.name || user.email,
      items: cart.map(i => ({ name: i.name, price: i.price, qty: i.qty })),
      subtotal,
      discount,
      coupon: pendingCoupon?.code || null,
      discountPct: pendingCoupon?.discount || 0,
      total: pendingTotal,
      network,
      txHash,
      status: "pending",
      date: today(),
    };
    ORDERS_DB.push(newOrder);
    setOrders([...ORDERS_DB]);
    setLastOrder(newOrder);
    setShowPayment(false);
    setCart([]);
    setPendingCoupon(null);
    setShowSuccess(true);
  };

  const handleConfirmOrder = (orderId) => {
    const idx = ORDERS_DB.findIndex(o => o.id === orderId);
    if (idx !== -1) { ORDERS_DB[idx].status = "paid"; setOrders([...ORDERS_DB]); }
  };

  if (isAdmin) {
    return (
      <div className="app">
        <style>{css}</style>
        <div className="topbar">
          <div className="logo">BMVERIF<span style={{ fontSize: 11, background: "var(--red)", color: "#fff", padding: "2px 8px", borderRadius: 6, marginLeft: 7 }}>ADMIN</span></div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Panel de administración · {user.email}</div>
          <button className="btn btn-outline btn-sm" onClick={() => signOut()}>← Cerrar sesión</button>
        </div>
        <AdminPanel orders={orders} onConfirmOrder={handleConfirmOrder} coupons={coupons} setCoupons={setCoupons} />
      </div>
    );
  }

  return (
    <div className="app">
      <style>{css}</style>
      <div className="topbar">
        <div className="logo" onClick={() => setView("shop")}>BMVERIF</div>
        <div className="topbar-right">
          {user ? (
            <>
              <button className={`nav-tab ${view === "shop" ? "active" : ""}`} onClick={() => setView("shop")}>🛍 Tienda</button>
              <button className={`nav-tab ${view === "account" ? "active" : ""}`} onClick={() => setView("account")}>👤 Mi cuenta</button>
              <button className="btn btn-outline btn-sm" onClick={() => signOut()}>Salir</button>
            </>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => { setAuthTab("login"); setShowAuth(true); }}>Iniciar sesión</button>
            <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab("register"); setShowAuth(true); }}>Registrarse</button>
          )}
          <button className="cart-fab" onClick={() => setCartOpen(true)}>
            🛒 {totalItems > 0 ? <span className="cart-count">{totalItems}</span> : "Carrito"}
          </button>
        </div>
      </div>

      {view === "shop" && <ShopPage cart={cart} onAddToCart={addToCart} onCartOpen={() => setCartOpen(true)} liked={liked} onToggleLike={toggleLike} />}
      {view === "account" && user && <UserAccount user={user} userOrders={orders} liked={liked} onToggleLike={toggleLike} onGoShop={() => setView("shop")} />}

      {cartOpen && <CartDrawer cart={cart} onClose={() => setCartOpen(false)} onQty={setQty} onRemove={removeFromCart} onCheckout={handleCheckout} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowPayment(pendingTotal > 0)} initialTab={authTab} />}
      {showPayment && user && <PaymentModal cart={cart} user={user} coupon={pendingCoupon} finalTotal={pendingTotal} onClose={() => setShowPayment(false)} onSuccess={handlePaySuccess} />}
      {showSuccess && lastOrder && <SuccessModal order={lastOrder} onClose={() => { setShowSuccess(false); setView("account"); }} />}

      <ChatWidget />
    </div>
  );
}
