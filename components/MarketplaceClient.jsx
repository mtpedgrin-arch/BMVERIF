"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

// ─── WALLETS ──────────────────────────────────────────────────────────────────
const WALLETS = {
  TRC20: { addr: "TN3W4T6ATGBY9yGGxSUxxsLSzKWp1Aqbnk", network: "TRON (TRC20)", fee: "~1 USDT", time: "1–3 min", color: "#E84142", logo: "🔴" },
  BEP20: { addr: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", network: "BNB Smart Chain (BEP20)", fee: "~0.10 USDT", time: "3–5 min", color: "#F0B90B", logo: "🟡" },
};

// ORDERS_DB fue reemplazado por la base de datos (Neon/Prisma)

// COUPON_DB fue reemplazado por la base de datos (Neon/Prisma)

// PRODUCTS fue reemplazado por la base de datos (Neon/Prisma)

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
  .buy-btn:hover:not(:disabled) { background: var(--red-dark); transform: translateY(-1px); }
  .buy-btn:disabled { background: #D1D5DB; color: #9CA3AF; cursor: not-allowed; }
  .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 15px; color: var(--muted); transition: all 0.15s; flex-shrink: 0; }
  .icon-btn:hover, .icon-btn.liked { border-color: var(--red); color: var(--red); background: var(--red-light); }
  .in-cart-badge { background: var(--green); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; }

  /* CHECKOUT PAGE */
  .checkout-page { flex: 1; padding: 28px 20px; max-width: 1080px; margin: 0 auto; width: 100%; }
  .checkout-crumb { font-size: 13px; color: var(--muted); margin-bottom: 18px; display: flex; align-items: center; gap: 6px; }
  .checkout-crumb span { color: var(--red); cursor: pointer; font-weight: 600; }
  .checkout-grid { display: grid; grid-template-columns: 1fr 380px; gap: 24px; align-items: start; }
  @media (max-width: 800px) { .checkout-grid { grid-template-columns: 1fr; } }
  .checkout-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; box-shadow: var(--shadow); margin-bottom: 16px; }
  .checkout-card-head { padding: 16px 20px; border-bottom: 1.5px solid var(--border); font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
  .co-item { display: flex; align-items: center; gap: 12px; padding: 14px 20px; border-bottom: 1px solid var(--border); }
  .co-item:last-child { border-bottom: none; }
  .co-item-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #1877F2 0%, #0d5bbf 100%); border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; flex-shrink: 0; }
  .co-item-info { flex: 1; min-width: 0; }
  .co-item-name { font-size: 13px; font-weight: 600; line-height: 1.35; }
  .co-item-price { font-size: 12px; color: var(--muted); margin-top: 2px; }
  .co-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .co-item-total { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 800; color: var(--usdt); }
  .co-qty { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
  .co-qty-btn { background: var(--bg); border: none; width: 28px; height: 28px; font-size: 14px; cursor: pointer; }
  .co-qty-btn:hover { background: var(--red-light); color: var(--red); }
  .co-qty-num { width: 30px; text-align: center; font-weight: 700; font-size: 13px; }
  .co-remove { background: none; border: none; color: var(--muted); font-size: 16px; cursor: pointer; padding: 4px; }
  .co-remove:hover { color: var(--red); }
  .co-empty { text-align: center; padding: 50px 20px; color: var(--muted); }
  .co-coupon-row { display: flex; gap: 8px; padding: 14px 20px; }
  .co-coupon-inp { flex: 1; border: 1.5px solid var(--border); border-radius: 9px; padding: 9px 13px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; outline: none; background: var(--bg); transition: border-color 0.15s; }
  .co-coupon-inp:focus { border-color: var(--purple); background: #fff; }
  .co-coupon-inp.valid { border-color: var(--green); background: var(--green-light); }
  .co-coupon-inp.invalid { border-color: var(--red); animation: shake 0.35s ease; }
  .co-totals { padding: 16px 20px; background: var(--bg); border-top: 1.5px solid var(--border); }
  .co-total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: var(--muted); }
  .co-total-row.discount { color: var(--green); font-weight: 600; }
  .co-total-row.grand { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--text); margin-top: 10px; padding-top: 10px; border-top: 1.5px solid var(--border); margin-bottom: 0; }
  .co-total-row.grand span:last-child { color: var(--usdt); }
  .co-method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px 20px; }
  .co-method-card { border: 2px solid var(--border); border-radius: 12px; padding: 14px 12px; cursor: pointer; transition: all 0.15s; position: relative; }
  .co-method-card:hover { border-color: var(--usdt); }
  .co-method-card.sel { border-color: var(--usdt); background: var(--usdt-light); }
  .co-method-card.sel::after { content: '✓'; position: absolute; top: 8px; right: 10px; font-size: 12px; font-weight: 800; color: var(--usdt); }
  .co-wallet-box { margin: 0 20px 16px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 12px; padding: 14px; animation: scaleIn 0.18s ease; }
  .co-wallet-label { font-size: 11px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .co-wallet-addr { font-family: monospace; font-size: 12px; word-break: break-all; line-height: 1.5; color: var(--text); margin-bottom: 10px; }
  .co-copy-btn { background: var(--usdt); color: #fff; border: none; padding: 7px 14px; border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: background 0.15s; }
  .co-copy-btn:hover { background: #1f8f6a; }
  .co-amount-box { margin: 0 20px 16px; background: linear-gradient(135deg, var(--usdt-light), #d0f5e8); border: 1.5px solid #a7f0d8; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .co-tx-wrap { padding: 0 20px 16px; }
  .co-agree { padding: 14px 20px; display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--muted); border-top: 1px solid var(--border); }
  .co-agree input { margin-top: 2px; accent-color: var(--usdt); width: 15px; height: 15px; flex-shrink: 0; cursor: pointer; }
  .co-submit { margin: 0 20px 20px; width: calc(100% - 40px); padding: 14px; background: var(--usdt); color: #fff; border: none; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; font-family: 'Syne', sans-serif; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .co-submit:hover:not(:disabled) { background: #1f8f6a; transform: translateY(-1px); }
  .co-submit:disabled { background: #D1D5DB; color: #9CA3AF; cursor: not-allowed; transform: none; }
  .co-success { text-align: center; padding: 40px 24px; }

  /* MINI CART POPUP */
  .mini-cart-popup { position: fixed; top: 70px; right: 20px; width: 320px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,0.18); z-index: 250; animation: slideDown 0.22s ease; overflow: hidden; }
  @keyframes slideDown { from { opacity:0; transform:translateY(-10px); } to { opacity:1; transform:translateY(0); } }
  .mini-cart-head { background: var(--text); color: #fff; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between; }
  .mini-cart-head-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 7px; }
  .mini-cart-head-count { background: var(--red); color: #fff; width: 20px; height: 20px; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  .mini-cart-close { background: rgba(255,255,255,0.15); border: none; color: #fff; width: 24px; height: 24px; border-radius: 50%; font-size: 13px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .mini-cart-added { background: #E8F7EE; border-bottom: 1px solid var(--border); padding: 10px 16px; font-size: 12px; color: var(--green); font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .mini-cart-items { max-height: 200px; overflow-y: auto; }
  .mini-cart-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; border-bottom: 1px solid var(--border); }
  .mini-cart-item:last-child { border-bottom: none; }
  .mini-cart-item-icon { width: 36px; height: 36px; background: linear-gradient(135deg, #1877F2, #0d5bbf); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
  .mini-cart-item-info { flex: 1; min-width: 0; }
  .mini-cart-item-name { font-size: 12px; font-weight: 600; line-height: 1.3; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .mini-cart-item-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }
  .mini-cart-item-price { font-size: 13px; font-weight: 800; color: var(--usdt); white-space: nowrap; font-family: 'Syne', sans-serif; }
  .mini-cart-footer { padding: 12px 16px; border-top: 1.5px solid var(--border); background: var(--bg); }
  .mini-cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
  .mini-cart-total-label { font-size: 12px; color: var(--muted); font-weight: 600; }
  .mini-cart-total-value { font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 800; color: var(--usdt); }
  .mini-cart-btn { width: 100%; padding: 10px; background: var(--red); color: #fff; border: none; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; font-family: 'Syne', sans-serif; transition: background 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; }
  .mini-cart-btn:hover { background: var(--red-dark); }

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
  th { text-align: left; padding: 8px 11px; background: #EDEBE8; color: var(--muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; border-bottom: 2px solid #C8C3BC; }
  td { padding: 10px 11px; border-bottom: 1.5px solid #C8C3BC; vertical-align: middle; }
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
  .cmsg-a .cmsg-b { background: #D8DEF0; color: #1A1614; border-bottom-left-radius: 3px; }
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

  /* DARK MODE TOGGLE BUTTON */
  .dark-toggle { background: none; border: 1.5px solid var(--border); border-radius: 8px; width: 34px; height: 34px; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .dark-toggle:hover { border-color: var(--red); background: var(--red-light); }

  /* ── DARK MODE ── */
  .app.dark {
    --bg: #111318; --surface: #1C1F2E; --border: #2E3148; --text: #E2E6F0; --muted: #8892A4;
    --red-light: #3D1010; --green-light: #0C2818; --amber-light: #281900; --blue-light: #0C1E35;
    --purple-light: #1C1040; --usdt-light: #082015; --teal-light: #062025;
    --amber: #F59E0B; --amber-border: #92400E;
    --shadow: 0 1px 4px rgba(0,0,0,0.4); --shadow-lg: 0 8px 40px rgba(0,0,0,0.6);
    color-scheme: dark;
  }
  .app.dark { background: var(--bg); color: var(--text); }
  .app.dark .hero { background: linear-gradient(135deg, #080604 0%, #140b0b 55%, #1a0707 100%); }
  .app.dark .topbar { background: var(--surface); border-color: var(--border); }
  .app.dark .sidebar { background: var(--surface); border-color: var(--border); }
  .app.dark .sidebar-item:hover { background: #222535; }
  .app.dark .product-list { background: var(--surface); border-color: var(--border); }
  .app.dark .product-row:hover { background: #222535; }
  .app.dark .prod-thumb-inner { background: linear-gradient(145deg, #0e3a86 0%, #092261 100%); }
  .app.dark .card { background: var(--surface); border-color: var(--border); }
  .app.dark .stat-card { background: var(--surface); border-color: var(--border); }
  .app.dark table thead th { background: var(--bg); border-bottom-color: var(--border); }
  .app.dark td { border-bottom-color: var(--border); }
  .app.dark tr:hover td { background: #222535; }
  .app.dark .modal { background: var(--surface); }
  .app.dark .modal-overlay { background: rgba(0,0,0,0.75); }
  .app.dark .cart-drawer { background: var(--surface); }
  .app.dark .cart-overlay { background: rgba(0,0,0,0.65); }
  .app.dark .mini-cart-popup { background: var(--surface); border-color: var(--border); }
  .app.dark .mini-cart-head { background: #111318; }
  .app.dark .mini-cart-footer { background: var(--bg); }
  .app.dark .mini-cart-item-icon { background: linear-gradient(135deg, #0e3a86, #092261); }
  .app.dark .checkout-card { background: var(--surface); border-color: var(--border); }
  .app.dark .co-totals { background: var(--bg); border-color: var(--border); }
  .app.dark .co-item-icon { background: linear-gradient(135deg, #0e3a86 0%, #092261 100%); }
  .app.dark .co-method-card { border-color: var(--border); }
  .app.dark .co-method-card.sel { background: #082015; border-color: var(--usdt); }
  .app.dark .co-wallet-box { background: var(--bg); border-color: var(--border); }
  .app.dark .co-amount-box { background: linear-gradient(135deg, #082015, #0a2a1a); border-color: #1f6b42; }
  .app.dark .usdt-header { background: linear-gradient(135deg, #082015 0%, #0a2a1a 100%); border-color: #1f6b42; }
  .app.dark .network-card { border-color: var(--border); }
  .app.dark .network-card.selected { background: #082015; border-color: var(--usdt); }
  .app.dark .wallet-box { background: var(--bg); border-color: var(--border); }
  .app.dark .amount-highlight { background: linear-gradient(135deg, #082015, #0a2a1a); border-color: #1f6b42; }
  .app.dark .order-summary-mini { background: var(--bg); }
  .app.dark .warning-box { background: #281900; border-color: #6b4c00; }
  .app.dark .chat-window { background: var(--surface); border-color: var(--border); }
  .app.dark .chat-head { background: #A81E1E; }
  .app.dark .cmsg-a .cmsg-b { background: #2D3350; color: var(--text); }
  .app.dark .admin-chat-layout { background: var(--surface); border-color: var(--border); }
  .app.dark .convo-list { border-color: var(--border); }
  .app.dark .convo-item:hover, .app.dark .convo-item.active { background: #3D1010; }
  .app.dark .chat-panel-header { border-color: var(--border); }
  .app.dark .coupon-creator { background: linear-gradient(135deg, #1C1040 0%, #201548 100%); border-color: #6D28D9; }
  .app.dark .coupon-creator-sub { color: #C084FC; }
  .app.dark .percent-btn { background: var(--bg); color: #C084FC; border-color: #7C3AED; }
  .app.dark .percent-btn:hover, .app.dark .percent-btn.active { background: var(--purple); color: #fff; border-color: var(--purple); }
  .app.dark .custom-percent { background: var(--bg); color: #C084FC; border-color: #7C3AED; }
  .app.dark .coupon-result { background: var(--surface); border-color: var(--purple); }
  .app.dark .form-input { background: var(--bg); color: var(--text); border-color: var(--border); }
  .app.dark .form-input:focus { background: var(--surface); border-color: var(--red); }
  .app.dark .chat-inp { background: var(--bg); color: var(--text); border-color: var(--border); }
  .app.dark .coupon-input { background: var(--bg); color: var(--text); border-color: var(--border); }
  .app.dark .co-coupon-inp { background: var(--bg); color: var(--text); border-color: var(--border); }
  .app.dark .tx-input { background: var(--bg); color: var(--text); border-color: var(--border); }
  .app.dark input::placeholder, .app.dark textarea::placeholder { color: var(--muted); }
  .app.dark .cart-fab { background: var(--red); color: #fff; }
  .app.dark .cart-fab:hover { background: var(--red-dark); }

  /* DATE RANGE PILLS */
  .date-pills { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px; }
  .date-pill { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1.5px solid var(--border); background: var(--surface); color: var(--muted); cursor: pointer; transition: all 0.13s; }
  .date-pill:hover { border-color: var(--red); color: var(--red); background: var(--red-light); }
  .date-pill.active { background: var(--red); color: #fff; border-color: var(--red); }

  /* PROFIT CARDS */
  .profit-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(155px, 1fr)); gap: 12px; margin-bottom: 20px; }
  .profit-card { background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; padding: 16px 18px; box-shadow: var(--shadow); }
  .profit-card-icon { font-size: 22px; margin-bottom: 6px; }
  .profit-card-label { font-size: 11px; color: var(--muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
  .profit-card-value { font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800; line-height: 1.2; }
  .profit-card-sub { font-size: 11px; color: var(--muted); margin-top: 4px; }
  .app.dark .profit-card { background: var(--surface); border-color: var(--border); }
  .app.dark .date-pill { background: var(--surface); border-color: var(--border); }
  .app.dark .date-pill:hover { background: var(--red-light); border-color: var(--red); }

  /* PRODUCT DETAIL PAGE */
  .product-row { cursor: pointer; }
  .product-detail-page { flex: 1; background: var(--bg); min-height: calc(100vh - 60px); }
  .pd-breadcrumb { max-width: 1000px; margin: 0 auto; padding: 14px 20px 0; font-size: 13px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .pd-breadcrumb span { color: var(--red); cursor: pointer; font-weight: 600; }
  .pd-breadcrumb span:hover { text-decoration: underline; }
  .pd-grid { max-width: 1000px; margin: 0 auto; padding: 18px 20px 40px; display: grid; grid-template-columns: 190px 1fr 280px; gap: 22px; align-items: start; }
  @media (max-width: 900px) { .pd-grid { grid-template-columns: 1fr 1fr; } .pd-price-panel { grid-column: 1 / -1; position: static; } }
  @media (max-width: 640px) { .pd-grid { grid-template-columns: 1fr; padding: 14px 14px 30px; } }
  .pd-img-col { position: sticky; top: 80px; }
  .pd-thumb-large { width: 100%; aspect-ratio: 1; background: linear-gradient(145deg, #1877F2 0%, #0d5bbf 100%); border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; border: 2px solid var(--border); }
  .pd-thumb-large-icon { font-size: 60px; line-height: 1; }
  .pd-thumb-label { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: 0.5px; }
  .pd-info-col { min-width: 0; }
  .pd-title { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; line-height: 1.3; margin-bottom: 10px; letter-spacing: -0.3px; }
  .pd-meta-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
  .pd-section-label { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 7px; }
  .pd-attrs { display: flex; flex-direction: column; border: 1.5px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  .pd-attr-row { display: grid; grid-template-columns: 140px 1fr; border-bottom: 1px solid var(--border); }
  .pd-attr-row:last-child { border-bottom: none; }
  .pd-attr-key { padding: 9px 13px; font-size: 12px; font-weight: 600; color: var(--muted); background: var(--bg); }
  .pd-attr-val { padding: 9px 13px; font-size: 13px; font-weight: 500; }
  .pd-tier-table { border: 1.5px solid var(--border); border-radius: 12px; overflow: hidden; margin-bottom: 16px; }
  .pd-tier-head { background: var(--bg); display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 8px 13px; border-bottom: 1px solid var(--border); }
  .pd-tier-head span { font-size: 10px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
  .pd-tier-row { display: grid; grid-template-columns: 1fr 1fr 1fr; padding: 9px 13px; border-top: 1px solid var(--border); align-items: center; }
  .pd-tier-row:first-child { border-top: none; }
  .pd-tier-row.active-tier { background: var(--green-light); }
  .pd-tier-qty { font-size: 13px; font-weight: 700; }
  .pd-tier-price { font-size: 14px; font-weight: 800; color: var(--usdt); }
  .pd-tier-disc { font-size: 12px; font-weight: 700; color: var(--green); }
  .pd-desc-section { margin-bottom: 16px; }
  .pd-desc { font-size: 13px; line-height: 1.7; color: var(--muted); white-space: pre-wrap; }
  .pd-warranty { background: var(--green-light); border: 1.5px solid var(--green-border); border-radius: 12px; padding: 13px 15px; display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px; }
  .pd-warranty-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
  .pd-warranty-text { font-size: 12px; line-height: 1.5; color: var(--green); }
  .pd-warranty-title { font-weight: 700; margin-bottom: 2px; font-size: 13px; }
  .pd-price-panel { position: sticky; top: 80px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 16px; padding: 20px; box-shadow: var(--shadow-lg); }
  .pd-panel-price { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--usdt); margin-bottom: 2px; }
  .pd-panel-base { font-size: 13px; color: var(--muted); text-decoration: line-through; margin-bottom: 4px; }
  .pd-panel-disc { display: inline-flex; align-items: center; gap: 5px; background: var(--green-light); color: var(--green); border: 1px solid var(--green-border); border-radius: 8px; padding: 3px 10px; font-size: 12px; font-weight: 800; margin-bottom: 14px; }
  .pd-panel-stock { font-size: 12px; color: var(--muted); margin-bottom: 16px; display: flex; align-items: center; gap: 6px; }
  .pd-qty-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .pd-qty-label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
  .pd-buy-btn { width: 100%; padding: 13px; background: var(--red); color: #fff; border: none; border-radius: 11px; font-size: 15px; font-weight: 800; font-family: 'Syne', sans-serif; transition: all 0.15s; margin-bottom: 8px; cursor: pointer; }
  .pd-buy-btn:hover:not(:disabled) { background: var(--red-dark); transform: translateY(-1px); }
  .pd-buy-btn:disabled { background: #D1D5DB; color: #9CA3AF; cursor: not-allowed; }
  .pd-cart-btn { width: 100%; padding: 11px; background: none; border: 2px solid var(--usdt); color: var(--usdt); border-radius: 11px; font-size: 14px; font-weight: 700; font-family: 'Syne', sans-serif; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 6px; cursor: pointer; }
  .pd-cart-btn:hover:not(:disabled) { background: var(--usdt-light); }
  .pd-cart-btn:disabled { border-color: #D1D5DB; color: #9CA3AF; cursor: not-allowed; }
  .pd-next-tier { background: var(--amber-light); border: 1px solid var(--amber-border); border-radius: 9px; padding: 9px 12px; font-size: 12px; color: var(--amber); margin-top: 10px; line-height: 1.4; }
  /* ── Reviews ── */
  .pd-reviews-section { margin-top: 18px; }
  .pd-review-item { padding: 12px 0; border-top: 1.5px solid var(--border); }
  .pd-review-header { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; flex-wrap: wrap; }
  .pd-review-name { font-size: 13px; font-weight: 700; }
  .pd-review-date { font-size: 11px; color: var(--muted); margin-left: auto; }
  .pd-review-comment { font-size: 13px; color: var(--muted); line-height: 1.5; }
  .pd-reviews-summary { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; margin-bottom: 14px; }
  .pd-reviews-avg { font-family: Syne; font-size: 26px; font-weight: 800; color: var(--text); }
  .pd-review-form { margin-top: 14px; padding: 14px; background: var(--bg); border: 1.5px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; gap: 10px; }
  .pd-star-picker { display: flex; align-items: center; gap: 4px; }
  .pd-star-pick { font-size: 26px; cursor: pointer; color: #D1D5DB; transition: color 0.1s; line-height: 1; }
  .pd-star-pick.active { color: #F59E0B; }
  .app.dark .pd-review-item { border-color: var(--border); }
  .app.dark .pd-reviews-summary { background: var(--bg); border-color: var(--border); }
  .app.dark .pd-review-form { background: var(--bg); border-color: var(--border); }
  .app.dark .pd-star-pick { color: #4B5563; }
  .app.dark .pd-star-pick.active { color: #F59E0B; }
  .app.dark .product-detail-page { background: var(--bg); }
  .app.dark .pd-thumb-large { background: linear-gradient(145deg, #0e3a86 0%, #092261 100%); border-color: var(--border); }
  .app.dark .pd-attrs { border-color: var(--border); }
  .app.dark .pd-attr-key { background: var(--bg); }
  .app.dark .pd-attr-row { border-color: var(--border); }
  .app.dark .pd-tier-table { border-color: var(--border); }
  .app.dark .pd-tier-head { background: var(--bg); border-color: var(--border); }
  .app.dark .pd-tier-row { border-color: var(--border); }
  .app.dark .pd-price-panel { background: var(--surface); border-color: var(--border); }
  .app.dark .pd-warranty { background: var(--green-light); border-color: var(--green-border); }
`;


// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = n => `$${Number(n).toFixed(2)}`;
const fmtUSDT = n => `${Number(n).toFixed(2)} USDT`;

// Returns the effective unit price given quantity-based tiers
const getTierPrice = (basePrice, tiers, qty) => {
  if (!tiers || tiers.length === 0) return basePrice;
  const sorted = [...tiers].filter(t => t.qty > 0 && t.price > 0).sort((a, b) => b.qty - a.qty);
  const match = sorted.find(t => qty >= t.qty);
  return match ? match.price : basePrice;
};
// Returns the next tier not yet reached above totalQty, or null
const getNextTier = (tiers, totalQty) => {
  if (!tiers || tiers.length === 0) return null;
  const sorted = [...tiers].filter(t => t.qty > 0 && t.price > 0).sort((a, b) => a.qty - b.qty);
  return sorted.find(t => t.qty > totalQty) || null;
};
// Recalculates prices for the whole cart:
// items sharing the same basePrice count together toward tier thresholds.
// Tiers are merged across all items at the same base price, so if ANY
// product at $80 has tiers configured, ALL $80 products benefit.
const rebalanceTiers = (cart) => {
  const qtyByPrice = {};
  const tiersByPrice = {};
  cart.forEach(i => {
    const b = i.basePrice ?? i.price;
    qtyByPrice[b] = (qtyByPrice[b] || 0) + i.qty;
    if (i.tiers && i.tiers.length > 0) {
      if (!tiersByPrice[b]) tiersByPrice[b] = [];
      i.tiers.forEach(t => {
        const existing = tiersByPrice[b].find(x => x.qty === t.qty);
        if (!existing) tiersByPrice[b].push({ qty: t.qty, price: t.price });
        else if (t.price < existing.price) existing.price = t.price;
      });
    }
  });
  return cart.map(i => {
    const base = i.basePrice ?? i.price;
    const effectiveTiers = tiersByPrice[base] || i.tiers || [];
    return { ...i, tiers: effectiveTiers, price: getTierPrice(base, effectiveTiers, qtyByPrice[base] || i.qty) };
  });
};
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
  if (!rating) return null;
  const full = Math.floor(rating), partial = rating % 1 >= 0.5 ? 1 : 0, empty = 5 - full - partial;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <span style={{ fontSize: 12, fontWeight: 700, marginRight: 2 }}>{rating}</span>
      {[...Array(full)].map((_,i) => <span key={`f${i}`} className="star">★</span>)}
      {partial === 1 && <span className="star" style={{ opacity: 0.6 }}>★</span>}
      {[...Array(empty)].map((_,i) => <span key={`e${i}`} className="star-empty">★</span>)}
      {reviews != null && <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 2 }}>({reviews})</span>}
    </div>
  );
};

// ─── CHAT WIDGET ─────────────────────────────────────────────────────────────
const ChatWidget = ({ user, onShowAuth }) => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMsgs = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (Array.isArray(data)) setMsgs(data);
    } catch {}
  };

  useEffect(() => {
    if (!open || !user) return;
    fetchMsgs();
    pollRef.current = setInterval(fetchMsgs, 4000);
    return () => { clearInterval(pollRef.current); };
  }, [open, user?.email]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async () => {
    if (!inp.trim() || sending) return;
    setSending(true);
    const text = inp.trim();
    setInp("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const msg = await res.json();
      if (res.ok) setMsgs(p => [...p, msg]);
    } catch {}
    finally { setSending(false); }
  };

  const handleFabClick = () => {
    if (!user) { onShowAuth?.(); return; }
    setOpen(o => !o);
  };

  return (
    <>
      <button className="chat-fab-btn" onClick={handleFabClick}>
        💬<span className="online-dot" />
      </button>
      {open && user && (
        <div className="chat-window">
          <div className="chat-head">
            <div className="chat-agent-info">
              <div className="agent-av">S</div>
              <div><div className="agent-nm">Soporte</div><div className="agent-st">● En línea</div></div>
            </div>
            <button className="chat-x" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-msgs">
            {msgs.length === 0 && (
              <div className="cmsg cmsg-a">
                <div className="cmsg-b">¡Hola! 👋 ¿En qué puedo ayudarte hoy?</div>
                <div className="cmsg-t">{nowTime()}</div>
              </div>
            )}
            {msgs.map((m) => (
              <div key={m.id} className={`cmsg ${m.isAdmin ? "cmsg-a" : "cmsg-u"}`}>
                <div className="cmsg-b">{m.text}</div>
                <div className="cmsg-t">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="chat-input-row">
            <input
              className="chat-inp"
              placeholder="Escribe aquí..."
              value={inp}
              onChange={e => setInp(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={sending}
            />
            <button className="chat-snd" onClick={send} disabled={sending}>➤</button>
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
const PaymentModal = ({ cart, user, coupon, finalTotal, onClose, onSuccess, wallets: W = WALLETS }) => {
  const [network, setNetwork] = useState(null);
  const [txHash, setTxHash] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState(1);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = coupon ? subtotal * (coupon.discount / 100) : 0;

  const selectNetwork = (n) => { setNetwork(n); setStep(2); };
  const copy = () => {
    navigator.clipboard.writeText(W[network].addr).catch(() => {});
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
              {Object.entries(W).map(([key, w]) => (
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
              <div className="wallet-box-label">{W[network].logo} Wallet USDT {network} — {W[network].network}</div>
              <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(W[network].addr)}&margin=10`}
                  alt={`QR ${network}`}
                  style={{ width: 180, height: 180, border: `3px solid ${W[network].color}`, borderRadius: 10, padding: 4, background: "#fff" }}
                />
              </div>
              <div className="wallet-address">{W[network].addr}</div>
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

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
const CheckoutPage = ({ cart, onQty, onRemove, user, onGoShop, onSuccess, onShowAuth, wallets: W = WALLETS }) => {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponState, setCouponState] = useState("idle");
  const [couponError, setCouponError] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [txHash, setTxHash] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
  const total = subtotal - discountAmt;
  const wallet = W[network];

  const applyCoupon = async () => {
    setCouponError(""); if (!couponInput.trim()) return;
    try {
      const res = await fetch("/api/coupons/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponInput.trim().toUpperCase() }) });
      const data = await res.json();
      if (!res.ok) { setCouponState("invalid"); setCouponError(data.error || "Cupón inválido."); setTimeout(() => setCouponState("idle"), 600); return; }
      setAppliedCoupon(data); setCouponState("valid"); setCouponInput("");
    } catch { setCouponState("invalid"); setCouponError("Error de conexión."); setTimeout(() => setCouponState("idle"), 600); }
  };

  const handleSubmit = async () => {
    if (!user) { onShowAuth(); return; }
    if (!agreed) return;
    setSubmitting(true);
    try {
      if (appliedCoupon) {
        await fetch("/api/coupons/use", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: appliedCoupon.code }) }).catch(() => {});
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost || 0, qty: i.qty })),
          subtotal, discount: discountAmt,
          coupon: appliedCoupon?.code || null,
          total, network, txHash,
        }),
      });
      const order = await res.json();
      setOrderId(order.id || "—");
      setDone(true);
      onSuccess(order);
    } catch { alert("Error al procesar. Intentá de nuevo."); }
    finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="checkout-page">
      <div className="checkout-card" style={{ maxWidth: 500, margin: "40px auto" }}>
        <div className="co-success">
          <div style={{ fontSize: 60, marginBottom: 14 }}>✅</div>
          <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 8 }}>¡Pago enviado!</div>
          <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 20 }}>
            Tu orden <strong style={{ color: "var(--text)" }}>#{orderId?.slice(-8)}</strong> quedó en estado
            <span className="status-pending" style={{ display: "inline-flex", margin: "0 6px" }}>⏳ Pendiente</span>
            mientras verificamos el pago en la red {network}.
          </div>
          <button className="btn btn-primary btn-full" onClick={() => onGoShop()}>← Volver a la tienda</button>
        </div>
      </div>
    </div>
  );

  if (cart.length === 0) return (
    <div className="checkout-page">
      <div className="checkout-card" style={{ maxWidth: 400, margin: "60px auto", textAlign: "center", padding: "50px 24px" }}>
        <div style={{ fontSize: 50, marginBottom: 12 }}>🛒</div>
        <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Tu carrito está vacío</div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 20 }}>Agregá productos antes de finalizar la compra.</div>
        <button className="btn btn-primary" onClick={onGoShop}>Ver productos</button>
      </div>
    </div>
  );

  return (
    <div className="checkout-page">
      <div className="checkout-crumb">
        <span onClick={onGoShop}>← Tienda</span> / Checkout
      </div>
      <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 20 }}>Finalizar compra</div>
      <div className="checkout-grid">

        {/* ─── COLUMNA IZQUIERDA ─── */}
        <div>
          {/* Productos */}
          <div className="checkout-card">
            <div className="checkout-card-head">🛒 Tu pedido</div>
            {cart.map(item => (
              <div key={item.id} className="co-item">
                <div className="co-item-icon">
                  <span style={{ fontSize: 22 }}>👜</span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: "#fff" }}>FB</span>
                </div>
                <div className="co-item-info">
                  <div className="co-item-name">{item.name}</div>
                  <div className="co-item-price">{fmtUSDT(item.price)} por unidad</div>
                </div>
                <div className="co-item-right">
                  <div className="co-item-total">{fmtUSDT(item.price * item.qty)}</div>
                  <div className="co-qty">
                    <button className="co-qty-btn" onClick={() => onQty(item.id, item.qty - 1)}>−</button>
                    <span className="co-qty-num">{item.qty}</span>
                    <button className="co-qty-btn" onClick={() => onQty(item.id, item.qty + 1)}>+</button>
                  </div>
                  <button className="co-remove" onClick={() => onRemove(item.id)}>🗑</button>
                </div>
              </div>
            ))}

            {/* Cupón */}
            <div className="co-coupon-row">
              {!appliedCoupon ? (
                <>
                  <input className={`co-coupon-inp ${couponState === "valid" ? "valid" : couponState === "invalid" ? "invalid" : ""}`} placeholder="Código de descuento" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); setCouponState("idle"); }} onKeyDown={e => e.key === "Enter" && applyCoupon()} />
                  <button className="apply-btn" onClick={applyCoupon} disabled={!couponInput.trim()}>Aplicar</button>
                </>
              ) : (
                <div className="coupon-applied" style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span>✅</span>
                    <div><div className="coupon-applied-code">{appliedCoupon.code}</div><div className="coupon-applied-desc">{appliedCoupon.discount}% off aplicado</div></div>
                  </div>
                  <button className="coupon-remove" onClick={() => { setAppliedCoupon(null); setCouponState("idle"); }}>✕</button>
                </div>
              )}
            </div>
            {couponError && <div style={{ padding: "0 20px 10px", fontSize: 12, color: "var(--red)" }}>⚠ {couponError}</div>}

            {/* Totales */}
            <div className="co-totals">
              <div className="co-total-row"><span>Subtotal</span><span>{fmtUSDT(subtotal)}</span></div>
              {appliedCoupon && <div className="co-total-row discount"><span>Descuento ({appliedCoupon.discount}%)</span><span>− {fmtUSDT(discountAmt)}</span></div>}
              <div className="co-total-row grand"><span>Total</span><span>{fmtUSDT(total)}</span></div>
            </div>
          </div>
        </div>

        {/* ─── COLUMNA DERECHA ─── */}
        <div>
          <div className="checkout-card">
            <div className="checkout-card-head">₮ Método de pago</div>

            {/* Info usuario */}
            {user && (
              <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Cuenta</div>
                <div style={{ fontWeight: 600 }}>{user.name || user.email}</div>
                <div style={{ color: "var(--muted)", fontSize: 12 }}>{user.email}</div>
              </div>
            )}

            {/* Selector de red */}
            <div className="co-method-grid">
              {Object.entries(W).map(([key, w]) => (
                <div key={key} className={`co-method-card ${network === key ? "sel" : ""}`} onClick={() => setNetwork(key)}>
                  <div style={{ fontSize: 22, marginBottom: 5 }}>{w.logo}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{key}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{w.network.split("(")[0].trim()}</div>
                  <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                    <span className="network-tag">Fee {w.fee}</span>
                    <span className="network-tag">{w.time}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Monto a enviar */}
            <div className="co-amount-box">
              <div>
                <div style={{ fontSize: 11, color: "var(--usdt)", fontWeight: 600, marginBottom: 2 }}>Monto exacto a enviar</div>
                <div style={{ fontFamily: "Syne", fontSize: 26, fontWeight: 800, color: "var(--usdt)" }}>{total.toFixed(2)} <span style={{ fontSize: 14 }}>USDT</span></div>
              </div>
              <div style={{ fontSize: 30 }}>₮</div>
            </div>

            {/* Wallet + QR */}
            <div className="co-wallet-box">
              <div className="co-wallet-label">Dirección {network}</div>
              <div style={{ textAlign: "center", margin: "10px 0 8px" }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(wallet.addr)}&margin=10`}
                  alt={`QR ${network}`}
                  style={{ width: 180, height: 180, border: `3px solid ${wallet.color}`, borderRadius: 10, padding: 4, background: "#fff" }}
                />
              </div>
              <div className="co-wallet-addr">{wallet.addr}</div>
              <button className="co-copy-btn" onClick={() => { navigator.clipboard.writeText(wallet.addr).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
                {copied ? "✓ Copiado!" : "📋 Copiar dirección"}
              </button>
            </div>

            {/* TX Hash */}
            <div className="co-tx-wrap">
              <div className="form-label">Hash de transacción (recomendado)</div>
              <input className="form-input" style={{ fontFamily: "monospace", fontSize: 12 }} placeholder="0x... o TX..." value={txHash} onChange={e => setTxHash(e.target.value)} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Pegarlo acelera la verificación del admin.</div>
            </div>

            {/* Agree */}
            <div className="co-agree">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>Entiendo que el pago en USDT es <strong>irreversible</strong> y que el acceso al producto se entrega una vez que el admin confirme la transacción.</span>
            </div>

            {/* Submit */}
            {!user ? (
              <button className="co-submit" onClick={onShowAuth}>🔐 Iniciá sesión para continuar</button>
            ) : (
              <button className="co-submit" disabled={!agreed || submitting} onClick={handleSubmit}>
                {submitting ? "Procesando..." : "✓ Confirmar pago →"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MINI CART POPUP ──────────────────────────────────────────────────────────
const MiniCart = ({ cart, lastAdded, onClose, onOpenCart, onMouseEnter, onMouseLeave }) => {
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  return (
    <div className="mini-cart-popup" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <div className="mini-cart-head">
        <div className="mini-cart-head-title">
          🛒 Carrito <span className="mini-cart-head-count">{totalItems}</span>
        </div>
        <button className="mini-cart-close" onClick={onClose}>✕</button>
      </div>
      {lastAdded && (
        <div className="mini-cart-added">
          ✅ <span><strong>{lastAdded.name.split("·")[0].trim()}</strong> agregado al carrito</span>
        </div>
      )}
      <div className="mini-cart-items">
        {cart.map(item => (
          <div key={item.id} className="mini-cart-item">
            <div className="mini-cart-item-icon">👜</div>
            <div className="mini-cart-item-info">
              <div className="mini-cart-item-name">{item.name}</div>
              <div className="mini-cart-item-sub">Cantidad: {item.qty}</div>
            </div>
            <div className="mini-cart-item-price">{fmtUSDT(item.price * item.qty)}</div>
          </div>
        ))}
      </div>
      <div className="mini-cart-footer">
        <div className="mini-cart-total">
          <span className="mini-cart-total-label">Total</span>
          <span className="mini-cart-total-value">{fmtUSDT(total)}</span>
        </div>
        <button className="mini-cart-btn" onClick={() => { onOpenCart(); onClose(); }}>
          Ir al carrito →
        </button>
      </div>
    </div>
  );
};

// ─── CART DRAWER ─────────────────────────────────────────────────────────────
const CartDrawer = ({ cart, onClose, onQty, onRemove, onCheckout }) => {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [couponState, setCouponState] = useState("idle");

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = appliedCoupon ? subtotal * (appliedCoupon.discount / 100) : 0;
  const total = subtotal - discountAmt;

  const applyCoupon = async () => {
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCouponState("invalid");
        setCouponError(data.error || "Cupón inválido.");
        setTimeout(() => setCouponState("idle"), 600);
        return;
      }
      setAppliedCoupon(data);
      setCouponState("valid");
      setCouponInput("");
    } catch {
      setCouponState("invalid");
      setCouponError("Error de conexión.");
      setTimeout(() => setCouponState("idle"), 600);
    }
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
                {item.basePrice && item.price < item.basePrice ? (
                  <>
                    <div className="cart-item-price" style={{ opacity: 0.45, textDecoration: "line-through", fontSize: 12 }}>
                      {fmtUSDT(item.basePrice)} × {item.qty} = {fmtUSDT(item.basePrice * item.qty)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <span style={{ fontSize: 10, fontWeight: 800, background: "var(--green)", color: "#fff", borderRadius: 5, padding: "1px 6px" }}>
                        -{Math.round((1 - item.price / item.basePrice) * 100)}%
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
                        Precio con descuento: {fmtUSDT(item.price * item.qty)}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 1 }}>
                      {fmtUSDT(item.price)} c/u · ahorrás {fmtUSDT((item.basePrice - item.price) * item.qty)}
                    </div>
                  </>
                ) : (
                  <div className="cart-item-price">
                    {fmtUSDT(item.price)} × {item.qty} = <strong style={{ color: "var(--usdt)" }}>{fmtUSDT(item.price * item.qty)}</strong>
                  </div>
                )}
                {(() => {
                  const totalSamePrice = cart.reduce((s, i) => (i.basePrice ?? i.price) === (item.basePrice ?? item.price) ? s + i.qty : s, 0);
                  const nt = getNextTier(item.tiers, totalSamePrice);
                  return nt ? (
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      ↗ {nt.qty - totalSamePrice} unidad{nt.qty - totalSamePrice !== 1 ? "es" : ""} más al mismo precio → {fmtUSDT(nt.price)} c/u
                    </div>
                  ) : null;
                })()}
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
                    <input className={`coupon-input ${couponState === "valid" ? "valid" : couponState === "invalid" ? "invalid" : ""}`} placeholder="Ingresá tu código" value={couponInput} onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(""); setCouponState("idle"); }} onKeyDown={e => e.key === "Enter" && applyCoupon()} />
                    <button className="apply-btn" onClick={applyCoupon} disabled={!couponInput.trim()}>Aplicar</button>
                  </div>
                  {couponError && <div className="coupon-error">⚠ {couponError}</div>}
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

// ─── REVIEWS SECTION ──────────────────────────────────────────────────────────
const ReviewsSection = ({ productId, user }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myRating, setMyRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${productId}/reviews`)
      .then(r => r.json())
      .then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [productId]);

  const LABELS = ["", "Muy malo", "Malo", "Regular", "Bueno", "Excelente"];

  const submit = async () => {
    if (!myRating) { setError("Seleccioná una puntuación"); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/products/${productId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: myRating, comment: myComment.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [data.review, ...prev]);
        setSuccess(true); setMyRating(0); setMyComment("");
      } else { setError(data.error || "Error al enviar"); }
    } catch { setError("Error de conexión"); }
    setSubmitting(false);
  };

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  const fmt = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${String(date.getFullYear()).slice(2)}`;
  };

  return (
    <div className="pd-reviews-section">
      <div className="pd-section-label">Opiniones{reviews.length > 0 ? ` (${reviews.length})` : ""}</div>

      {reviews.length > 0 && (
        <div className="pd-reviews-summary">
          <span className="pd-reviews-avg">{avg}</span>
          <Stars rating={parseFloat(avg)} reviews={reviews.length} />
        </div>
      )}

      {loading && <div style={{ color: "var(--muted)", fontSize: 13 }}>Cargando...</div>}

      {reviews.map(r => (
        <div key={r.id} className="pd-review-item">
          <div className="pd-review-header">
            <span className="pd-review-name">{r.userName}</span>
            <Stars rating={r.rating} reviews={null} />
            <span className="pd-review-date">{fmt(r.createdAt)}</span>
          </div>
          {r.comment && <div className="pd-review-comment">{r.comment}</div>}
        </div>
      ))}

      {!loading && reviews.length === 0 && (
        <div style={{ color: "var(--muted)", fontSize: 13, padding: "8px 0 12px" }}>Sin opiniones todavía. ¡Sé el primero!</div>
      )}

      {user ? (
        success ? (
          <div style={{ color: "var(--green)", fontWeight: 700, fontSize: 13, padding: "12px 0" }}>✓ ¡Gracias por tu opinión!</div>
        ) : (
          <div className="pd-review-form">
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Dejar una opinión</div>
            <div className="pd-star-picker">
              {[1,2,3,4,5].map(s => (
                <span
                  key={s}
                  className={`pd-star-pick${s <= (hoverRating || myRating) ? " active" : ""}`}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setMyRating(s)}
                >★</span>
              ))}
              {(hoverRating || myRating) > 0 && (
                <span style={{ fontSize: 12, color: "var(--muted)", marginLeft: 6 }}>{LABELS[hoverRating || myRating]}</span>
              )}
            </div>
            <textarea
              className="form-input"
              style={{ resize: "vertical", minHeight: 72, fontSize: 13 }}
              placeholder="Contá tu experiencia (opcional)..."
              value={myComment}
              onChange={e => setMyComment(e.target.value)}
              maxLength={500}
            />
            {error && <div style={{ color: "var(--red)", fontSize: 12 }}>{error}</div>}
            <button
              className="btn btn-primary btn-sm"
              onClick={submit}
              disabled={submitting || !myRating}
              style={{ alignSelf: "flex-start" }}
            >
              {submitting ? "Enviando..." : "✓ Enviar opinión"}
            </button>
          </div>
        )
      ) : (
        <div style={{ marginTop: 10, fontSize: 12, color: "var(--muted)", padding: "10px 14px", background: "var(--bg)", borderRadius: 9, border: "1.5px solid var(--border)" }}>
          <span style={{ fontWeight: 600 }}>Iniciá sesión</span> para dejar una opinión
        </div>
      )}
    </div>
  );
};

// ─── PRODUCT DETAIL PAGE ──────────────────────────────────────────────────────
const ProductDetailPage = ({ product: p, cart, onBack, onAddToCartQty, onBuyNowQty, liked, onToggleLike, user }) => {
  const [qty, setLocalQty] = useState(1);
  const cartItem = cart.find(i => i.id === p.id);
  const cartQty = cartItem?.qty || 0;

  const parseAttributes = (details) => {
    if (!details) return [];
    return details.split('\n').map(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0) return { key: line.slice(0, colonIdx).trim(), val: line.slice(colonIdx + 1).trim() };
      return null;
    }).filter(Boolean);
  };

  const attrs = parseAttributes(p.details);
  const hasTiers = Array.isArray(p.tiers) && p.tiers.length > 0;
  const sortedTiers = hasTiers ? [...p.tiers].filter(t => t.qty > 0 && t.price > 0).sort((a, b) => a.qty - b.qty) : [];
  const effectivePrice = getTierPrice(p.price, p.tiers, qty);
  const hasDiscount = effectivePrice < p.price;
  const discPct = hasDiscount ? Math.round((1 - effectivePrice / p.price) * 100) : 0;
  const nextTier = getNextTier(p.tiers || [], qty);

  return (
    <div className="product-detail-page">
      <div className="pd-breadcrumb">
        <span onClick={onBack}>← Tienda</span>
        <span style={{ color: "var(--muted)", fontWeight: 400 }}>/</span>
        <span style={{ color: "var(--text)", fontWeight: 500 }}>{p.name}</span>
      </div>

      <div className="pd-grid">
        {/* IMAGE */}
        <div className="pd-img-col">
          <div className="pd-thumb-large">
            <span className="pd-thumb-large-icon">👜</span>
            <span className="pd-thumb-label">Facebook</span>
          </div>
          {p.sales > 50 && (
            <div style={{ marginTop: 10, textAlign: "center", background: "var(--green-light)", border: "1.5px solid var(--green-border)", borderRadius: 10, padding: "7px 12px", fontSize: 12, fontWeight: 700, color: "var(--green)" }}>
              ✓ +{p.sales} vendidos
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="pd-info-col">
          <h1 className="pd-title">{p.name}</h1>
          <div className="pd-meta-row">
            {p.rating > 0 && <Stars rating={p.rating} reviews={p.reviews} />}
            <span className="chip chip-stock">📦 Stock: <strong>{p.stock}</strong></span>
            {p.sales > 0 && <span className="chip chip-sales">🏷 Ventas: <strong>{p.sales}</strong></span>}
          </div>

          {attrs.length > 0 ? (
            <>
              <div className="pd-section-label">Características</div>
              <div className="pd-attrs">
                {attrs.map((a, i) => (
                  <div key={i} className="pd-attr-row">
                    <div className="pd-attr-key">{a.key}</div>
                    <div className="pd-attr-val">{a.val}</div>
                  </div>
                ))}
              </div>
            </>
          ) : p.details ? (
            <>
              <div className="pd-section-label">Descripción</div>
              <div className="pd-desc-section"><div className="pd-desc">{p.details}</div></div>
            </>
          ) : null}

          {hasTiers && (
            <>
              <div className="pd-section-label">Descuentos por cantidad</div>
              <div className="pd-tier-table">
                <div className="pd-tier-head">
                  <span>Cantidad</span>
                  <span>Precio unitario</span>
                  <span>Descuento</span>
                </div>
                <div className="pd-tier-row">
                  <span className="pd-tier-qty">1+</span>
                  <span className="pd-tier-price" style={{ color: "var(--text)" }}>{fmtUSDT(p.price)}</span>
                  <span className="pd-tier-disc" style={{ color: "var(--muted)" }}>Precio base</span>
                </div>
                {sortedTiers.map((t, i) => {
                  const disc = Math.round((1 - t.price / p.price) * 100);
                  const isActive = qty >= t.qty;
                  return (
                    <div key={i} className={`pd-tier-row${isActive ? " active-tier" : ""}`}>
                      <span className="pd-tier-qty">x{t.qty}+</span>
                      <span className="pd-tier-price">{fmtUSDT(t.price)}</span>
                      <span className="pd-tier-disc">-{disc}%{isActive ? " ✓" : ""}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          <div className="pd-warranty">
            <span className="pd-warranty-icon">🛡️</span>
            <div className="pd-warranty-text">
              <div className="pd-warranty-title">Garantía y soporte</div>
              Soporte post-venta incluido. Si la cuenta presenta inconvenientes dentro de las primeras 24hs, nos comunicamos para resolverlo. Pago 100% seguro vía USDT.
            </div>
          </div>

          <ReviewsSection productId={p.id} user={user} />
        </div>

        {/* PRICE PANEL */}
        <div className="pd-price-panel">
          {hasDiscount ? (
            <>
              <div className="pd-panel-base">{fmtUSDT(p.price)} c/u</div>
              <div className="pd-panel-price">{fmtUSDT(effectivePrice)}</div>
              <div className="pd-panel-disc">🏷 -{discPct}% aplicado</div>
            </>
          ) : (
            <div className="pd-panel-price">{fmtUSDT(p.price)}</div>
          )}

          <div className="pd-panel-stock">
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.stock > 0 ? "var(--green)" : "var(--red)", display: "inline-block", flexShrink: 0 }} />
            {p.stock > 0 ? `${p.stock} unidades disponibles` : "Sin stock"}
          </div>

          <div className="pd-qty-row">
            <span className="pd-qty-label">Cantidad</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setLocalQty(q => Math.max(1, q - 1))}>−</button>
              <span className="qty-num">{qty}</span>
              <button className="qty-btn" onClick={() => setLocalQty(q => Math.min(p.stock || 99, q + 1))}>+</button>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, padding: "10px 12px", background: "var(--bg)", borderRadius: 9, border: "1.5px solid var(--border)" }}>
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>Total ({qty} ud.)</span>
            <span style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: "var(--usdt)" }}>{fmtUSDT(effectivePrice * qty)}</span>
          </div>

          <button className="pd-buy-btn" disabled={p.stock === 0} onClick={() => onBuyNowQty(p, qty)}>
            ⚡ Comprar ahora
          </button>
          <button className="pd-cart-btn" disabled={p.stock === 0} onClick={() => onAddToCartQty(p, qty)}>
            🛒 Agregar al carrito
          </button>

          {nextTier && (
            <div className="pd-next-tier">
              💡 Comprá {nextTier.qty - qty} más y obtenés <strong>{fmtUSDT(nextTier.price)}</strong> c/u (−{Math.round((1 - nextTier.price / p.price) * 100)}%)
            </div>
          )}

          <button
            style={{ width: "100%", marginTop: 10, background: "none", border: "1.5px solid var(--border)", borderRadius: 11, padding: "9px", fontSize: 13, fontWeight: 600, color: liked[p.id] ? "var(--red)" : "var(--muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onToggleLike(p.id)}
          >
            {liked[p.id] ? "❤️ En favoritos" : "🤍 Guardar en favoritos"}
          </button>

          <div style={{ marginTop: 14, fontSize: 11, color: "var(--muted)", textAlign: "center", lineHeight: 1.5 }}>
            🔒 Pago seguro · 100% USDT · Entrega inmediata
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── SHOP PAGE ────────────────────────────────────────────────────────────────
const ShopPage = ({ cart, onAddToCart, onBuyNow, onCartOpen, liked, onToggleLike, products, onProductClick }) => {
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
          <span className="hero-badge">🏷 Descuentos por cantidad</span>
        </div>
      </div>
      <div className="shop-wrap">
        <div className="shop-header">
          <div className="shop-title">Productos disponibles</div>
          <div className="shop-count">{products.length} productos</div>
        </div>
        <div className="product-list">
          {products.length === 0 && (
            <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--muted)" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🛍</div>
              <div style={{ fontWeight: 600 }}>Cargando productos...</div>
            </div>
          )}
          {[...products].sort((a, b) => {
              const effA = a.badgeDiscount > 0 ? a.price * (1 - a.badgeDiscount / 100) : a.price;
              const effB = b.badgeDiscount > 0 ? b.price * (1 - b.badgeDiscount / 100) : b.price;
              return effA - effB;
            }).map(p => {
            const qty = getQty(p.id);
            return (
              <div key={p.id} className="product-row" onClick={() => onProductClick && onProductClick(p)}>
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
                  {p.badgeDiscount > 0 ? (() => {
                    const discountedPrice = p.price * (1 - p.badgeDiscount / 100);
                    return (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, background: "var(--red)", color: "#fff", borderRadius: 6, padding: "2px 8px" }}>-{p.badgeDiscount}%</span>
                          <span style={{ fontSize: 12, color: "var(--muted)", textDecoration: "line-through" }}>{fmtUSDT(p.price)}</span>
                        </div>
                        <div className="prod-price" style={{ marginTop: 0 }}>{fmtUSDT(discountedPrice)}</div>
                      </div>
                    );
                  })() : <div className="prod-price">{fmtUSDT(p.price)}</div>}
                  <div className="prod-actions">
                    {p.stock === 0
                      ? <button className="buy-btn" disabled>Sin stock</button>
                      : <button className="buy-btn" onClick={e => { e.stopPropagation(); onBuyNow(p); }}>Buy now</button>
                    }
                    <button className="icon-btn" title="Agregar al carrito" onClick={e => { e.stopPropagation(); if (p.stock > 0) onAddToCart(p); }}>🛒</button>
                    <button className={`icon-btn ${liked[p.id] ? "liked" : ""}`} onClick={e => { e.stopPropagation(); onToggleLike(p.id); }}>{liked[p.id] ? "❤️" : "🤍"}</button>
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
const UserAccount = ({ user, userOrders, liked, onToggleLike, onGoShop, products }) => {
  const [tab, setTab] = useState("orders");
  const myOrders = userOrders; // la API ya filtra por usuario
  const favProducts = products.filter(p => liked[p.id]);
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
                        <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-AR") : "—"}</td>
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

// ─── ADMIN REVIEW PANEL ───────────────────────────────────────────────────────
const AdminReviewPanel = ({ product, onClose, onRatingChange }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", rating: "5", comment: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${product.id}/reviews`)
      .then(r => r.json())
      .then(data => { setReviews(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [product.id]);

  const addReview = async () => {
    if (!form.name.trim() || !form.rating) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/products/${product.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: parseInt(form.rating), comment: form.comment.trim() || null, adminName: form.name.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => [data.review, ...prev]);
        setForm({ name: "", rating: "5", comment: "" });
        if (onRatingChange) onRatingChange();
      }
    } catch {}
    setSaving(false);
  };

  const deleteReview = async (id) => {
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) {
      setReviews(prev => prev.filter(r => r.id !== id));
      if (onRatingChange) onRatingChange();
    }
  };

  const fmt = (d) => {
    const date = new Date(d);
    return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
  };

  return (
    <div className="card" style={{ marginBottom: 16, border: "2px solid var(--blue)", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>📝 Reviews — <span style={{ color: "var(--muted)", fontWeight: 400 }}>{product.name.slice(0, 50)}</span></div>
        <button onClick={onClose} style={{ padding: "3px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 12, cursor: "pointer", fontWeight: 700 }}>✕ Cerrar</button>
      </div>

      {/* Add review form */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 8, marginBottom: 14, alignItems: "end" }}>
        <div>
          <label className="form-label" style={{ fontSize: 11 }}>Nombre mostrado</label>
          <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="q***t" style={{ fontSize: 12 }} />
        </div>
        <div>
          <label className="form-label" style={{ fontSize: 11 }}>Puntuación</label>
          <select className="form-input" value={form.rating} onChange={e => setForm(f => ({...f, rating: e.target.value}))} style={{ fontSize: 12 }}>
            <option value="5">⭐⭐⭐⭐⭐ 5</option>
            <option value="4">⭐⭐⭐⭐ 4</option>
            <option value="3">⭐⭐⭐ 3</option>
            <option value="2">⭐⭐ 2</option>
            <option value="1">⭐ 1</option>
          </select>
        </div>
        <div>
          <label className="form-label" style={{ fontSize: 11 }}>Comentario (opcional)</label>
          <input className="form-input" value={form.comment} onChange={e => setForm(f => ({...f, comment: e.target.value}))} placeholder="Great product!" style={{ fontSize: 12 }} />
        </div>
      </div>
      <button onClick={addReview} disabled={saving || !form.name.trim()} className="btn btn-primary btn-sm" style={{ marginBottom: 16 }}>
        {saving ? "Guardando..." : "+ Agregar review"}
      </button>

      {/* Reviews list */}
      {loading && <div style={{ color: "var(--muted)", fontSize: 12 }}>Cargando...</div>}
      {!loading && reviews.length === 0 && <div style={{ color: "var(--muted)", fontSize: 12 }}>Sin reviews aún.</div>}
      {reviews.map(r => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 0", borderTop: "1px solid var(--border)" }}>
          <span style={{ fontWeight: 700, fontSize: 12, minWidth: 80 }}>{r.userName}</span>
          <Stars rating={r.rating} reviews={null} />
          <span style={{ fontSize: 11, color: "var(--muted)", flex: 1 }}>{r.comment || "—"}</span>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>{fmt(r.createdAt)}</span>
          <button onClick={() => deleteReview(r.id)} style={{ padding: "2px 8px", borderRadius: 6, border: "1.5px solid var(--border)", background: "var(--red-light)", color: "var(--red)", fontSize: 11, cursor: "pointer" }}>🗑</button>
        </div>
      ))}
    </div>
  );
};

// ─── ADMIN PRODUCT MANAGER ────────────────────────────────────────────────────
const ProductManager = ({ products, setProducts }) => {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: "", details: "", price: "", cost: "", stock: "", tiers: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewProductId, setReviewProductId] = useState(null);
  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", details: "", price: "", cost: "", stock: "", tiers: [] });
    setError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, details: p.details || "", price: p.price, cost: p.cost || "", stock: p.stock, tiers: Array.isArray(p.tiers) ? p.tiers.map(t => ({ qty: t.qty, price: t.price })) : [] });
    setError("");
    setShowForm(true);
  };

  const addTier    = () => setForm(p => ({ ...p, tiers: [...p.tiers, { qty: "", price: "" }] }));
  const removeTier = (i) => setForm(p => ({ ...p, tiers: p.tiers.filter((_, idx) => idx !== i) }));
  const setTierField = (i, field, val) => setForm(p => ({ ...p, tiers: p.tiers.map((t, idx) => idx === i ? { ...t, [field]: val } : t) }));

  const save = async () => {
    if (!form.name.trim() || !form.price) { setError("Nombre y precio son obligatorios."); return; }
    setSaving(true); setError("");
    try {
      let res, data;
      const cleanTiers = form.tiers
        .filter(t => t.qty !== "" && t.price !== "")
        .map(t => ({ qty: parseInt(t.qty), price: parseFloat(t.price) }))
        .filter(t => t.qty > 0 && t.price > 0)
        .sort((a, b) => a.qty - b.qty);
      const body = { name: form.name, details: form.details, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0, tiers: cleanTiers, stock: parseInt(form.stock) || 0 };
      if (editProduct) {
        res = await fetch(`/api/products/${editProduct.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      } else {
        res = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      }
      data = await res.json();
      if (!res.ok) { setError(data.error || "Error al guardar."); return; }
      if (editProduct) {
        setProducts(prev => prev.map(p => p.id === editProduct.id ? data : p));
      } else {
        setProducts(prev => [data, ...prev]);
      }
      setShowForm(false);
      setEditProduct(null);
    } catch { setError("Error de conexión."); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id) => {
    if (!confirm("¿Borrar este producto? Esta acción no se puede deshacer.")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) setProducts(prev => prev.filter(p => p.id !== id));
    } catch {}
  };

  const toggleActive = async (p) => {
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !p.isActive }) });
      const data = await res.json();
      if (res.ok) setProducts(prev => prev.map(x => x.id === p.id ? data : x));
    } catch {}
  };

  const toggleStock = async (p) => {
    const newStock = p.stock === 0 ? 1 : 0;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stock: newStock }) });
      const data = await res.json();
      if (res.ok) setProducts(prev => prev.map(x => x.id === p.id ? data : x));
    } catch {}
  };

  const saveBadgeDiscount = async (p, value) => {
    const num = Math.min(99, Math.max(0, parseFloat(value) || 0));
    if (num === (p.badgeDiscount || 0)) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ badgeDiscount: num }) });
      const data = await res.json();
      if (res.ok) setProducts(prev => prev.map(x => x.id === p.id ? data : x));
    } catch {}
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div className="page-title" style={{ margin: 0 }}>🛍 Productos</div>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Agregar producto</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, border: "2px solid var(--red-dark)" }}>
          <div className="card-title">{editProduct ? "✏️ Editar producto" : "✨ Nuevo producto"}</div>
          {error && <div className="error-msg">{error}</div>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Nombre *</label>
              <input className="form-input" value={form.name} onChange={setF("name")} placeholder="Ej: Business Manager Facebook · Verified · Europe" />
            </div>
            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label className="form-label">Descripción / Detalles</label>
              <input className="form-input" value={form.details} onChange={setF("details")} placeholder="Ej: BM Limit $250 · GEO Europe/USA · Verified 2024" />
            </div>
            <div className="form-group">
              <label className="form-label">Precio de venta USDT *</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.price} onChange={setF("price")} placeholder="33.00" />
            </div>
            <div className="form-group">
              <label className="form-label">Costo real USDT</label>
              <input className="form-input" type="number" step="0.01" min="0" value={form.cost} onChange={setF("cost")} placeholder="15.00" />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Se usa para calcular beneficio y ROAS en el Overview</div>
            </div>
            <div className="form-group">
              <label className="form-label">Stock (unidades)</label>
              <input className="form-input" type="number" min="0" value={form.stock} onChange={setF("stock")} placeholder="1" />
            </div>
          </div>

          {/* ── Descuentos por cantidad ── */}
          <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <label className="form-label" style={{ margin: 0 }}>📦 Descuentos por cantidad</label>
              <button type="button" className="btn btn-outline btn-sm" onClick={addTier}>+ Agregar escalonado</button>
            </div>
            {form.tiers.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--muted)", padding: "8px 0" }}>Sin descuentos por cantidad. Hacé clic en "+ Agregar escalonado" para configurar.</div>
            )}
            {form.tiers.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" }}>A partir de</span>
                <input
                  className="form-input"
                  type="number" min="1" step="1"
                  style={{ width: 80 }}
                  placeholder="Cant."
                  value={t.qty}
                  onChange={e => setTierField(i, "qty", e.target.value)}
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>unidades →</span>
                <input
                  className="form-input"
                  type="number" min="0" step="0.01"
                  style={{ width: 100 }}
                  placeholder="Precio USDT"
                  value={t.price}
                  onChange={e => setTierField(i, "price", e.target.value)}
                />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>USDT c/u</span>
                <button type="button" onClick={() => removeTier(i)} style={{ background: "none", border: "none", color: "var(--red)", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
              </div>
            ))}
            {form.tiers.length > 0 && (
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>
                El precio baja automáticamente en el carrito cuando el cliente lleva la cantidad indicada.
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? "Guardando..." : editProduct ? "💾 Guardar cambios" : "✅ Crear producto"}</button>
            <button className="btn btn-outline" onClick={() => { setShowForm(false); setEditProduct(null); }}>Cancelar</button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">Todos los productos ({products.length})</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nombre</th><th>Detalles</th><th>Venta</th><th>Costo</th><th>Margen</th><th>Stock</th><th>Ventas</th><th>Badge %</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {products.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)" }}>No hay productos. Crea el primero.</td></tr>
              )}
              {products.map(p => {
                const margin = p.cost > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : null;
                return (
                <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.5 }}>
                  <td style={{ maxWidth: 200, fontSize: 12, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ maxWidth: 180, fontSize: 11, color: "var(--muted)" }}>{p.details || "—"}</td>
                  <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(p.price)}</strong></td>
                  <td style={{ fontSize: 12, color: p.cost > 0 ? "var(--red)" : "var(--muted)" }}>{p.cost > 0 ? fmtUSDT(p.cost) : "—"}</td>
                  <td>
                    {margin !== null
                      ? <span className="chip" style={{ background: parseInt(margin) >= 30 ? "var(--green-light)" : "var(--amber-light)", color: parseInt(margin) >= 30 ? "var(--green)" : "var(--amber)", border: `1px solid ${parseInt(margin) >= 30 ? "var(--green-border)" : "var(--amber-border)"}` }}>{margin}%</span>
                      : <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
                    }
                  </td>
                  <td>
                    <span className="chip" style={{ background: p.stock > 0 ? "#F0FDF4" : "var(--red-light)", color: p.stock > 0 ? "#15803D" : "var(--red)", border: `1px solid ${p.stock > 0 ? "#BBF7D0" : "var(--red)"}` }}>
                      {p.stock} pcs.
                    </span>
                  </td>
                  <td><span className="chip chip-sales">{p.sales}</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        key={p.id + "-badge"}
                        type="number"
                        min="0"
                        max="99"
                        step="1"
                        defaultValue={p.badgeDiscount || 0}
                        onBlur={e => saveBadgeDiscount(p, e.target.value)}
                        onKeyDown={e => e.key === "Enter" && e.target.blur()}
                        style={{ width: 52, padding: "4px 6px", borderRadius: 7, border: "1.5px solid var(--border)", fontSize: 12, textAlign: "center", background: "var(--bg)", color: "var(--text)" }}
                        title="Escribe el % del badge (0 = sin badge)"
                      />
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>%</span>
                      {(p.badgeDiscount || 0) > 0 && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: "var(--red)", color: "#fff", borderRadius: 5, padding: "1px 5px" }}>-{p.badgeDiscount}%</span>
                      )}
                    </div>
                  </td>
                  <td>{p.isActive ? <span className="badge-active">✓ ACTIVO</span> : <span className="badge-used">⏸ OCULTO</span>}</td>
                  <td>
                    <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                      <button onClick={() => openEdit(p)} style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--blue-light)", color: "var(--blue)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>✏️ Editar</button>
                      <button onClick={() => toggleStock(p)} style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: p.stock === 0 ? "var(--green-light)" : "#F1F5F9", color: p.stock === 0 ? "var(--green)" : "#64748B", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{p.stock === 0 ? "📦 Con Stock" : "📦 Sin Stock"}</button>
                      <button onClick={() => toggleActive(p)} style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: p.isActive ? "var(--amber-light)" : "var(--green-light)", color: p.isActive ? "var(--amber)" : "var(--green)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{p.isActive ? "⏸ Ocultar" : "▶ Mostrar"}</button>
                      <button onClick={() => setReviewProductId(prev => prev === p.id ? null : p.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: reviewProductId === p.id ? "var(--amber-light)" : "var(--bg)", color: reviewProductId === p.id ? "var(--amber)" : "var(--muted)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>📝 Reviews{p.reviews > 0 ? ` (${p.reviews})` : ""}</button>
                      <button onClick={() => deleteProduct(p.id)} style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--red-light)", color: "var(--red)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>🗑 Borrar</button>
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {reviewProductId && (() => {
        const rp = products.find(x => x.id === reviewProductId);
        return rp ? (
          <AdminReviewPanel
            product={rp}
            onClose={() => setReviewProductId(null)}
            onRatingChange={() => fetch("/api/products?all=true").then(r => r.json()).then(data => setProducts(Array.isArray(data) ? data : []))}
          />
        ) : null;
      })()}
    </div>
  );
};

// ─── ADMIN COUPON MANAGER ─────────────────────────────────────────────────────
const CouponManager = ({ coupons, setCoupons }) => {
  const PRESET = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];
  const [sel, setSel] = useState(null);
  const [custom, setCustom] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [generated, setGenerated] = useState(null);
  const [copied, setCopied] = useState(false);
  const pct = sel !== null ? sel : parseInt(custom) || null;

  const generate = async () => {
    if (!pct || pct < 1 || pct > 99) return;
    const code = genCode(pct);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, discount: pct, maxUses }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Error al crear cupón"); return; }
      setCoupons(prev => [data, ...prev]);
      setGenerated(data);
      setCopied(false);
    } catch { alert("Error de conexión"); }
  };

  const toggleActive = async (code) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: "PATCH" });
      const data = await res.json();
      if (res.ok) setCoupons(prev => prev.map(c => c.code === code ? data : c));
    } catch {}
  };

  const deleteCoupon = async (code) => {
    try {
      const res = await fetch(`/api/coupons/${code}`, { method: "DELETE" });
      if (res.ok) setCoupons(prev => prev.filter(c => c.code !== code));
    } catch {}
  };

  const getStatus = (c) => {
    if (!c.active) return <span className="badge-used">⏸ PAUSADO</span>;
    if (c.uses >= c.maxUses) return <span className="badge-used">⛔ AGOTADO</span>;
    return <span className="badge-active">✓ ACTIVO</span>;
  };

  return (
    <div>
      <div className="page-title">🏷 Gestión de Cupones</div>
      <div className="coupon-creator">
        <div className="coupon-creator-title">✨ Crear nuevo cupón</div>
        <div className="coupon-creator-sub">Generá un cupón con descuento y límite de usos</div>
        <div className="form-label" style={{ color: "#6D28D9", marginBottom: 8 }}>Porcentaje de descuento:</div>
        <div className="percent-grid">
          {PRESET.map(p => <button key={p} className={`percent-btn ${sel === p ? "active" : ""}`} onClick={() => { setSel(p); setCustom(""); }}>{p}%</button>)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: "#6D28D9", fontWeight: 600 }}>Personalizado:</span>
          <input className="custom-percent" type="number" min="1" max="99" placeholder="35" value={custom} onChange={e => { setCustom(e.target.value); setSel(null); }} />
          <span style={{ fontSize: 14, color: "#6D28D9", fontWeight: 700 }}>%</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 13, color: "#6D28D9", fontWeight: 600 }}>Usos permitidos:</span>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => setMaxUses(n)} style={{ width: 34, height: 34, borderRadius: 8, border: `1.5px solid ${maxUses === n ? "var(--purple)" : "#C4B5FD"}`, background: maxUses === n ? "var(--purple)" : "#fff", color: maxUses === n ? "#fff" : "var(--purple)", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>{n}</button>
            ))}
          </div>
        </div>
        <button className="btn btn-purple" onClick={generate} style={{ opacity: (!pct || pct < 1 || pct > 99) ? 0.5 : 1 }}>⚡ Generar cupón</button>
        {generated && (
          <div className="coupon-result">
            <div>
              <div className="coupon-result-code">{generated.code}</div>
              <div className="coupon-result-meta">{generated.discount}% off · {generated.maxUses} uso{generated.maxUses > 1 ? "s" : ""} · {generated.createdAt}</div>
            </div>
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
            <thead><tr><th>Código</th><th>Descuento</th><th>Usos</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr></thead>
            <tbody>
              {coupons.map((c, i) => (
                <tr key={i}>
                  <td><code style={{ fontFamily: "monospace", fontWeight: 800, letterSpacing: "1px", color: !c.active || c.uses >= c.maxUses ? "var(--muted)" : "var(--purple)" }}>{c.code}</code></td>
                  <td><span className="badge badge-purple">{c.discount}% OFF</span></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 60, height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min((c.uses / c.maxUses) * 100, 100)}%`, height: "100%", background: c.uses >= c.maxUses ? "var(--red)" : "var(--green)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{c.uses}/{c.maxUses}</span>
                    </div>
                  </td>
                  <td>{getStatus(c)}</td>
                  <td style={{ color: "var(--muted)", fontSize: 12 }}>{c.createdAt}</td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => toggleActive(c.code)}
                        style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: c.active ? "var(--amber-light)" : "var(--green-light)", color: c.active ? "var(--amber)" : "var(--green)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        {c.active ? "⏸ Pausar" : "▶ Activar"}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c.code)}
                        style={{ padding: "4px 10px", borderRadius: 7, border: "1.5px solid var(--border)", background: "var(--red-light)", color: "var(--red)", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >
                        🗑 Borrar
                      </button>
                    </div>
                  </td>
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
                <tr key={o.id} style={{ background: o.status === "pending" ? "var(--amber-light)" : "transparent" }}>
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

// ─── ADMIN OVERVIEW ───────────────────────────────────────────────────────────
const QUICK_RANGES = [
  { id: "today",     label: "Hoy" },
  { id: "yesterday", label: "Ayer" },
  { id: "15d",       label: "15 días" },
  { id: "30d",       label: "30 días" },
  { id: "month",     label: "Este mes" },
  { id: "3m",        label: "3 meses" },
  { id: "6m",        label: "6 meses" },
  { id: "year",      label: "Este año" },
  { id: "all",       label: "Todo" },
];

const fmtDateInput = (d) => d.toISOString().split("T")[0]; // YYYY-MM-DD
const fmtDateLabel = (s) => new Date(s + "T00:00:00").toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });

const AdminOverview = ({ orders, products, onGoOrders }) => {
  const [range, setRange]         = useState("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Initialize custom dates to current month when opening picker
  const openCustom = () => {
    const now = new Date();
    if (!customFrom) setCustomFrom(fmtDateInput(new Date(now.getFullYear(), now.getMonth(), 1)));
    if (!customTo)   setCustomTo(fmtDateInput(now));
    setShowPicker(true);
    setRange("custom");
  };

  const applyCustom = () => setShowPicker(false);

  const filterByRange = (arr) => {
    const now = new Date();
    const sod = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysAgo = (n) => { const s = new Date(sod); s.setDate(s.getDate() - n); return s; };
    switch (range) {
      case "today":     return arr.filter(o => new Date(o.createdAt) >= sod);
      case "yesterday": {
        const s = daysAgo(1);
        return arr.filter(o => { const d = new Date(o.createdAt); return d >= s && d < sod; });
      }
      case "15d":  return arr.filter(o => new Date(o.createdAt) >= daysAgo(15));
      case "30d":  return arr.filter(o => new Date(o.createdAt) >= daysAgo(30));
      case "month": return arr.filter(o => new Date(o.createdAt) >= new Date(now.getFullYear(), now.getMonth(), 1));
      case "3m":   return arr.filter(o => new Date(o.createdAt) >= daysAgo(90));
      case "6m":   return arr.filter(o => new Date(o.createdAt) >= daysAgo(180));
      case "year": return arr.filter(o => new Date(o.createdAt) >= new Date(now.getFullYear(), 0, 1));
      case "custom": {
        const s = customFrom ? new Date(customFrom + "T00:00:00") : new Date(0);
        const e = customTo   ? new Date(customTo   + "T23:59:59") : new Date();
        return arr.filter(o => { const d = new Date(o.createdAt); return d >= s && d <= e; });
      }
      default: return arr;
    }
  };

  const filtered   = filterByRange(orders);
  const paid       = filtered.filter(o => o.status === "paid");
  const pending    = filtered.filter(o => o.status === "pending");
  const revenue    = paid.reduce((s, o) => s + o.total, 0);
  const pendingRev = pending.reduce((s, o) => s + o.total, 0);

  // Use item.cost stored at purchase time (reliable), fallback to costMap by name for legacy orders
  const costMap = {};
  products.forEach(p => { if (p.cost > 0) costMap[p.name] = p.cost; });
  const hasCosts = paid.some(o => (o.items || []).some(item => (item.cost || 0) > 0)) || Object.keys(costMap).length > 0;

  const calcOrderCost = (o) => (o.items || []).reduce((s, item) => {
    const c = (item.cost || 0) > 0 ? item.cost : (costMap[item.name] || 0);
    return s + c * item.qty;
  }, 0);
  const totalCost = paid.reduce((s, o) => s + calcOrderCost(o), 0);
  const profit    = revenue - totalCost;
  const roas      = totalCost > 0 ? (revenue / totalCost).toFixed(2) : null;
  const margin    = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";

  const customDays = (customFrom && customTo)
    ? Math.round((new Date(customTo) - new Date(customFrom)) / 86400000) + 1
    : 0;

  const rangeLabel = range === "custom" && customFrom && customTo
    ? `${fmtDateLabel(customFrom)} → ${fmtDateLabel(customTo)} (${customDays}d)`
    : QUICK_RANGES.find(r => r.id === range)?.label || "";

  return (
    <>
      <div className="page-title">📊 Overview</div>

      {/* ── Date range selector ── */}
      <div style={{ marginBottom: 16 }}>
        <div className="date-pills">
          {QUICK_RANGES.map(r => (
            <button
              key={r.id}
              className={`date-pill ${range === r.id ? "active" : ""}`}
              onClick={() => { setRange(r.id); setShowPicker(false); }}
            >{r.label}</button>
          ))}
          <button
            className={`date-pill ${range === "custom" ? "active" : ""}`}
            style={{ borderStyle: "dashed" }}
            onClick={openCustom}
          >📅 Personalizado</button>
        </div>

        {/* ── Custom date picker panel ── */}
        {(showPicker || range === "custom") && (
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "14px 18px", background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, marginTop: 8, animation: "scaleIn 0.15s ease" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>Desde</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 155, padding: "7px 10px", fontSize: 13 }}
              value={customFrom}
              max={customTo || fmtDateInput(new Date())}
              onChange={e => setCustomFrom(e.target.value)}
            />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--muted)" }}>hasta</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 155, padding: "7px 10px", fontSize: 13 }}
              value={customTo}
              min={customFrom}
              max={fmtDateInput(new Date())}
              onChange={e => setCustomTo(e.target.value)}
            />
            {customDays > 0 && (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--usdt)", background: "var(--usdt-light)", border: "1px solid #a7f0d8", padding: "4px 10px", borderRadius: 20 }}>
                {customDays} día{customDays !== 1 ? "s" : ""}
              </span>
            )}
            <button
              className="btn btn-usdt btn-sm"
              disabled={!customFrom || !customTo}
              onClick={applyCustom}
            >✓ Aplicar</button>
          </div>
        )}
      </div>

      {/* ── Profit cards ── */}
      <div className="profit-grid">
        <div className="profit-card">
          <div className="profit-card-icon">📦</div>
          <div className="profit-card-label">Órdenes pagas</div>
          <div className="profit-card-value" style={{ color: "var(--blue)" }}>{paid.length}</div>
          <div className="profit-card-sub">{pending.length} pendiente{pending.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="profit-card">
          <div className="profit-card-icon">₮</div>
          <div className="profit-card-label">Ingresos</div>
          <div className="profit-card-value" style={{ color: "var(--usdt)" }}>{fmtUSDT(revenue)}</div>
          <div className="profit-card-sub">{fmtUSDT(pendingRev)} pendiente</div>
        </div>

        <div className="profit-card">
          <div className="profit-card-icon">💸</div>
          <div className="profit-card-label">Costo total</div>
          <div className="profit-card-value" style={{ color: hasCosts ? "var(--red)" : "var(--muted)" }}>
            {hasCosts ? fmtUSDT(totalCost) : "—"}
          </div>
          <div className="profit-card-sub">{hasCosts ? "Cargado en Productos" : "Configurá el costo en Productos →"}</div>
        </div>

        <div className="profit-card" style={{ background: profit >= 0 ? "var(--green-light)" : "var(--red-light)", borderColor: profit >= 0 ? "var(--green-border)" : "var(--red)" }}>
          <div className="profit-card-icon">{profit >= 0 ? "✅" : "⚠️"}</div>
          <div className="profit-card-label">Beneficio neto</div>
          <div className="profit-card-value" style={{ color: profit >= 0 ? "var(--green)" : "var(--red)" }}>
            {hasCosts ? fmtUSDT(profit) : "—"}
          </div>
          <div className="profit-card-sub">Margen: {hasCosts ? `${margin}%` : "—"}</div>
        </div>

        <div className="profit-card">
          <div className="profit-card-icon">📈</div>
          <div className="profit-card-label">ROAS</div>
          <div className="profit-card-value" style={{ color: "var(--purple)" }}>
            {roas ? `${roas}x` : "—"}
          </div>
          <div className="profit-card-sub">Ingresos por cada $1 de costo</div>
        </div>
      </div>

      {/* ── Pending alert ── */}
      {pending.length > 0 && (
        <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8 }}>
          ⏳ <strong>{pending.length} orden{pending.length > 1 ? "es" : ""} esperando confirmación ({fmtUSDT(pendingRev)})</strong>
          <button className="btn btn-sm" style={{ background: "var(--amber)", color: "#fff", border: "none", marginLeft: "auto" }} onClick={onGoOrders}>Ver órdenes →</button>
        </div>
      )}

      {/* ── Orders table ── */}
      <div className="card">
        <div className="card-title">Órdenes pagas — {rangeLabel} ({paid.length})</div>
        {paid.length === 0 ? (
          <div style={{ textAlign: "center", padding: "28px 0", color: "var(--muted)", fontSize: 14 }}>Sin órdenes pagas en este período.</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Cliente</th><th>Red</th>
                  <th>Ingresos</th>
                  {hasCosts && <><th>Costo</th><th>Beneficio</th></>}
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {paid.slice().reverse().map(o => {
                  const oCost   = calcOrderCost(o);
                  const oProfit = o.total - oCost;
                  return (
                    <tr key={o.id}>
                      <td><code style={{ fontSize: 11, color: "var(--purple)" }}>{o.id.slice(-8)}</code></td>
                      <td style={{ fontSize: 12 }}>{o.userName}</td>
                      <td><span className="tag-network">{o.network}</span></td>
                      <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(o.total)}</strong></td>
                      {hasCosts && (
                        <>
                          <td style={{ fontSize: 12, color: oCost > 0 ? "var(--red)" : "var(--muted)" }}>{oCost > 0 ? fmtUSDT(oCost) : "—"}</td>
                          <td style={{ fontWeight: 700, fontSize: 13, color: oProfit >= 0 ? "var(--green)" : "var(--red)" }}>{oCost > 0 ? fmtUSDT(oProfit) : "—"}</td>
                        </>
                      )}
                      <td style={{ color: "var(--muted)", fontSize: 12 }}>{o.createdAt ? new Date(o.createdAt).toLocaleDateString("es-AR") : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

// ─── WALLET MANAGER ───────────────────────────────────────────────────────────
const WalletManager = () => {
  const [addrs, setAddrs] = useState({ wallet_trc20: "", wallet_bep20: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => setAddrs({ wallet_trc20: data.wallet_trc20 || "", wallet_bep20: data.wallet_bep20 || "" }))
      .catch(() => {});
  }, []);

  const save = async () => {
    setError("");
    if (!addrs.wallet_trc20.trim() || !addrs.wallet_bep20.trim()) {
      setError("Ambas direcciones son obligatorias."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet_trc20: addrs.wallet_trc20.trim(), wallet_bep20: addrs.wallet_bep20.trim() }),
      });
      if (!res.ok) { setError("Error al guardar."); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Error de conexión."); }
    finally { setSaving(false); }
  };

  const qrUrl = addr => addr
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(addr)}&margin=10`
    : null;

  const walletInfo = {
    wallet_trc20: { label: "🔴 TRC20", network: "TRON Network", color: "#E84142", placeholder: "TN3W4T6ATGBY9y..." },
    wallet_bep20: { label: "🟡 BEP20", network: "BNB Smart Chain", color: "#F0B90B", placeholder: "0x71C7656EC7ab8..." },
  };

  return (
    <div>
      <div className="page-title">💳 Wallets de pago</div>
      <div style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Las direcciones se usan en el checkout. El QR se genera automáticamente a partir de la dirección.
      </div>
      {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 24 }}>
        {Object.entries(walletInfo).map(([key, info]) => (
          <div key={key} className="card">
            <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {info.label}
              <span style={{ fontSize: 11, fontWeight: 400, color: "var(--muted)" }}>{info.network}</span>
            </div>
            <div className="form-group">
              <label className="form-label">Dirección de billetera</label>
              <input
                className="form-input"
                style={{ fontFamily: "monospace", fontSize: 12 }}
                value={addrs[key]}
                onChange={e => setAddrs(p => ({ ...p, [key]: e.target.value }))}
                placeholder={info.placeholder}
              />
            </div>
            {qrUrl(addrs[key]) && (
              <div style={{ textAlign: "center", marginTop: 14, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
                <img
                  src={qrUrl(addrs[key])}
                  alt={`QR ${key}`}
                  style={{ width: 180, height: 180, border: `3px solid ${info.color}`, borderRadius: 12, padding: 6, background: "#fff" }}
                />
                <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>QR generado automáticamente</div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button className="btn btn-primary" onClick={save} disabled={saving}>
        {saving ? "Guardando..." : saved ? "✓ Guardado correctamente" : "💾 Guardar wallets"}
      </button>
      {saved && <span style={{ marginLeft: 12, color: "var(--green)", fontSize: 13, fontWeight: 600 }}>
        ¡Los cambios se aplican de inmediato en el checkout!
      </span>}
    </div>
  );
};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
const AdminPanel = ({ orders, onConfirmOrder, coupons, setCoupons, products, setProducts }) => {
  const [section, setSection] = useState("overview");

  // ── CHAT STATE ──
  const [convos, setConvos] = useState([]);
  const [selConvo, setSelConvo] = useState(null);
  const [threadMsgs, setThreadMsgs] = useState([]);
  const [aInp, setAInp] = useState("");
  const [aSending, setASending] = useState(false);
  const endRef = useRef(null);
  const prevUnreadRef = useRef(-1);

  const playNotificationSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } catch {}
  };

  const fetchConvos = async () => {
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();
      if (Array.isArray(data)) {
        setConvos(data);
        const totalUnread = data.reduce((s, c) => s + (c.unread || 0), 0);
        if (prevUnreadRef.current >= 0 && totalUnread > prevUnreadRef.current) {
          playNotificationSound();
        }
        prevUnreadRef.current = totalUnread;
      }
    } catch {}
  };

  const fetchThread = async (email) => {
    try {
      const res = await fetch(`/api/chat?userEmail=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (Array.isArray(data)) setThreadMsgs(data);
    } catch {}
  };

  useEffect(() => {
    if (section !== "chat") return;
    prevUnreadRef.current = -1;
    fetchConvos();
    const interval = setInterval(() => {
      fetchConvos();
      if (selConvo) fetchThread(selConvo.userEmail);
    }, 4000);
    return () => clearInterval(interval);
  }, [section, selConvo?.userEmail]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [threadMsgs]);

  const selectConvo = (c) => {
    setSelConvo(c);
    setThreadMsgs([]);
    fetchThread(c.userEmail);
  };

  const sendAdmin = async () => {
    if (!aInp.trim() || !selConvo || aSending) return;
    setASending(true);
    const text = aInp.trim();
    setAInp("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, targetEmail: selConvo.userEmail, targetName: selConvo.userName }),
      });
      if (res.ok) fetchThread(selConvo.userEmail);
    } catch {}
    finally { setASending(false); }
  };

  const pendingCount = orders.filter(o => o.status === "pending").length;
  const activeCoupons = coupons.filter(c => c.active && c.uses < c.maxUses).length;
  const chatUnread = convos.reduce((s, c) => s + (c.unread || 0), 0);

  const sideItems = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "orders", icon: "📦", label: "Órdenes", badge: pendingCount, badgeColor: "var(--amber)" },
    { id: "coupons", icon: "🏷", label: "Cupones", badge: activeCoupons, badgeColor: "var(--purple)" },
    { id: "chat", icon: "💬", label: "Chat en vivo", badge: chatUnread, badgeColor: "var(--red)" },
    { id: "products", icon: "🛍", label: "Productos" },
    { id: "wallets", icon: "💳", label: "Wallets" },
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
        {section === "overview" && <AdminOverview orders={orders} products={products} onGoOrders={() => setSection("orders")} />}
        {section === "orders" && <AdminOrders orders={orders} onConfirm={onConfirmOrder} />}
        {section === "coupons" && <CouponManager coupons={coupons} setCoupons={setCoupons} />}
        {section === "chat" && (
          <>
            <div className="page-title">💬 Chat en vivo</div>
            <div className="admin-chat-layout">
              <div className="convo-list">
                {convos.length === 0 ? (
                  <div style={{ padding: "30px 14px", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
                    No hay conversaciones aún.
                  </div>
                ) : convos.map(c => (
                  <div key={c.userEmail} className={`convo-item ${selConvo?.userEmail === c.userEmail ? "active" : ""}`} onClick={() => selectConvo(c)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div className="convo-name">{c.userName || c.userEmail}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 11, color: "var(--muted)" }}>{c.lastAt ? new Date(c.lastAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                        {c.unread > 0 && <div className="unread-dot" />}
                      </div>
                    </div>
                    <div className="convo-preview">{c.lastMsg}</div>
                  </div>
                ))}
              </div>
              <div className="chat-panel">
                {!selConvo ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--muted)", fontSize: 14 }}>
                    ← Seleccioná una conversación
                  </div>
                ) : (
                  <>
                    <div className="chat-panel-header">
                      <div>
                        <div style={{ fontFamily: "Syne", fontWeight: 700 }}>{selConvo.userName || selConvo.userEmail}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{selConvo.userEmail}</div>
                      </div>
                      <span className="badge badge-green">Activo</span>
                    </div>
                    <div className="chat-msgs" style={{ padding: 16 }}>
                      {threadMsgs.length === 0 && (
                        <div style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "20px 0" }}>Sin mensajes aún</div>
                      )}
                      {threadMsgs.map((m) => (
                        <div key={m.id} className={`cmsg ${m.isAdmin ? "cmsg-u" : "cmsg-a"}`}>
                          <div className="cmsg-b">{m.text}</div>
                          <div className="cmsg-t">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        </div>
                      ))}
                      <div ref={endRef} />
                    </div>
                    <div className="chat-input-row">
                      <input
                        className="chat-inp"
                        placeholder="Responder al cliente..."
                        value={aInp}
                        onChange={e => setAInp(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && sendAdmin()}
                        disabled={aSending}
                      />
                      <button className="chat-snd" onClick={sendAdmin} disabled={aSending}>➤</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
        {section === "products" && <ProductManager products={products} setProducts={setProducts} />}
        {section === "wallets" && <WalletManager />}
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

  // ── DARK MODE ──
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const key = `bmverif_theme_${user?.email || "guest"}`;
    setDarkMode(localStorage.getItem(key) === "dark");
  }, [user?.email]);
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    const key = `bmverif_theme_${user?.email || "guest"}`;
    localStorage.setItem(key, next ? "dark" : "light");
  };

  const [view, setView] = useState("shop");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("bmveri_cart");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("bmveri_cart", JSON.stringify(cart)); } catch {}
  }, [cart]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const miniCartTimer = useRef(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingCoupon, setPendingCoupon] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  // ── ORDERS ──
  const [orders, setOrders] = useState([]);
  const [lastOrder, setLastOrder] = useState(null);
  useEffect(() => {
    if (!user) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => {});
  }, [user?.email]);

  // ── COUPONS (admin) ──
  const [coupons, setCoupons] = useState([]);
  useEffect(() => {
    if (isAdmin) {
      fetch("/api/coupons")
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setCoupons(data); })
        .catch(() => {});
    }
  }, [isAdmin]);

  // ── PRODUCTS ──
  const [products, setProducts] = useState([]);
  useEffect(() => {
    const url = isAdmin ? "/api/products?all=true" : "/api/products";
    fetch(url)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProducts(data); })
      .catch(() => {});
  }, [isAdmin]);

  // ── WALLETS (dynamic from DB) ──
  const [wallets, setWallets] = useState(WALLETS);
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setWallets(prev => ({
          ...prev,
          TRC20: { ...prev.TRC20, addr: data.wallet_trc20 || prev.TRC20.addr },
          BEP20: { ...prev.BEP20, addr: data.wallet_bep20 || prev.BEP20.addr },
        }));
      })
      .catch(() => {});
  }, []);
  // When products load (or update), sync cart items with the latest
  // tiers/cost/basePrice so localStorage-loaded items are always fresh
  useEffect(() => {
    if (products.length === 0) return;
    setCart(prev => {
      if (prev.length === 0) return prev;
      const updated = prev.map(item => {
        const product = products.find(p => p.id === item.id);
        if (!product) return item;
        return {
          ...item,
          tiers: product.tiers ?? item.tiers ?? [],
          basePrice: item.basePrice ?? product.price,
          cost: product.cost ?? item.cost ?? 0,
        };
      });
      return rebalanceTiers(updated);
    });
  }, [products]);

  // ── FAVORITES ──
  const [liked, setLiked] = useState({});
  useEffect(() => {
    if (!user) return;
    fetch("/api/favorites")
      .then(r => r.json())
      .then(ids => {
        if (Array.isArray(ids)) {
          const map = {};
          ids.forEach(id => { map[id] = true; });
          setLiked(map);
        }
      })
      .catch(() => {});
  }, [user?.email]);

  const toggleLike = async (productId) => {
    if (!user) { setAuthTab("login"); setShowAuth(true); return; }
    setLiked(l => ({ ...l, [productId]: !l[productId] })); // optimistic
    try {
      await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
    } catch {
      setLiked(l => ({ ...l, [productId]: !l[productId] })); // revert on error
    }
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const addToCart = p => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      let next;
      if (idx === -1) {
        const base = p.basePrice ?? p.price;
        next = [...prev, { ...p, basePrice: base, qty: 1 }];
      } else {
        // Also refresh tiers/cost from the live product so stale localStorage items get updated
        next = prev.map(i => i.id === p.id
          ? { ...i, qty: i.qty + 1, tiers: p.tiers ?? i.tiers ?? [], basePrice: i.basePrice ?? p.price, cost: p.cost ?? i.cost ?? 0 }
          : i);
      }
      return rebalanceTiers(next);
    });
    setLastAdded(p);
    setShowMiniCart(true);
    if (miniCartTimer.current) clearTimeout(miniCartTimer.current);
    miniCartTimer.current = setTimeout(() => setShowMiniCart(false), 4000);
  };
  const removeFromCart = id => setCart(prev => rebalanceTiers(prev.filter(i => i.id !== id)));
  const addToCartQty = (p, qty) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      const base = p.basePrice ?? p.price;
      const next = idx === -1
        ? [...prev, { ...p, basePrice: base, qty }]
        : prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty, tiers: p.tiers ?? i.tiers ?? [], basePrice: i.basePrice ?? base, cost: p.cost ?? i.cost ?? 0 } : i);
      return rebalanceTiers(next);
    });
    setLastAdded(p);
    setShowMiniCart(true);
    if (miniCartTimer.current) clearTimeout(miniCartTimer.current);
    miniCartTimer.current = setTimeout(() => setShowMiniCart(false), 4000);
  };
  const handleBuyNowQty = (p, qty) => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      const base = p.basePrice ?? p.price;
      const next = idx === -1
        ? [...prev, { ...p, basePrice: base, qty }]
        : prev.map(i => i.id === p.id ? { ...i, qty: i.qty + qty, tiers: p.tiers ?? i.tiers ?? [], basePrice: i.basePrice ?? base, cost: p.cost ?? i.cost ?? 0 } : i);
      return rebalanceTiers(next);
    });
    setView("checkout");
    setSelectedProduct(null);
  };
  const setQty = (id, qty) => {
    if (qty <= 0) return removeFromCart(id);
    setCart(prev => rebalanceTiers(prev.map(i => i.id === id ? { ...i, qty } : i)));
  };

  const handleBuyNow = p => {
    setCart(prev => {
      const idx = prev.findIndex(i => i.id === p.id);
      let next;
      if (idx === -1) {
        const base = p.basePrice ?? p.price;
        next = [...prev, { ...p, basePrice: base, qty: 1 }];
      } else {
        next = prev.map(i => i.id === p.id
          ? { ...i, qty: i.qty + 1, tiers: p.tiers ?? i.tiers ?? [], basePrice: i.basePrice ?? p.price, cost: p.cost ?? i.cost ?? 0 }
          : i);
      }
      return rebalanceTiers(next);
    });
    setView("checkout");
  };

  const handleCheckout = (coupon, total) => {
    setCartOpen(false);
    setPendingCoupon(coupon);
    setPendingTotal(total);
    if (!user) { setShowAuth(true); return; }
    setShowPayment(true);
  };

  const handlePaySuccess = async (network, txHash) => {
    if (pendingCoupon) {
      fetch("/api/coupons/use", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: pendingCoupon.code }),
      }).catch(() => {});
    }
    const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
    const discount = pendingCoupon ? subtotal * (pendingCoupon.discount / 100) : 0;
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost || 0, qty: i.qty })),
          subtotal,
          discount,
          coupon: pendingCoupon?.code || null,
          total: pendingTotal,
          network,
          txHash,
        }),
      });
      const newOrder = await res.json();
      setOrders(prev => [newOrder, ...prev]);
      setLastOrder(newOrder);
    } catch {
      // si falla la API igual mostramos el modal de éxito
      setLastOrder({ id: "ORD-LOCAL", network, total: pendingTotal, txHash });
    }
    setShowPayment(false);
    setCart([]);
    setPendingCoupon(null);
    setShowSuccess(true);
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      const updated = await res.json();
      if (res.ok) setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
    } catch {}
  };

  if (isAdmin) {
    return (
      <div className={`app${darkMode ? " dark" : ""}`}>
        <style>{css}</style>
        <div className="topbar">
          <div className="logo">BMVERIF<span style={{ fontSize: 11, background: "var(--red)", color: "#fff", padding: "2px 8px", borderRadius: 6, marginLeft: 7 }}>ADMIN</span></div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Panel de administración · {user.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="dark-toggle" onClick={toggleDark} title={darkMode ? "Modo claro" : "Modo oscuro"}>{darkMode ? "☀️" : "🌙"}</button>
            <button className="btn btn-outline btn-sm" onClick={() => signOut()}>← Cerrar sesión</button>
          </div>
        </div>
        <AdminPanel orders={orders} onConfirmOrder={handleConfirmOrder} coupons={coupons} setCoupons={setCoupons} products={products} setProducts={setProducts} />
      </div>
    );
  }

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <style>{css}</style>
      <div className="topbar">
        <div className="logo" onClick={() => { setView("shop"); setSelectedProduct(null); }}>BMVERIF</div>
        <div className="topbar-right">
          {user ? (
            <>
              <button className={`nav-tab ${view === "shop" ? "active" : ""}`} onClick={() => { setView("shop"); setSelectedProduct(null); }}>🛍 Tienda</button>
              <button className={`nav-tab ${view === "account" ? "active" : ""}`} onClick={() => setView("account")}>👤 Mi cuenta</button>
              <button className="btn btn-outline btn-sm" onClick={() => signOut()}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => { setAuthTab("login"); setShowAuth(true); }}>Iniciar sesión</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab("register"); setShowAuth(true); }}>Registrarse</button>
            </>
          )}
          <button className="dark-toggle" onClick={toggleDark} title={darkMode ? "Modo claro" : "Modo oscuro"}>{darkMode ? "☀️" : "🌙"}</button>
          <button
            className="cart-fab"
            onClick={() => { setView("checkout"); setSelectedProduct(null); setShowMiniCart(false); }}
            onMouseEnter={() => { if (miniCartTimer.current) clearTimeout(miniCartTimer.current); if (totalItems > 0) setShowMiniCart(true); }}
            onMouseLeave={() => { miniCartTimer.current = setTimeout(() => setShowMiniCart(false), 400); }}
          >
            🛒 {totalItems > 0 ? <span className="cart-count">{totalItems}</span> : "Carrito"}
          </button>
        </div>
      </div>

      {view === "shop" && !selectedProduct && <ShopPage cart={cart} onAddToCart={addToCart} onBuyNow={handleBuyNow} onCartOpen={() => setCartOpen(true)} liked={liked} onToggleLike={toggleLike} products={products} onProductClick={p => setSelectedProduct(p)} />}
      {view === "shop" && selectedProduct && <ProductDetailPage product={selectedProduct} cart={cart} onBack={() => setSelectedProduct(null)} onAddToCartQty={addToCartQty} onBuyNowQty={handleBuyNowQty} liked={liked} onToggleLike={toggleLike} user={user} />}
      {view === "checkout" && <CheckoutPage cart={cart} onQty={setQty} onRemove={removeFromCart} user={user} onGoShop={() => setView("shop")} onShowAuth={() => { setAuthTab("login"); setShowAuth(true); }} onSuccess={order => { setOrders(prev => [order, ...prev]); setCart([]); }} wallets={wallets} />}
      {view === "account" && user && <UserAccount user={user} userOrders={orders} liked={liked} onToggleLike={toggleLike} onGoShop={() => setView("shop")} products={products} />}

      {showMiniCart && cart.length > 0 && (
        <MiniCart
          cart={cart}
          lastAdded={lastAdded}
          onClose={() => setShowMiniCart(false)}
          onOpenCart={() => { setView("checkout"); setSelectedProduct(null); setShowMiniCart(false); }}
          onMouseEnter={() => { if (miniCartTimer.current) clearTimeout(miniCartTimer.current); }}
          onMouseLeave={() => { miniCartTimer.current = setTimeout(() => setShowMiniCart(false), 400); }}
        />
      )}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onSuccess={() => setShowPayment(pendingTotal > 0)} initialTab={authTab} />}
      {showPayment && user && <PaymentModal cart={cart} user={user} coupon={pendingCoupon} finalTotal={pendingTotal} onClose={() => setShowPayment(false)} onSuccess={handlePaySuccess} wallets={wallets} />}
      {showSuccess && lastOrder && <SuccessModal order={lastOrder} onClose={() => { setShowSuccess(false); setView("account"); }} />}

      <ChatWidget user={user} onShowAuth={() => { setAuthTab("login"); setShowAuth(true); }} />
    </div>
  );
}
