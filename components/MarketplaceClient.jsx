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
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@300;400;500&display=swap');
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
  .logo { cursor: pointer; align-self: stretch; display: flex; align-items: stretch; padding: 0; overflow: hidden; }
  .logo img { height: 100%; width: auto; max-width: 320px; object-fit: fill; border-radius: 0; display: block; }
  .logo span { color: var(--text); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }
  .nav-tab { background: none; border: none; padding: 6px 13px; border-radius: 8px; font-size: 13px; font-weight: 500; color: var(--muted); transition: all 0.15s; }
  .nav-tab:hover { background: var(--red-light); color: var(--red); }
  .nav-tab.active { background: var(--red); color: #fff; font-weight: 700; }
  .cart-fab { position: relative; background: var(--text); color: #fff; border: none; padding: 8px 15px; border-radius: 10px; font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 7px; }
  .cart-fab:hover { background: #333; }
  .cart-count { background: var(--red); color: #fff; width: 19px; height: 19px; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; }

  .hero { position: relative; background: linear-gradient(135deg, #050D1A 0%, #0A1628 40%, #0F2040 70%, #050D1A 100%); color: #fff; padding: 52px 28px 44px; text-align: center; border-bottom: 1px solid rgba(212,175,55,0.25); overflow: hidden; }
  .hero::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 50% -10%, rgba(212,175,55,0.18) 0%, transparent 60%); pointer-events: none; }
  .hero-banner-img { display: none; }
  .hero-logo { width: 180px; height: 180px; object-fit: contain; display: block; margin: 0 auto 18px; filter: drop-shadow(0 4px 18px rgba(212,175,55,0.45)); }
  .hero h1 { font-size: clamp(24px,4vw,46px); font-weight: 900; letter-spacing: -0.5px; margin-bottom: 50px; line-height: 1.1; }
  .hero h1 span { color: #D4AF37; }
  .hero p { font-size: 14px; opacity: 0.78; max-width: 480px; margin: 0 auto 22px; line-height: 1.65; }
  .hero-badges { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .hero-badge { background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); color: #D4AF37; padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; }

  .shop-wrap { flex: 1; max-width: 1200px; margin: 0 auto; width: 100%; padding: 24px 20px; }
  .shop-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .shop-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; }
  .shop-count { font-size: 13px; color: var(--muted); }
  .cat-filter { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
  .cat-chip { display: flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 50px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid var(--border); background: var(--surface); color: var(--muted); transition: all 0.15s; }
  .cat-chip:hover { border-color: #1877F2; color: #1877F2; }
  .cat-chip.active { background: #1877F2; border-color: #1877F2; color: #fff; box-shadow: 0 2px 10px rgba(24,119,242,0.35); }
  .cat-section-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 10px; margin-top: 4px; padding-bottom: 8px; border-bottom: 2px solid #1877F2; display: inline-block; }
  .product-list { display: flex; flex-direction: column; background: var(--surface); border: 1.5px solid var(--border); border-radius: 12px; overflow: hidden; box-shadow: var(--shadow); }
  .product-row { display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border); transition: background 0.12s; }
  .product-row:last-child { border-bottom: none; }
  .product-row:hover { background: #FAFAFA; }
  .prod-thumb { width: 68px; height: 68px; flex-shrink: 0; border-radius: 10px; overflow: hidden; position: relative; margin-right: 16px; }
  .prod-thumb-inner { width: 100%; height: 100%; background: none; display: flex; }
  .prod-thumb-inner img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .prod-thumb-icon { display: none; }
  .prod-thumb-label { display: none; }
  .verified-badge { display: none; }
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
  .prod-right { display: flex; flex-direction: row; align-items: center; gap: 12px; flex-shrink: 0; }
  .prod-price { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 700; white-space: nowrap; letter-spacing: 0.3px; }
  .prod-actions { display: flex; align-items: center; gap: 8px; }
  .buy-btn { background: var(--red); color: #fff; border: none; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; transition: all 0.15s; white-space: nowrap; }
  .buy-btn:hover:not(:disabled) { background: var(--red-dark); transform: translateY(-1px); }
  .buy-btn:disabled { background: #D1D5DB; color: #9CA3AF; cursor: not-allowed; }
  .icon-btn { width: 36px; height: 36px; border-radius: 8px; border: 1.5px solid var(--border); background: var(--surface); display: flex; align-items: center; justify-content: center; font-size: 15px; color: var(--muted); transition: all 0.15s; flex-shrink: 0; }
  .icon-btn:hover, .icon-btn.liked { border-color: var(--red); color: var(--red); background: var(--red-light); }
  .in-cart-badge { background: var(--green); color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-size: 13px; font-weight: 700; white-space: nowrap; display: flex; align-items: center; gap: 6px; }

  /* DELIVERY */
  .deliver-btn { background: #F0FDF4; color: #15803D; border: 1.5px solid #BBF7D0; padding: 5px 11px; border-radius: 7px; font-size: 12px; font-weight: 700; cursor: pointer; white-space: nowrap; transition: all 0.15s; }
  .deliver-btn:hover { background: #DCFCE7; }
  .deliver-btn.delivered { background: #F0FDF4; color: #15803D; border-color: #86EFAC; cursor: default; }
  .deliver-pending { font-size: 11px; color: var(--amber); background: var(--amber-light); border: 1px solid var(--amber-border); padding: 3px 9px; border-radius: 6px; font-weight: 600; white-space: nowrap; }
  .deliver-ready { font-size: 11px; color: #15803D; background: #F0FDF4; border: 1px solid #BBF7D0; padding: 3px 9px; border-radius: 6px; font-weight: 600; white-space: nowrap; cursor: pointer; transition: all 0.15s; }
  .deliver-ready:hover { background: #DCFCE7; }
  .delivery-modal-content { background: var(--surface); border-radius: 16px; padding: 28px; max-width: 600px; width: 100%; box-shadow: var(--shadow-lg); max-height: 80vh; display: flex; flex-direction: column; gap: 14px; }
  .delivery-text { background: var(--bg); border: 1.5px solid var(--border); border-radius: 10px; padding: 16px; font-family: monospace; font-size: 13px; line-height: 1.7; white-space: pre-wrap; word-break: break-all; overflow-y: auto; max-height: 340px; color: var(--text); }

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
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.15)} }
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
  .chat-support-btn { background: none; border: 1.5px solid var(--border); border-radius: 8px; width: 34px; height: 34px; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; }
  .chat-support-btn:hover { border-color: var(--red); background: var(--red-light); }
  .chat-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 200; display: flex; align-items: center; justify-content: center; }
  .chat-window { width: 600px; height: 620px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 17px; box-shadow: var(--shadow-lg); display: flex; flex-direction: column; overflow: hidden; animation: fadeIn 0.2s ease; }
  .chat-head { background: var(--red); color: #fff; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; }
  .chat-agent-info { display: flex; align-items: center; gap: 9px; }
  .agent-av { width: 34px; height: 34px; background: rgba(255,255,255,0.25); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 17px; }
  .agent-nm { font-weight: 700; font-size: 13px; }
  .agent-st { font-size: 10px; opacity: 0.85; }
  .chat-hours { font-size: 10px; opacity: 0.70; margin-top: 1px; }
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

  /* NOTIFICATIONS */
  .notif-wrap { position: relative; }
  .notif-btn { background: none; border: 1.5px solid var(--border); border-radius: 8px; width: 34px; height: 34px; font-size: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s; flex-shrink: 0; position: relative; }
  .notif-btn:hover { border-color: var(--red); background: var(--red-light); }
  .notif-badge { position: absolute; top: -5px; right: -5px; background: var(--red); color: #fff; font-size: 10px; font-weight: 800; min-width: 16px; height: 16px; border-radius: 8px; display: flex; align-items: center; justify-content: center; padding: 0 3px; border: 2px solid var(--surface); }
  .notif-dropdown { position: absolute; right: 0; top: calc(100% + 8px); width: 340px; background: var(--surface); border: 1.5px solid var(--border); border-radius: 14px; box-shadow: var(--shadow-lg); z-index: 500; overflow: hidden; }
  .notif-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .notif-header-title { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; }
  .notif-mark-read { background: none; border: none; font-size: 11px; color: var(--red); font-weight: 600; cursor: pointer; }
  .notif-list { max-height: 320px; overflow-y: auto; }
  .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; gap: 10px; align-items: flex-start; transition: background 0.1s; }
  .notif-item:last-child { border-bottom: none; }
  .notif-item.unread { background: var(--red-light); }
  .notif-item:hover { background: var(--bg); }
  .notif-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--red); flex-shrink: 0; margin-top: 5px; }
  .notif-dot.read { background: transparent; }
  .notif-title { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .notif-body { font-size: 12px; color: var(--muted); line-height: 1.4; }
  .notif-time { font-size: 10px; color: var(--muted); margin-top: 3px; }
  .notif-empty { padding: 28px 16px; text-align: center; color: var(--muted); font-size: 13px; }

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
  .app.dark .hero { background: linear-gradient(135deg, #050D1A 0%, #0A1628 40%, #0F2040 70%, #050D1A 100%); }
  .app.dark .topbar { background: var(--surface); border-color: var(--border); }
  .app.dark .sidebar { background: var(--surface); border-color: var(--border); }
  .app.dark .sidebar-item:hover { background: #222535; }
  .app.dark .product-list { background: var(--surface); border-color: var(--border); }
  .app.dark .product-row:hover { background: #222535; }
  .app.dark .prod-thumb-inner { background: none; }
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
  .app.dark .chat-overlay { background: rgba(0,0,0,0.60); }
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
  .info-section { max-width: 1200px; margin: 40px auto 0; padding: 0 20px 40px; }
  .info-section h2 { font-size: 22px; font-weight: 800; margin: 32px 0 10px; color: var(--text); }
  .info-section h3 { font-size: 16px; font-weight: 700; margin: 24px 0 8px; color: var(--text); }
  .info-section p { font-size: 13px; line-height: 1.7; color: var(--muted); margin: 0 0 10px; }
  .info-section ul { margin: 6px 0 10px 18px; padding: 0; }
  .info-section ul li { font-size: 13px; line-height: 1.7; color: var(--muted); margin-bottom: 4px; }
  .info-section .info-divider { border: none; border-top: 1px solid var(--border); margin: 32px 0; }
  .info-table { width: 100%; border-collapse: collapse; font-size: 12px; margin: 12px 0; }
  .info-table th { background: var(--surface); border: 1px solid var(--border); padding: 8px 10px; text-align: left; font-weight: 700; color: var(--text); }
  .info-table td { border: 1px solid var(--border); padding: 8px 10px; color: var(--muted); vertical-align: top; }
  .info-faq { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; }
  .info-faq-item { border: 1px solid var(--border); border-radius: 10px; padding: 14px 16px; background: var(--surface); }
  .info-faq-q { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .info-faq-a { font-size: 12px; color: var(--muted); line-height: 1.6; }
  .site-footer { border-top: 1px solid var(--border); padding: 28px 24px; margin-top: auto; }
  .side-btns-bar { display: flex; justify-content: space-between; align-items: center; padding: 6px 20px; pointer-events: none; }
  .support-fab { display: flex; align-items: center; gap: 8px; background: #E02020; color: #fff; border: none; border-radius: 50px; padding: 8px 16px 8px 12px; font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 18px rgba(224,32,32,0.45); transition: transform 0.15s, box-shadow 0.15s; text-decoration: none; letter-spacing: 0.01em; pointer-events: all; }
  .support-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 26px rgba(224,32,32,0.55); }
  .support-fab svg { width: 16px; height: 16px; flex-shrink: 0; }
  .left-panel { display: flex; flex-direction: row; gap: 8px; pointer-events: all; align-items: center; }
  .left-panel-btn { display: flex; align-items: center; gap: 7px; padding: 8px 14px 8px 11px; border-radius: 50px; font-size: 13px; font-weight: 700; cursor: pointer; text-decoration: none; border: none; transition: transform 0.15s, box-shadow 0.15s; white-space: nowrap; box-shadow: 0 3px 14px rgba(0,0,0,0.25); }
  .left-panel-btn:hover { transform: translateY(-2px); }
  .left-panel-btn.tg-support { background: #229ED9; color: #fff; }
  .left-panel-btn.tg-channel { background: #229ED9; color: #fff; }
  .left-panel-btn svg { width: 18px; height: 18px; flex-shrink: 0; }
  .site-footer-inner { max-width: 1200px; margin: 0 auto; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
  .site-footer-logo { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 800; color: var(--text); }
  .site-footer-logo span { color: #D4AF37; }
  .site-footer-links { display: flex; flex-wrap: wrap; gap: 6px 18px; align-items: center; }
  .site-footer-link { font-size: 12px; color: var(--muted); background: none; border: none; cursor: pointer; padding: 0; text-decoration: none; transition: color 0.15s; }
  .site-footer-link:hover { color: var(--text); }
  .site-footer-copy { font-size: 11px; color: var(--muted); white-space: nowrap; }
`;


// ─── UTILS ───────────────────────────────────────────────────────────────────
const fmt = n => `$${Number(n).toFixed(2)}`;
const fmtUSDT = n => `${Number(n).toFixed(2)} USD`;

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
  return <span className="status-cancelled">✕ Rechazada</span>;
};

// ─── NOTIFICATION BELL ────────────────────────────────────────────────────────
function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [[880, 0, 0.18], [1108, 0.2, 0.42]].forEach(([freq, t0, t1]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine"; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + t0);
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t1);
      osc.start(ctx.currentTime + t0);
      osc.stop(ctx.currentTime + t1);
    });
  } catch {}
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} d`;
}

const NotificationBell = ({ user, onGoAccount }) => {
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const prevUnread = useRef(0);
  const faviconRef = useRef(null);
  const faviconImgRef = useRef(null);
  const blinkInterval = useRef(null);
  const dropRef = useRef(null);

  const unread = notifs.filter(n => !n.read).length;

  // ── Favicon blink ──
  const getFaviconEl = () => {
    if (faviconRef.current) return faviconRef.current;
    let el = document.querySelector("link[rel~='icon']");
    if (!el) { el = document.createElement("link"); el.rel = "icon"; document.head.appendChild(el); }
    faviconRef.current = el;
    return el;
  };

  const loadFaviconImg = () => new Promise((resolve) => {
    if (faviconImgRef.current) { resolve(faviconImgRef.current); return; }
    const img = new Image();
    img.onload = () => { faviconImgRef.current = img; resolve(img); };
    img.src = "/favicon.png";
  });

  const makeFavicon = async (dot) => {
    const img = await loadFaviconImg();
    const c = document.createElement("canvas"); c.width = 32; c.height = 32;
    const ctx = c.getContext("2d");
    ctx.drawImage(img, 0, 0, 32, 32);
    if (dot) {
      ctx.fillStyle = "#EF4444"; ctx.beginPath(); ctx.arc(26, 6, 7, 0, Math.PI * 2); ctx.fill();
    }
    return c.toDataURL();
  };

  useEffect(() => {
    const el = getFaviconEl();
    if (unread > 0) {
      let toggle = true;
      const update = async () => { el.href = await makeFavicon(toggle); toggle = !toggle; };
      update();
      blinkInterval.current = setInterval(update, 800);
    } else {
      clearInterval(blinkInterval.current);
      el.href = "/favicon.png";
    }
    return () => clearInterval(blinkInterval.current);
  }, [unread]);

  // ── SSE real-time stream (auto-reconnects on drop) ──
  useEffect(() => {
    if (!user) return;
    let es;
    const connect = () => {
      es = new EventSource("/api/notifications/stream");
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === "init") {
            setNotifs(msg.notifs);
            prevUnread.current = msg.notifs.filter(n => !n.read).length;
          } else if (msg.type === "new") {
            setNotifs(prev => {
              const ids = new Set(prev.map(x => x.id));
              const fresh = msg.notifs.filter(x => !ids.has(x.id));
              return fresh.length ? [...fresh, ...prev] : prev;
            });
            playChime();
            prevUnread.current += msg.notifs.length;
          }
        } catch {}
      };
      es.onerror = () => {
        es.close();
        // Reconnect after 5s if connection drops
        setTimeout(connect, 5000);
      };
    };
    connect();
    return () => es?.close();
  }, [user?.email]);

  // ── Close on outside click ──
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications/read", { method: "PATCH" }).catch(() => {});
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    prevUnread.current = 0;
  };

  const handleClick = async (n) => {
    // Mark as read
    if (!n.read) {
      await fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
      prevUnread.current = Math.max(0, prevUnread.current - 1);
    }
    // "Pedido listo" → navigate to Mi Cuenta
    if (n.type === "order_delivered") {
      setOpen(false);
      onGoAccount?.();
    }
  };

  if (!user) return null;

  return (
    <div className="notif-wrap" ref={dropRef}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)} title="Notificaciones">
        🔔
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Notificaciones</span>
            {unread > 0 && <button className="notif-mark-read" onClick={markAllRead}>Marcar todo leído</button>}
          </div>
          <div className="notif-list">
            {notifs.length === 0
              ? <div className="notif-empty">Sin notificaciones</div>
              : notifs.map(n => (
                <div
                  key={n.id}
                  className={`notif-item${!n.read ? " unread" : ""}`}
                  style={{ cursor: (n.read && n.type !== "order_delivered") ? "default" : "pointer" }}
                  onClick={() => handleClick(n)}
                >
                  <div className={`notif-dot${n.read ? " read" : ""}`} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="notif-title">{n.title}</div>
                    <div className="notif-body">{n.body}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 3 }}>
                      <div className="notif-time">{timeAgo(n.createdAt)}</div>
                      {n.type === "order_delivered" && <span style={{ fontSize: 10, color: "#15803D", fontWeight: 700 }}>→ Ver pedido</span>}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}
    </div>
  );
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
const ChatWidget = ({ user, open, onClose }) => {
  const [msgs, setMsgs] = useState([]);
  const [inp, setInp] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);
  const pollRef = useRef(null);

  // Working hours: Mon–Fri 09:00–20:00 (local time)
  const isOnline = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Dom, 6=Sáb
    const hour = now.getHours();
    return day >= 1 && day <= 5 && hour >= 9 && hour < 20;
  };
  const online = isOnline();

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

  if (!open || !user) return null;

  return (
    <div className="chat-overlay" onClick={e => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="chat-window">
        <div className="chat-head">
          <div className="chat-agent-info">
            <div className="agent-av">🎧</div>
            <div>
              <div className="agent-nm">Soporte</div>
              <div className="agent-st">{online ? "● En línea" : "● Fuera de horario"}</div>
              <div className="chat-hours">Lun – Vie · 09:00 – 20:00</div>
            </div>
          </div>
          <button className="chat-x" onClick={onClose}>✕</button>
        </div>
        <div className="chat-msgs">
          {msgs.length === 0 && (
            <div className="cmsg cmsg-a">
              <div className="cmsg-b">
                {online
                  ? "¡Hola! 👋 ¿En qué puedo ayudarte hoy?"
                  : "¡Hola! 👋 Estamos fuera de horario, pero te responderemos a la brevedad."}
              </div>
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
    </div>
  );
};

// ─── AUTH MODAL ───────────────────────────────────────────────────────────────
const spamNote = (
  <div style={{ marginTop: 12, padding: "10px 14px", background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 9, fontSize: 12, color: "#92400E", lineHeight: 1.5 }}>
    📁 <strong>Revisá también la carpeta de spam / no deseados</strong> por si el email llegó ahí.
  </div>
);

const AuthModal = ({ onClose, onSuccess, initialTab = "login" }) => {
  const [tab, setTab] = useState(initialTab); // "login" | "register" | "forgot"
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState(""); // plain string OR "UNVERIFIED"
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [verifyPending, setVerifyPending] = useState(false); // after register
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [totpStep, setTotpStep] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleLogin = async () => {
    setError(""); setLoading(true);
    try {
      // Pre-check: distinguish wrong password / unverified / needs 2FA
      const check = await fetch("/api/auth/check-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim().toLowerCase(), password: form.password }),
      }).then(r => r.json()).catch(() => ({ valid: false }));

      if (!check.valid) {
        setError(check.unverified ? "UNVERIFIED" : "Email o contraseña incorrectos.");
        return;
      }
      if (check.requires2fa) {
        setTotpStep(true);
        return;
      }
      // No 2FA — sign in directly
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        totp: "",
      });
      if (res?.error) { setError("Email o contraseña incorrectos."); return; }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithTotp = async () => {
    setError(""); setLoading(true);
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: form.email.trim().toLowerCase(),
        password: form.password,
        totp: totpCode,
      });
      if (res?.error) { setError("Código incorrecto. Intentá de nuevo."); return; }
      onSuccess?.();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResendFromLogin = async () => {
    setResendLoading(true); setResendSent(false);
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email.trim().toLowerCase() }),
    }).catch(() => {});
    setResendLoading(false); setResendSent(true);
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
      // Don't auto-login — show "check your email" screen
      setVerifyPending(true);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Error al enviar el email."); return; }
      setForgotSent(true);
    } finally {
      setLoading(false);
    }
  };

  const goBackToLogin = () => { setTab("login"); setError(""); setForgotSent(false); setForgotEmail(""); setVerifyPending(false); setResendSent(false); setTotpStep(false); setTotpCode(""); };

  // ── 2FA CODE STEP ──────────────────────────────────────────────────────────
  if (totpStep) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🔐</div>
        <div className="modal-title">Verificación en 2 pasos</div>
        <div className="modal-sub">Ingresá el código de tu app autenticadora</div>
        <div className="form-group" style={{ marginTop: 16 }}>
          <label className="form-label">Código de 6 dígitos</label>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="000000"
            value={totpCode}
            onChange={e => setTotpCode(e.target.value.replace(/\D/g, ""))}
            onKeyDown={e => e.key === "Enter" && totpCode.length === 6 && handleLoginWithTotp()}
            autoFocus
            style={{ fontSize: 22, letterSpacing: 6, textAlign: "center" }}
          />
        </div>
        {error && (
          <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", marginBottom: 8 }}>
            ⚠️ {error}
          </div>
        )}
        <button className="btn btn-primary btn-full" onClick={handleLoginWithTotp} disabled={loading || totpCode.length < 6}>
          {loading ? "Verificando..." : "→ Verificar"}
        </button>
        <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} onClick={() => { setTotpStep(false); setTotpCode(""); setError(""); }}>
          ← Volver
        </button>
      </div>
    </div>
  );

  // ── VERIFY PENDING SCREEN (after register) ────────────────────────────────
  if (verifyPending) return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>📧</div>
        <div className="modal-title">¡Cuenta creada!</div>
        <div className="modal-sub">Verificá tu email para poder ingresar</div>
        <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6, marginBottom: 12 }}>
          Te enviamos un email de verificación a <strong>{form.email}</strong>. Hacé clic en el enlace para activar tu cuenta.
        </div>
        {spamNote}
        <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={goBackToLogin}>→ Ir al inicio de sesión</button>
      </div>
    </div>
  );

  const modalTitle = tab === "login" ? "Iniciá sesión" : tab === "register" ? "Creá tu cuenta" : "Recuperar contraseña";
  const modalSub  = tab === "login" ? "Ingresá para continuar con tu compra" : tab === "register" ? "Registrate para poder comprar" : "Te enviaremos un enlace para restablecer tu contraseña";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>{tab === "forgot" ? "🔐" : "🛒"}</div>
        <div className="modal-title">{modalTitle}</div>
        <div className="modal-sub">{modalSub}</div>

        {/* Tabs (hidden in forgot view) */}
        {tab !== "forgot" && (
          <div className="auth-tabs" style={{ display: "flex", border: "1.5px solid var(--border)", borderRadius: 11, overflow: "hidden", marginBottom: 18 }}>
            <button style={{ flex: 1, padding: 9, fontSize: 13, fontWeight: 600, border: "none", background: tab === "login" ? "var(--red)" : "none", color: tab === "login" ? "#fff" : "var(--muted)", cursor: "pointer" }} onClick={() => { setTab("login"); setError(""); }}>Iniciar sesión</button>
            <button style={{ flex: 1, padding: 9, fontSize: 13, fontWeight: 600, border: "none", background: tab === "register" ? "var(--red)" : "none", color: tab === "register" ? "#fff" : "var(--muted)", cursor: "pointer" }} onClick={() => { setTab("register"); setError(""); }}>Registrarse</button>
          </div>
        )}

        {/* Unverified email error (special case) */}
        {error === "UNVERIFIED" && (
          <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#78350F" }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ Email no verificado</div>
            <div style={{ marginBottom: 8, lineHeight: 1.5 }}>Revisá tu bandeja de entrada (y spam) para confirmar tu cuenta.</div>
            {resendSent
              ? <div style={{ color: "#15803D", fontWeight: 600 }}>✅ Email reenviado. Revisá también spam.</div>
              : <button style={{ background: "none", border: "1px solid #F59E0B", borderRadius: 7, padding: "5px 12px", fontSize: 12, color: "#92400E", cursor: "pointer", fontWeight: 600 }} onClick={handleResendFromLogin} disabled={resendLoading}>
                  {resendLoading ? "Enviando..." : "📨 Reenviar email de verificación"}
                </button>
            }
          </div>
        )}
        {error && error !== "UNVERIFIED" && <div className="error-msg">{error}</div>}

        {/* ── FORGOT PASSWORD VIEW ── */}
        {tab === "forgot" && (
          forgotSent ? (
            <div style={{ textAlign: "center", padding: "12px 0 4px" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📬</div>
              <div style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, marginBottom: 8 }}>¡Listo!</div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.5 }}>
                Si el email está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
              </div>
              {spamNote}
              <button className="btn btn-outline btn-full" style={{ marginTop: 16 }} onClick={goBackToLogin}>← Volver al inicio de sesión</button>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">Email de tu cuenta</label>
                <input className="form-input" type="email" placeholder="email@ejemplo.com" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleForgot()} autoFocus />
              </div>
              <button className="btn btn-primary btn-full" onClick={handleForgot} disabled={loading || !forgotEmail.trim()}>
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
              <button className="btn btn-outline btn-full" style={{ marginTop: 8 }} onClick={goBackToLogin}>← Volver</button>
            </>
          )
        )}

        {/* ── LOGIN / REGISTER VIEW ── */}
        {tab !== "forgot" && (
          <>
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
              {tab === "login" && (
                <div style={{ textAlign: "right", marginTop: 5 }}>
                  <button type="button" style={{ background: "none", border: "none", color: "var(--red)", fontSize: 12, cursor: "pointer", padding: 0 }} onClick={() => { setTab("forgot"); setError(""); setForgotEmail(form.email); }}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}
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
          </>
        )}
      </div>
    </div>
  );
};

// ─── PAYMENT PENDING MODAL (full-screen dark layout) ─────────────────────────
const PendingDigit = ({ n, expired }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "#0d1b2a", color: expired ? "#ef4444" : "#22c55e",
    fontFamily: "monospace", fontSize: 28, fontWeight: 900,
    width: 44, height: 52, borderRadius: 8, border: "1px solid #1e3a5f",
  }}>{n}</span>
);

const PendingPanelCard = ({ title, children, accent }) => (
  <div style={{
    background: accent ? "rgba(240,165,0,0.05)" : "#111827",
    border: `1px solid ${accent ? "rgba(240,165,0,0.25)" : "#1f2937"}`,
    borderRadius: 12, padding: "14px 16px",
  }}>
    <div style={{ color: "#f0a500", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>{title}</div>
    <div style={{ fontSize: 12, color: accent ? "#f0a500" : "#9ca3af", lineHeight: 1.65 }}>{children}</div>
  </div>
);

const PaymentPendingModal = ({ order, walletAddr, walletColor, onSuccess, onCancel, onCancelled, onMinimize }) => {
  const [payStatus, setPayStatus] = useState("polling"); // polling | paid | expired
  const [timeLeft, setTimeLeft] = useState(3600);
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const network = order.network;

  // Countdown
  useEffect(() => {
    if (!order?.expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(order.expiresAt) - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) setPayStatus(s => s === "polling" ? "expired" : s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.expiresAt]);

  // Auto-close 1s after paid (notification + email handled by backend)
  useEffect(() => {
    if (payStatus !== "paid" || !order) return;
    const t = setTimeout(() => onSuccess({ ...order, status: "paid" }), 1000);
    return () => clearTimeout(t);
  }, [payStatus]);

  // Blockchain polling: immediate check + every 30s
  useEffect(() => {
    if (!order?.id || payStatus !== "polling") return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/check-payment`);
        const data = await res.json();
        if (data.paid) setPayStatus("paid");
        else if (data.expired) setPayStatus("expired");
      } catch {}
    };
    poll(); // check immediately on open
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [order?.id, payStatus]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");
  const copy = () => {
    navigator.clipboard.writeText(walletAddr).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      const cancelled = res.ok ? await res.json() : { ...order, status: "cancelled" };
      setCancelling(false);
      if (onCancelled) onCancelled(cancelled);
      else onCancel();
    } catch {
      setCancelling(false);
      onCancel();
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "#070d14", overflowY: "auto", padding: "22px 16px 40px" }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", maxWidth: 1100, margin: "0 auto 20px" }}>
        <button onClick={() => onMinimize?.()} style={{
          background: "#1e3a5f", color: "#94a3b8", padding: "8px 22px",
          borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>← Volver</button>
        <button onClick={() => onMinimize?.()} style={{
          background: "#1e3a5f", color: "#94a3b8", padding: "8px 18px",
          borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
        }}>− Minimizar</button>
      </div>

      {/* 3-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,240px) 1fr minmax(0,240px)",
        gap: 16, maxWidth: 1100, margin: "0 auto",
      }}>

        {/* ─── LEFT COLUMN ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Countdown */}
          <div style={{ background: "#0d1b2a", border: "1px solid #1e3a5f", borderRadius: 12, padding: "18px 12px", textAlign: "center" }}>
            <div style={{ color: "#f0a500", fontWeight: 700, fontSize: 12, marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              ⏱ Payment Time Remaining
            </div>
            {payStatus === "polling" ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <PendingDigit n={mins[0]} expired={payStatus === "expired"} /><PendingDigit n={mins[1]} expired={payStatus === "expired"} />
                <span style={{ color: "#22c55e", fontSize: 26, fontWeight: 900, lineHeight: 1 }}>:</span>
                <PendingDigit n={secs[0]} expired={payStatus === "expired"} /><PendingDigit n={secs[1]} expired={payStatus === "expired"} />
              </div>
            ) : (
              <div style={{ color: payStatus === "paid" ? "#22c55e" : "#ef4444", fontWeight: 800, fontSize: 15 }}>
                {payStatus === "paid" ? "✅ Pagado" : "⏰ Expirado"}
              </div>
            )}
          </div>

          <PendingPanelCard title="ℹ Dirección">
            <strong style={{ color: "#e5e7eb" }}>Una sola vez.</strong> Copiá o escaneá el QR. No envíes fondos a esta dirección por ningún otro motivo que no sea esta orden.
          </PendingPanelCard>

          <PendingPanelCard title="⚠ Advertencia" accent>
            Red incorrecta, monto incorrecto o reutilización de esta dirección resultará en <strong style={{ color: "#fbbf24" }}>pérdida de fondos.</strong>
          </PendingPanelCard>
        </div>

        {/* ─── CENTER ─── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {payStatus === "paid" && (
            <div style={{ textAlign: "center", paddingTop: 50 }}>
              <div style={{ fontSize: 70, marginBottom: 16 }}>🎉</div>
              <div style={{ fontFamily: "Syne", fontSize: 26, fontWeight: 900, color: "#22c55e" }}>¡Pago confirmado!</div>
              <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 10 }}>Tu orden fue verificada automáticamente en la blockchain.</div>
            </div>
          )}

          {payStatus === "expired" && (
            <div style={{ textAlign: "center", paddingTop: 50 }}>
              <div style={{ fontSize: 70, marginBottom: 16 }}>⏰</div>
              <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 900, color: "#ef4444" }}>Orden vencida</div>
              <div style={{ fontSize: 14, color: "#9ca3af", marginTop: 10, marginBottom: 20 }}>El tiempo expiró. Podés crear una nueva orden.</div>
              <button onClick={onCancel} style={{ background: "#1f2937", color: "#e5e7eb", padding: "10px 24px", borderRadius: 8, border: "1px solid #374151", cursor: "pointer", fontWeight: 600 }}>
                ← Volver a la tienda
              </button>
            </div>
          )}

          {payStatus === "polling" && (
            <>
              {/* Title */}
              <div style={{ marginBottom: 18, textAlign: "center" }}>
                <span style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 900, color: "#fff" }}>Payment </span>
                <span style={{ fontFamily: "Syne", fontSize: 24, fontWeight: 900, color: "#f0a500" }}>Pending</span>
                <span style={{
                  display: "inline-block", width: 10, height: 10, borderRadius: "50%",
                  background: "#f0a500", marginLeft: 10, verticalAlign: "middle",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
              </div>

              {/* Amount */}
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontFamily: "Syne", fontSize: 54, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>
                  ${order.uniqueAmount?.toFixed(2)}
                </div>
                <div style={{ color: "#9ca3af", fontSize: 15, marginTop: 6 }}>
                  = {order.uniqueAmount?.toFixed(2)} USDT ({network})
                </div>
              </div>

              {/* QR */}
              <div style={{ background: "#fff", padding: 10, borderRadius: 12, marginBottom: 18, display: "inline-block", border: `3px solid ${walletColor || "#22c55e"}` }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=175x175&data=${encodeURIComponent(walletAddr)}&margin=4`}
                  alt="QR"
                  style={{ width: 175, height: 175, display: "block" }}
                />
              </div>

              {/* Payment address */}
              <div style={{ width: "100%", background: "#0d1b2a", borderRadius: 12, padding: "16px 18px" }}>
                <div style={{ color: "#6b7280", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  Payment Address
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{
                    flex: 1, background: "#070d14", border: "1px solid #1e3a5f",
                    color: "#d1d5db", padding: "10px 12px",
                    borderRadius: 8, fontSize: 12, fontFamily: "monospace",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {walletAddr}
                  </div>
                  <button onClick={copy} style={{
                    background: "#6d28d9", color: "#fff", padding: "10px 18px",
                    borderRadius: 8, border: "none", cursor: "pointer",
                    fontWeight: 700, fontSize: 13, whiteSpace: "nowrap", flexShrink: 0,
                  }}>
                    {copied ? "✓ Copiado" : "Copy"}
                  </button>
                </div>
              </div>

              {/* Spinner + status */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginTop: 18 }}>
                <div style={{
                  width: 34, height: 34,
                  border: "3px solid #1e3a5f",
                  borderTop: `3px solid #22c55e`,
                  borderRadius: "50%",
                  animation: "spin 1s linear infinite",
                }} />
                <div style={{ fontSize: 12, color: "#4b5563" }}>Verificando blockchain cada 30 segundos...</div>
              </div>
            </>
          )}
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <PendingPanelCard title="⚠ Disclaimer" accent>
            Enviá <strong style={{ color: "#fbbf24" }}>exactamente</strong> el monto mostrado. Los centavos únicos identifican tu pago. No redondees ni modifiques el monto.
          </PendingPanelCard>

          <PendingPanelCard title={`⏱ USDT (${network})`}>
            El pago debe realizarse en USDT por la red <strong style={{ color: "#e5e7eb" }}>{network === "TRC20" ? "TRON (TRC20)" : "BNB Smart Chain (BEP20)"}</strong>. No se aceptan otras monedas ni redes.
          </PendingPanelCard>

          <PendingPanelCard title="ℹ Nota">
            Tenés <strong style={{ color: "#e5e7eb" }}>1 hora</strong> para completar el pago. El sistema verifica automáticamente. Si el pago no aparece en 30 min, contactá soporte.
          </PendingPanelCard>
        </div>
      </div>

      {/* Cancel button */}
      {payStatus === "polling" && (
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <button onClick={() => setShowCancelConfirm(true)} style={{
            background: "transparent", color: "#6b7280",
            border: "1px solid #374151", padding: "10px 28px",
            borderRadius: 8, cursor: "pointer", fontSize: 14,
          }}>
            Cancelar orden
          </button>
        </div>
      )}

      {/* Cancel confirmation dialog */}
      {showCancelConfirm && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 1200,
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            background: "#0d1b2a", border: "1px solid #374151",
            borderRadius: 16, padding: "32px 28px", maxWidth: 360, width: "90%",
            textAlign: "center", boxShadow: "0 25px 60px rgba(0,0,0,0.7)",
          }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
            <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginBottom: 10 }}>
              ¿Cancelar la orden?
            </div>
            <div style={{ fontSize: 13, color: "#9ca3af", lineHeight: 1.6, marginBottom: 24 }}>
              Si cancelás, la orden <strong style={{ color: "#fbbf24" }}>#{order.id?.slice(-8)}</strong> quedará rechazada y no podrás recuperarla.
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={() => setShowCancelConfirm(false)}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  border: "1px solid #374151", background: "#1f2937",
                  color: "#e5e7eb", fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                No, volver
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                style={{
                  flex: 1, padding: "11px 0", borderRadius: 9,
                  border: "none", background: "#ef4444",
                  color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
                }}
              >
                {cancelling ? "Cancelando..." : "Sí, cancelar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── GLOBAL PENDING ORDER WIDGET (persists across navigation and F5) ─────────
const GlobalPendingWidget = ({ order, wallets, onExpand, onClear }) => {
  const [payStatus, setPayStatus] = useState("polling");
  const [timeLeft, setTimeLeft] = useState(() =>
    order?.expiresAt ? Math.max(0, Math.floor((new Date(order.expiresAt) - Date.now()) / 1000)) : 3600
  );
  const walletColor = wallets?.[order?.network]?.color || "#f0a500";
  const widgetColor = payStatus === "paid" ? "#22c55e" : payStatus === "expired" ? "#ef4444" : walletColor;

  useEffect(() => {
    if (!order?.expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.floor((new Date(order.expiresAt) - Date.now()) / 1000));
      setTimeLeft(left);
      if (left === 0) setPayStatus(s => s === "polling" ? "expired" : s);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [order?.expiresAt]);

  useEffect(() => {
    if (!order?.id || payStatus !== "polling") return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}/check-payment`);
        const data = await res.json();
        if (data.paid) setPayStatus("paid");
        else if (data.expired) setPayStatus("expired");
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [order?.id, payStatus]);

  useEffect(() => {
    if (payStatus === "paid") setTimeout(onClear, 3000);
  }, [payStatus]);

  const mins = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const secs = String(timeLeft % 60).padStart(2, "0");

  return (
    <div
      onClick={() => payStatus === "polling" && onExpand()}
      style={{
        position: "fixed", bottom: 28, right: 28, zIndex: 1200,
        background: "#0f1e2e", border: `2px solid ${widgetColor}`,
        borderRadius: 18, padding: "16px 22px", cursor: payStatus === "polling" ? "pointer" : "default",
        display: "flex", flexDirection: "column", gap: 10,
        boxShadow: `0 6px 32px ${widgetColor}55`, minWidth: 280,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ background: widgetColor + "22", color: widgetColor, borderRadius: 8, padding: "4px 11px", fontSize: 13, fontWeight: 800 }}>{order?.network}</span>
        {payStatus === "polling" && (
          <div style={{ width: 18, height: 18, border: "2.5px solid #1e3a5f", borderTop: `2.5px solid ${walletColor}`, borderRadius: "50%", animation: "spin 1s linear infinite", flexShrink: 0 }} />
        )}
        <button onClick={e => { e.stopPropagation(); onClear(); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
      </div>
      {payStatus === "paid" ? (
        <div style={{ color: "#22c55e", fontWeight: 800, fontSize: 16 }}>✅ Pago confirmado</div>
      ) : payStatus === "expired" ? (
        <div style={{ color: "#ef4444", fontWeight: 700, fontSize: 15 }}>✕ Orden expirada</div>
      ) : (
        <>
          <div style={{ color: "#e2e8f0", fontSize: 15, fontWeight: 700 }}>💳 Pago pendiente</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ color: "#94a3b8", fontSize: 13 }}>Tiempo restante</span>
            <span style={{ color: timeLeft < 300 ? "#ef4444" : "#f59e0b", fontSize: 15, fontWeight: 800, fontFamily: "monospace" }}>{mins}:{secs}</span>
          </div>
          <div style={{ color: "#64748b", fontSize: 12, marginTop: 2 }}>Tocá para ver instrucciones →</div>
        </>
      )}
    </div>
  );
};

// ─── PAYMENT MODAL (step 1: select network + proceed) ────────────────────────
const PaymentModal = ({ cart, user, coupon, finalTotal, onClose, onSuccess, onOrderUpdate, onOrderPending, wallets: W = WALLETS }) => {
  const [network, setNetwork] = useState(null);
  const [creating, setCreating] = useState(false);
  const [order, setOrder] = useState(null);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discountAmt = coupon ? subtotal * (coupon.discount / 100) : 0;

  const proceed = async () => {
    if (!network) return;
    setCreating(true);
    try {
      if (coupon) {
        await fetch("/api/coupons/use", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: coupon.code }),
        }).catch(() => {});
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost || 0, qty: i.qty, productId: i.id || null })),
          subtotal, discount: discountAmt,
          coupon: coupon?.code || null,
          total: finalTotal,
          network,
        }),
      });
      const newOrder = await res.json();
      setOrder(newOrder);
      onOrderPending?.(newOrder);
    } catch {
      alert("Error al crear la orden. Intentá de nuevo.");
    } finally {
      setCreating(false);
    }
  };

  // Once order is created, show PaymentPendingModal full-screen
  if (order) return (
    <PaymentPendingModal
      order={order}
      walletAddr={W[network].addr}
      walletColor={W[network].color}
      onSuccess={onSuccess}
      onCancel={onClose}
      onMinimize={onClose}
      onCancelled={(cancelledOrder) => {
        if (onOrderUpdate) onOrderUpdate(cancelledOrder);
        onClose();
      }}
    />
  );

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

        <div style={{ fontFamily: "Syne", fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Selecciona la red:</div>
        <div className="network-selector">
          {Object.entries(W).map(([key, w]) => (
            <div key={key} className={`network-card ${network === key ? "selected" : ""}`} onClick={() => setNetwork(key)}>
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

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            className="btn btn-usdt"
            style={{ flex: 1, justifyContent: "center", opacity: (!network || creating) ? 0.5 : 1 }}
            disabled={!network || creating}
            onClick={proceed}
          >
            {creating ? "⏳ Generando orden..." : "✓ Proceder al pago →"}
          </button>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

// ─── SUCCESS MODAL ────────────────────────────────────────────────────────────
const SuccessModal = ({ order, onClose }) => {
  const paid = order?.status === "paid";
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 54, marginBottom: 12 }}>{paid ? "🎉" : "✅"}</div>
        <div className="modal-title">{paid ? "¡Pago confirmado!" : "¡Pago enviado!"}</div>
        <div style={{ fontSize: 14, color: "var(--muted)", marginBottom: 16, lineHeight: 1.6 }}>
          Tu orden <strong style={{ color: "var(--text)" }}>#{order.id?.slice(-8)}</strong>{" "}
          {paid
            ? <span>fue <strong style={{ color: "var(--green,#22c55e)" }}>verificada automáticamente</strong> en la blockchain.</span>
            : <>fue registrada.<br />Quedó en estado <span className="status-pending" style={{ display: "inline-flex" }}>⏳ Pendiente</span> mientras verificamos el pago.</>
          }
        </div>
        <div style={{ background: paid ? "rgba(34,197,94,0.08)" : "var(--amber-light)", border: `1px solid ${paid ? "var(--green,#22c55e)" : "var(--amber-border)"}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: paid ? "var(--green,#22c55e)" : "var(--amber)", textAlign: "left" }}>
          <strong>Red:</strong> {order.network} · <strong>Total:</strong> {fmtUSDT(order.uniqueAmount || order.total)}<br />
          {order.txHash && <><strong>TX:</strong> <code style={{ fontSize: 11 }}>{order.txHash.slice(0, 30)}...</code></>}
        </div>
        <button className="btn btn-primary btn-full" onClick={onClose}>Ver mis órdenes</button>
      </div>
    </div>
  );
};

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────
const CheckoutPage = ({ cart, onQty, onRemove, user, onGoShop, onSuccess, onShowAuth, onOrderPending, wallets: W = WALLETS }) => {
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponState, setCouponState] = useState("idle");
  const [couponError, setCouponError] = useState("");
  const [network, setNetwork] = useState("TRC20");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null); // order after creation
  const [showPendingModal, setShowPendingModal] = useState(false); // show full-screen pending
  const [payStatus, setPayStatus] = useState("polling"); // polling | paid | expired

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
          items: cart.map(i => ({ name: i.name, price: i.price, cost: i.cost || 0, qty: i.qty, productId: i.id || null })),
          subtotal, discount: discountAmt,
          coupon: appliedCoupon?.code || null,
          total, network,
        }),
      });
      const order = await res.json();
      setCreatedOrder(order);
      setShowPendingModal(true);
      onSuccess(order);
      onOrderPending?.(order);
    } catch { alert("Error al procesar. Intentá de nuevo."); }
    finally { setSubmitting(false); }
  };

  // Background polling when modal is closed
  useEffect(() => {
    if (!createdOrder?.id || payStatus !== "polling" || showPendingModal) return;
    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${createdOrder.id}/check-payment`);
        const data = await res.json();
        if (data.paid) setPayStatus("paid");
        else if (data.expired) setPayStatus("expired");
      } catch {}
    };
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [createdOrder?.id, payStatus, showPendingModal]);

  // Show full-screen payment pending modal
  if (createdOrder && showPendingModal) return (
    <PaymentPendingModal
      order={createdOrder}
      walletAddr={wallet.addr}
      walletColor={wallet.color}
      onSuccess={(paidOrder) => {
        setPayStatus("paid");
        setShowPendingModal(false);
      }}
      onCancel={() => { setShowPendingModal(false); setCreatedOrder(null); onGoShop(); }}
      onMinimize={() => { setShowPendingModal(false); setCreatedOrder(null); onGoShop(); }}
      onCancelled={(cancelledOrder) => {
        setCreatedOrder(cancelledOrder);
        setPayStatus("cancelled");
        setShowPendingModal(false);
        onSuccess(cancelledOrder); // update parent orders list
      }}
    />
  );

  // "Orden pendiente" card — shown after modal is closed
  if (createdOrder) return (
    <div className="checkout-page">
      <div className="checkout-card" style={{ maxWidth: 500, margin: "50px auto", textAlign: "center", padding: "40px 30px" }}>
        {payStatus === "paid" ? (
          <>
            <div style={{ fontSize: 60, marginBottom: 14 }}>🎉</div>
            <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 800, marginBottom: 10 }}>¡Pago confirmado!</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>
              Tu orden <strong style={{ color: "var(--text)" }}>#{createdOrder.id?.slice(-8)}</strong> fue verificada automáticamente en la blockchain.
            </div>
            <button className="btn btn-primary btn-full" onClick={onGoShop}>← Volver a la tienda</button>
          </>
        ) : payStatus === "expired" ? (
          <>
            <div style={{ fontSize: 60, marginBottom: 14 }}>⏰</div>
            <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginBottom: 10, color: "var(--red,#ef4444)" }}>Orden vencida</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>El tiempo expiró. Podés volver a la tienda y crear una nueva orden.</div>
            <button className="btn btn-primary btn-full" onClick={onGoShop}>← Volver a la tienda</button>
          </>
        ) : payStatus === "cancelled" ? (
          <>
            <div style={{ fontSize: 60, marginBottom: 14 }}>✕</div>
            <div style={{ fontFamily: "Syne", fontSize: 18, fontWeight: 800, marginBottom: 10, color: "var(--red,#ef4444)" }}>Orden cancelada</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 24 }}>La orden <strong style={{ color: "var(--text)" }}>#{createdOrder.id?.slice(-8)}</strong> fue cancelada. Podés crear una nueva.</div>
            <button className="btn btn-primary btn-full" onClick={onGoShop}>← Volver a la tienda</button>
          </>
        ) : (
          <>
            <div style={{ fontSize: 56, marginBottom: 14 }}>⏳</div>
            <div style={{ fontFamily: "Syne", fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Orden pendiente de pago</div>
            <div style={{ fontSize: 14, color: "var(--muted)", lineHeight: 1.7, marginBottom: 6 }}>
              Orden <strong style={{ color: "var(--text)" }}>#{createdOrder.id?.slice(-8)}</strong> creada.
            </div>
            <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 700, marginBottom: 24 }}>
              Enviá exactamente{" "}
              <span style={{ color: "var(--red,#ef4444)" }}>{createdOrder.uniqueAmount?.toFixed(2)} USDT</span>{" "}
              por {network}.
            </div>
            <button
              className="btn btn-usdt btn-full"
              style={{ justifyContent: "center", marginBottom: 10 }}
              onClick={() => setShowPendingModal(true)}
            >
              Ver instrucciones de pago →
            </button>
            <button className="btn btn-outline btn-full" onClick={onGoShop}>← Volver a la tienda</button>
          </>
        )}
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

            {/* Agree + Proceder */}
            <div className="co-agree">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
              <span>Entiendo que el pago en USDT es <strong>irreversible</strong> y que el acceso al producto se entrega una vez que se confirme el pago en la blockchain.</span>
            </div>

            {!user ? (
              <button className="co-submit" onClick={onShowAuth}>🔐 Iniciá sesión para continuar</button>
            ) : (
              <button
                className="btn btn-usdt btn-full"
                style={{ justifyContent: "center", fontSize: 15, fontWeight: 700, padding: "13px 0", margin: "0 20px 20px", width: "calc(100% - 40px)" }}
                disabled={!agreed || submitting}
                onClick={handleSubmit}
              >
                {submitting ? "Creando orden..." : "Proceder al pago →"}
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
const ShopPage = ({ cart, onAddToCart, onBuyNow, onCartOpen, liked, onToggleLike, products, onProductClick, thumbs }) => {
  const [activeCat, setActiveCat] = useState("all");
  const getQty = id => cart.find(i => i.id === id)?.qty || 0;
  const getThumb = (cat) => cat === "ads-account" ? (thumbs?.ads || "/facebook-verificado.png") : (thumbs?.bm || "/facebook-verificado.png");
  const CATS = [
    { key: "ads-account", label: "Cuentas para Publicidad" },
    { key: "bm", label: "BMs Verificadas" },
  ];
  const visibleCats = activeCat === "all" ? CATS : CATS.filter(c => c.key === activeCat);
  const sortProds = arr => [...arr].sort((a, b) => {
    const effA = a.badgeDiscount > 0 ? a.price * (1 - a.badgeDiscount / 100) : a.price;
    const effB = b.badgeDiscount > 0 ? b.price * (1 - b.badgeDiscount / 100) : b.price;
    return effA - effB;
  });
  const totalVisible = visibleCats.reduce((acc, c) => acc + products.filter(p => (p.category || "bm") === c.key).length, 0);
  return (
    <>
      <div className="hero">
        <img src="/Banner.png" alt="BM Verificada" className="hero-banner-img" />
        <img src="/logo.png" alt="BM Verificada" className="hero-logo" />
        <h1>BM <span>Verificada</span></h1>
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
          <div className="shop-count">{totalVisible} productos</div>
        </div>
        <div className="cat-filter">
          <button className={`cat-chip${activeCat === "all" ? " active" : ""}`} onClick={() => setActiveCat("all")}>Todo</button>
          {CATS.map(c => (
            <button key={c.key} className={`cat-chip${activeCat === c.key ? " active" : ""}`} onClick={() => setActiveCat(c.key)}>{c.label}</button>
          ))}
        </div>
        {products.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px", color: "var(--muted)" }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🛍</div>
            <div style={{ fontWeight: 600 }}>Cargando productos...</div>
          </div>
        )}
        {visibleCats.map(({ key, label }) => {
          const catProducts = sortProds(products.filter(p => (p.category || "bm") === key));
          if (catProducts.length === 0) return null;
          return (
            <div key={key} style={{ marginBottom: 28 }}>
              <div className="cat-section-title">{label}</div>
              <div className="product-list">
                {catProducts.map(p => (
                  <div key={p.id} className="product-row" onClick={() => onProductClick && onProductClick(p)}>
                    <div className="prod-thumb">
                      <div className="prod-thumb-inner"><img src={getThumb(p.category)} alt="" /></div>
                      <div className="verified-badge">✓</div>
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
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="info-section">
        <h2>¿Qué es un Facebook Business Manager verificado?</h2>
        <p>Un Facebook Business Manager verificado es una cuenta corporativa en el sistema de Meta, confirmada con documentos de empresa y validada por Meta. Estas cuentas tienen derechos extendidos en la gestión de anuncios y acceso a funciones no disponibles para usuarios no verificados.</p>
        <p>En esencia, es un "pasaporte corporativo" en el ecosistema de Meta, que garantiza que la empresa opera de forma legítima y puede usar herramientas publicitarias sin restricciones relacionadas con la desconfianza del sistema.</p>

        <h3>¿Por qué necesitás un Business Manager verificado para publicidad?</h3>
        <p>Un Business Manager verificado es necesario para acceder de forma estable a las herramientas publicitarias, conectar métodos de pago y gestionar páginas de clientes de manera legal. Las empresas lo usan para reducir la probabilidad de baneos, gestionar múltiples cuentas publicitarias y aumentar la confianza de Meta. Sin verificación, muchas funciones están limitadas o bloqueadas.</p>

        <h3>¿Cuáles son las ventajas de un Business Manager verificado?</h3>
        <p>Un Business Manager verificado da acceso a métodos de promoción avanzados, formatos publicitarios adicionales y mayor confianza de los algoritmos de Meta. Las principales ventajas incluyen:</p>
        <ul>
          <li>Capacidad de crear y escalar múltiples cuentas publicitarias.</li>
          <li>Conexión de distintos métodos de pago.</li>
          <li>Gestión segura de páginas y dominios.</li>
          <li>Menor probabilidad de baneos.</li>
        </ul>
        <p>La contrapartida: el proceso de verificación lleva tiempo y requiere documentos oficiales, mientras que comprar cuentas ya verificadas implica riesgos legales.</p>

        <h3>¿Cómo difiere un Business Manager verificado de uno regular?</h3>
        <p>Un BM regular permite gestionar páginas y anuncios pero tiene límites de confianza y de cuentas publicitarias. El verificado elimina esas barreras. Elegir un BM regular ofrece configuración rápida pero sacrifica flexibilidad y seguridad. Una cuenta verificada provee esos beneficios pero exige verificación formal o la compra de una cuenta ya verificada.</p>

        <h3>¿Cómo ayudan los BM verificados contra los baneos?</h3>
        <p>Las cuentas verificadas tienen menos probabilidad de ser restringidas automáticamente y pueden recuperarse más rápido durante revisiones de seguridad. Sin embargo, no son protección absoluta: violar las políticas de Meta puede igual derivar en baneos. Un BM verificado reduce los riesgos pero no los elimina.</p>

        <h3>¿Qué métodos alternativos o grises existen para Business Managers?</h3>
        <p>La industria utiliza prácticas como la compra de cuentas verificadas listas para usar, el alquiler o el uso de servicios intermediarios. La contrapartida: el acceso rápido a funciones extendidas tiene el costo de violar las políticas de Meta, lo que podría derivar en pérdida de la cuenta y recursos desperdiciados.</p>

        <h3>¿Cuáles son los riesgos de comprar o alquilar un BM verificado?</h3>
        <p>Los principales riesgos incluyen:</p>
        <ul>
          <li>Baneos permanentes sin reembolso.</li>
          <li>Pérdida de acceso si se revoca la titularidad.</li>
          <li>Consecuencias legales por usar datos de terceros.</li>
        </ul>
        <p>Por eso, la velocidad y comodidad deben sopesarse contra el riesgo de perder fondos o enfrentar problemas de cumplimiento.</p>

        <h3>¿A quién están dirigidos los Business Managers verificados?</h3>
        <p>Los públicos clave incluyen:</p>
        <ul>
          <li>Agencias de marketing digital.</li>
          <li>Dueños de negocios de e-commerce.</li>
          <li>Servicios que trabajan con productos white-hat y gray-hat.</li>
          <li>Especialistas individuales en arbitraje de tráfico.</li>
        </ul>
        <p>Cada grupo utiliza cuentas verificadas para aumentar la eficiencia publicitaria y reducir las barreras de escalado.</p>

        <h3>¿Cuáles son las alternativas a los Business Managers verificados?</h3>
        <p>Las alternativas incluyen:</p>
        <ul>
          <li>Auto-verificación a través de Meta Business Verification.</li>
          <li>Cuentas de socios proporcionadas por agencias oficiales.</li>
          <li>Plataformas de terceros que ofrecen acceso publicitario.</li>
        </ul>
        <p>La contrapartida: la verificación oficial requiere tiempo y documentación, las soluciones de agencia vienen con restricciones, y comprar cuentas conlleva riesgos de baneo.</p>

        <h3>¿Cómo usar correctamente un BM verificado para escalar?</h3>
        <p>El uso correcto incluye distribuir presupuestos entre múltiples cuentas publicitarias, configurar dominios y píxeles, y mantener un perfil publicitario white-hat. Es crucial combinar el poder de una cuenta verificada con las reglas de Meta: incluso la cuenta más sólida no puede proteger contra penalizaciones por contenido prohibido.</p>

        <p style={{ marginTop: 20, padding: "14px 18px", background: "var(--surface)", borderRadius: 10, borderLeft: "3px solid #D4AF37", fontSize: 13, color: "var(--text)" }}>
          <strong>Potenciá tu estructura de Meta Ads:</strong> BMs ilimitados, cuentas publicitarias con límite de $250 y Fan Pages crean una base sólida para publicidad estable.
        </p>

        <hr className="info-divider" />

        <h2>Tabla comparativa: BM Regular vs BM Verificado vs Alternativas</h2>
        <div style={{ overflowX: "auto" }}>
          <table className="info-table">
            <thead>
              <tr>
                <th>Característica</th>
                <th>BM Regular</th>
                <th>BM Verificado</th>
                <th>Alternativas (alquiler, agencias)</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Nivel de confianza Meta</td><td>Bajo, alto riesgo de baneo</td><td>Alto, riesgo reducido</td><td>Medio, depende del proveedor</td></tr>
              <tr><td>Límite de cuentas publicitarias</td><td>Limitado (1–2)</td><td>Extendido (5+ según nivel)</td><td>Variable según contrato</td></tr>
              <tr><td>Métodos de pago</td><td>Opciones limitadas</td><td>Soporte completo</td><td>Frecuentemente restringido</td></tr>
              <tr><td>Proceso de adquisición</td><td>Gratis, sin documentos</td><td>Requiere documentos o compra</td><td>Rápido, pero legalmente riesgoso</td></tr>
              <tr><td>Riesgo de baneo</td><td>Alto para anunciantes activos</td><td>Reducido, no eliminado</td><td>Medio-alto según la fuente</td></tr>
              <tr><td>Seguridad legal</td><td>Seguro para proyectos white-hat</td><td>Seguro si verificado oficialmente</td><td>Riesgoso, puede violar políticas Meta</td></tr>
              <tr><td>Costo</td><td>Gratis</td><td>Alto (verificación o compra)</td><td>Variable (alquiler/tarifas)</td></tr>
              <tr><td>Ideal para</td><td>Pequeñas empresas, pruebas</td><td>Agencias, e-commerce, arbitraje</td><td>Quienes buscan acceso rápido</td></tr>
            </tbody>
          </table>
        </div>

        <hr className="info-divider" />

        <h2>Preguntas frecuentes (FAQ)</h2>
        <div className="info-faq">
          {[
            ["¿Qué brinda la verificación de Facebook Business Manager?", "Desbloquea capacidades publicitarias avanzadas, reduce el riesgo de baneos y aumenta la confianza de Meta en el negocio."],
            ["¿Puedo comprar un Business Manager verificado listo para usar?", "Sí, este tipo de cuentas se venden en plataformas especializadas como BM Verificada, aunque su uso conlleva riesgos legales y técnicos."],
            ["¿Qué riesgos tiene comprar una cuenta verificada?", "Pérdida de acceso, baneos permanentes sin reembolso y posibles problemas legales por violar las reglas de Meta."],
            ["¿Quién necesita un Business Manager verificado?", "Son valiosos para agencias, dueños de e-commerce, especialistas en arbitraje y negocios que trabajan con anuncios de Facebook."],
            ["¿Puedo verificar mi Business Manager por mi cuenta?", "Sí, Meta permite a las empresas enviar documentos oficiales y completar el proceso de verificación empresarial."],
            ["¿Cuántas cuentas publicitarias puede crear un BM verificado?", "Las cuentas verificadas permiten significativamente más cuentas publicitarias que los BM regulares, facilitando el escalado."],
            ["¿La verificación previene los baneos?", "Reduce la probabilidad, pero no garantiza inmunidad si se violan las políticas de Meta."],
            ["¿Cuáles son las alternativas a comprar un BM verificado?", "Las alternativas incluyen la auto-verificación, el uso de cuentas proporcionadas por agencias o soluciones de publicidad asociadas."],
            ["¿Cómo se debe usar correctamente un BM verificado?", "Para distribución de presupuestos, configuración de dominios y píxeles, y cumplimiento de las reglas publicitarias de Meta."],
            ["¿Dónde puedo comprar un Business Manager verificado?", "En marketplaces especializados como BM Verificada, aunque los compradores deben estar al tanto de los riesgos asociados."],
          ].map(([q, a]) => (
            <div key={q} className="info-faq-item">
              <div className="info-faq-q">{q}</div>
              <div className="info-faq-a">{a}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ─── USER ACCOUNT ─────────────────────────────────────────────────────────────
const UserAccount = ({ user, userOrders, liked, onToggleLike, onGoShop, products, wallets: W = WALLETS, onOrderUpdate }) => {
  const [tab, setTab] = useState(() => {
    try { return sessionStorage.getItem("account_tab") || "orders"; } catch { return "orders"; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("account_tab", tab); } catch {}
  }, [tab]);
  const [reopenOrder, setReopenOrder] = useState(null); // pending order to reopen modal
  const myOrders = userOrders; // la API ya filtra por usuario
  const favProducts = products.filter(p => liked[p.id]);

  // ── Change password state ──
  const [pwForm, setPwForm] = useState({ current: "", newPw: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState(null); // { text, ok }
  const [pwLoading, setPwLoading] = useState(false);
  const setPw = k => e => setPwForm(p => ({ ...p, [k]: e.target.value }));

  // ── Profile + preferences state ──
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [nameMsg, setNameMsg] = useState(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [newsletter, setNewsletter] = useState(true);
  const [stockUpdates, setStockUpdates] = useState(true);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefMsg, setPrefMsg] = useState(null);
  // ── 2FA state ──
  const [tfaEnabled, setTfaEnabled] = useState(false);
  const [tfaStep, setTfaStep] = useState(null); // null | "setup" | "disable"
  const [tfaQr, setTfaQr] = useState("");
  const [tfaSecret, setTfaSecret] = useState("");
  const [tfaCode, setTfaCode] = useState("");
  const [tfaMsg, setTfaMsg] = useState(null);
  const [tfaLoading, setTfaLoading] = useState(false);

  useEffect(() => {
    if (tab !== "settings" || profileLoaded) return;
    fetch("/api/user/profile")
      .then(r => r.json())
      .then(d => {
        setProfileName(d.name || "");
        setNewsletter(!!d.newsletter);
        setStockUpdates(!!d.stockUpdates);
        setTfaEnabled(!!d.twoFactorEnabled);
        setProfileLoaded(true);
      })
      .catch(() => {});
  }, [tab, profileLoaded]);

  const handleSaveName = async () => {
    setNameMsg(null); setNameSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileName.trim() }),
      });
      const data = await res.json();
      if (res.ok) setNameMsg({ text: "¡Nombre actualizado!", ok: true });
      else setNameMsg({ text: data.error || "Error al guardar.", ok: false });
    } catch { setNameMsg({ text: "Error de red.", ok: false }); }
    finally { setNameSaving(false); }
  };

  const handleSavePrefs = async () => {
    setPrefMsg(null); setPrefSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsletter, stockUpdates }),
      });
      const data = await res.json();
      if (res.ok) setPrefMsg({ text: "¡Preferencias guardadas!", ok: true });
      else setPrefMsg({ text: data.error || "Error al guardar.", ok: false });
    } catch { setPrefMsg({ text: "Error de red.", ok: false }); }
    finally { setPrefSaving(false); }
  };

  const handleSetupTfa = async () => {
    setTfaMsg(null); setTfaLoading(true); setTfaCode("");
    try {
      const res = await fetch("/api/user/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (res.ok) { setTfaQr(data.qrImage); setTfaSecret(data.secret); setTfaStep("setup"); }
      else setTfaMsg({ text: data.error || "Error al configurar.", ok: false });
    } catch { setTfaMsg({ text: "Error de red.", ok: false }); }
    finally { setTfaLoading(false); }
  };

  const handleEnableTfa = async () => {
    setTfaMsg(null); setTfaLoading(true);
    try {
      const res = await fetch("/api/user/2fa/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tfaCode, secret: tfaSecret }),
      });
      const data = await res.json();
      if (res.ok) { setTfaEnabled(true); setTfaStep(null); setTfaCode(""); setTfaMsg({ text: "¡2FA activado con éxito!", ok: true }); }
      else setTfaMsg({ text: data.error || "Código incorrecto.", ok: false });
    } catch { setTfaMsg({ text: "Error de red.", ok: false }); }
    finally { setTfaLoading(false); }
  };

  const handleDisableTfa = async () => {
    setTfaMsg(null); setTfaLoading(true);
    try {
      const res = await fetch("/api/user/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: tfaCode }),
      });
      const data = await res.json();
      if (res.ok) { setTfaEnabled(false); setTfaStep(null); setTfaCode(""); setTfaMsg({ text: "2FA desactivado.", ok: true }); }
      else setTfaMsg({ text: data.error || "Código incorrecto.", ok: false });
    } catch { setTfaMsg({ text: "Error de red.", ok: false }); }
    finally { setTfaLoading(false); }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) return setPwMsg({ text: "Completá todos los campos.", ok: false });
    if (pwForm.newPw !== pwForm.confirm) return setPwMsg({ text: "Las contraseñas nuevas no coinciden.", ok: false });
    if (pwForm.newPw.length < 6) return setPwMsg({ text: "Mínimo 6 caracteres.", ok: false });
    setPwLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: pwForm.current, newPassword: pwForm.newPw }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg({ text: "¡Contraseña actualizada con éxito!", ok: true });
        setPwForm({ current: "", newPw: "", confirm: "" });
      } else {
        setPwMsg({ text: data.error || "Error al cambiar la contraseña.", ok: false });
      }
    } catch {
      setPwMsg({ text: "Error de red.", ok: false });
    } finally {
      setPwLoading(false);
    }
  };

  const downloadDelivery = (content, orderId) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pedido-${orderId.slice(-8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const displayName = user.name || user.email || "Usuario";
  return (
    <>
    {reopenOrder && (
      <PaymentPendingModal
        order={reopenOrder}
        walletAddr={W[reopenOrder.network]?.addr || ""}
        walletColor={W[reopenOrder.network]?.color || "#26a17b"}
        onSuccess={(paidOrder) => {
          setReopenOrder(null);
          if (onOrderUpdate) onOrderUpdate(paidOrder);
        }}
        onCancel={() => setReopenOrder(null)}
        onCancelled={(cancelledOrder) => {
          setReopenOrder(null);
          if (onOrderUpdate) onOrderUpdate(cancelledOrder);
        }}
      />
    )}
    <div className="page">
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 20 }}>
        <div className="avatar-lg">{displayName[0].toUpperCase()}</div>
        <div><div style={{ fontFamily: "Syne", fontSize: 19, fontWeight: 800 }}>Hola, {displayName.split(" ")[0]} 👋</div><div style={{ fontSize: 13, color: "var(--muted)" }}>{user.email}</div></div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[["orders", "📦 Mis órdenes"], ["favorites", `❤️ Favoritos${favProducts.length > 0 ? ` (${favProducts.length})` : ""}`], ["settings", "⚙️ Ajustes"]].map(([id, label]) => (
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
                  <thead><tr><th>ID</th><th>Producto(s)</th><th>Red</th><th>Total</th><th>Estado</th><th>Pedido</th><th>Fecha</th></tr></thead>
                  <tbody>
                    {myOrders.slice().reverse().map(o => {
                      const isExpired = o.expiresAt && new Date() > new Date(o.expiresAt);
                      const canPay = o.status === "pending" && !isExpired;
                      return (
                      <tr key={o.id}>
                        <td><code style={{ fontSize: 11, color: "var(--purple)" }}>{o.id}</code></td>
                        <td style={{ maxWidth: 200, fontSize: 12 }}>{o.items.map(i => i.name).join(", ")}</td>
                        <td><span className="tag-network">{o.network}</span></td>
                        <td><strong style={{ color: "var(--usdt)" }}>{fmtUSDT(o.total)}</strong></td>
                        <td>
                          <StatusPill status={isExpired && o.status === "pending" ? "cancelled" : o.status} />
                          {canPay && (
                            <button
                              onClick={() => setReopenOrder(o)}
                              style={{ marginLeft: 8, padding: "2px 10px", borderRadius: 6, border: "1.5px solid var(--usdt)", background: "transparent", color: "var(--usdt)", fontSize: 11, cursor: "pointer", fontWeight: 700 }}
                            >
                              Pagar →
                            </button>
                          )}
                        </td>
                        <td>
                          {o.deliveryContent
                            ? <button className="deliver-ready" onClick={() => downloadDelivery(o.deliveryContent, o.id)}>⬇️ Descargar pedido</button>
                            : (o.status === "cancelled" || (isExpired && o.status === "pending"))
                              ? <span style={{ fontSize: 11, color: "#ef4444", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", padding: "3px 9px", borderRadius: 6, fontWeight: 600, whiteSpace: "nowrap" }}>✕ Cancelado</span>
                              : <span className="deliver-pending">⏳ Pendiente</span>
                          }
                        </td>
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

      {/* ── AJUSTES ── */}
      {tab === "settings" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>

          {/* ── Perfil ── */}
          <div className="card">
            <div className="card-title">👤 Perfil</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" type="text" placeholder="Tu nombre" value={profileName} onChange={e => setProfileName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSaveName()} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={user.email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
              </div>
              {nameMsg && (
                <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, background: nameMsg.ok ? "#F0FDF4" : "#FEF2F2", color: nameMsg.ok ? "#15803D" : "#B91C1C", border: `1px solid ${nameMsg.ok ? "#BBF7D0" : "#FECACA"}` }}>
                  {nameMsg.ok ? "✅ " : "⚠️ "}{nameMsg.text}
                </div>
              )}
              <button className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: 180 }} onClick={handleSaveName} disabled={nameSaving}>
                {nameSaving ? "Guardando..." : "Guardar nombre"}
              </button>
            </div>
          </div>

          {/* ── Cambiar contraseña ── */}
          <div className="card">
            <div className="card-title">🔒 Cambiar contraseña</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
              <div className="form-group">
                <label className="form-label">Contraseña actual</label>
                <input className="form-input" type="password" placeholder="••••••••" value={pwForm.current} onChange={setPw("current")} />
              </div>
              <div className="form-group">
                <label className="form-label">Nueva contraseña</label>
                <input className="form-input" type="password" placeholder="••••••••" value={pwForm.newPw} onChange={setPw("newPw")} />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar nueva contraseña</label>
                <input className="form-input" type="password" placeholder="••••••••" value={pwForm.confirm} onChange={setPw("confirm")} onKeyDown={e => e.key === "Enter" && handleChangePassword()} />
              </div>
              {pwMsg && (
                <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, background: pwMsg.ok ? "#F0FDF4" : "#FEF2F2", color: pwMsg.ok ? "#15803D" : "#B91C1C", border: `1px solid ${pwMsg.ok ? "#BBF7D0" : "#FECACA"}` }}>
                  {pwMsg.ok ? "✅ " : "⚠️ "}{pwMsg.text}
                </div>
              )}
              <button className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: 200 }} onClick={handleChangePassword} disabled={pwLoading}>
                {pwLoading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </div>
          </div>

          {/* ── 2FA ── */}
          <div className="card">
            <div className="card-title">🔐 Verificación en dos pasos</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 14, lineHeight: 1.6 }}>
              Protegé tu cuenta con Google Authenticator u otra app compatible con TOTP.
              {tfaEnabled && <span style={{ marginLeft: 8, background: "#F0FDF4", color: "#15803D", border: "1px solid #BBF7D0", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>✅ Activado</span>}
              {!tfaEnabled && <span style={{ marginLeft: 8, background: "#FEF2F2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: 600 }}>Desactivado</span>}
            </div>

            {tfaMsg && (
              <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, background: tfaMsg.ok ? "#F0FDF4" : "#FEF2F2", color: tfaMsg.ok ? "#15803D" : "#B91C1C", border: `1px solid ${tfaMsg.ok ? "#BBF7D0" : "#FECACA"}`, marginBottom: 12 }}>
                {tfaMsg.ok ? "✅ " : "⚠️ "}{tfaMsg.text}
              </div>
            )}

            {/* Not yet in a step and 2FA is off — offer setup */}
            {!tfaEnabled && tfaStep === null && (
              <button className="btn btn-primary" style={{ minWidth: 200 }} onClick={handleSetupTfa} disabled={tfaLoading}>
                {tfaLoading ? "Cargando..." : "Activar 2FA"}
              </button>
            )}

            {/* Setup step: show QR + secret + code input */}
            {tfaStep === "setup" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.6 }}>
                  1. Abrí <strong>Google Authenticator</strong> (o cualquier app TOTP).<br />
                  2. Escaneá el código QR o ingresá la clave manualmente.<br />
                  3. Ingresá el código de 6 dígitos para confirmar.
                </div>
                {tfaQr && (
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <img src={tfaQr} alt="QR Code 2FA" style={{ width: 180, height: 180, borderRadius: 10, border: "2px solid var(--border)" }} />
                  </div>
                )}
                {tfaSecret && (
                  <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12 }}>
                    <div style={{ color: "var(--muted)", marginBottom: 4 }}>Clave manual:</div>
                    <code style={{ fontFamily: "monospace", letterSpacing: 2, wordBreak: "break-all" }}>{tfaSecret}</code>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Código de verificación</label>
                  <input className="form-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && tfaCode.length === 6 && handleEnableTfa()} autoFocus />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleEnableTfa} disabled={tfaLoading || tfaCode.length < 6}>
                    {tfaLoading ? "Verificando..." : "✓ Confirmar y activar"}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setTfaStep(null); setTfaCode(""); setTfaMsg(null); }}>Cancelar</button>
                </div>
              </div>
            )}

            {/* 2FA is on — offer disable */}
            {tfaEnabled && tfaStep === null && (
              <button className="btn btn-outline" style={{ minWidth: 200, color: "var(--red)", borderColor: "var(--red)" }} onClick={() => { setTfaStep("disable"); setTfaCode(""); setTfaMsg(null); }}>
                Desactivar 2FA
              </button>
            )}

            {/* Disable step: confirm with code */}
            {tfaStep === "disable" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ fontSize: 13, color: "var(--muted)" }}>Ingresá el código de tu app autenticadora para confirmar la desactivación.</div>
                <div className="form-group">
                  <label className="form-label">Código de verificación</label>
                  <input className="form-input" type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} placeholder="000000" value={tfaCode} onChange={e => setTfaCode(e.target.value.replace(/\D/g, ""))} onKeyDown={e => e.key === "Enter" && tfaCode.length === 6 && handleDisableTfa()} autoFocus />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button className="btn btn-primary" style={{ flex: 1, background: "var(--red)", borderColor: "var(--red)" }} onClick={handleDisableTfa} disabled={tfaLoading || tfaCode.length < 6}>
                    {tfaLoading ? "Verificando..." : "Desactivar"}
                  </button>
                  <button className="btn btn-outline" onClick={() => { setTfaStep(null); setTfaCode(""); setTfaMsg(null); }}>Cancelar</button>
                </div>
              </div>
            )}
          </div>

          {/* ── Preferencias ── */}
          <div className="card">
            <div className="card-title">🔔 Preferencias de notificaciones</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 4 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={newsletter} onChange={e => setNewsletter(e.target.checked)} style={{ width: 17, height: 17, accentColor: "var(--red)", cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Newsletter</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Recibí novedades, ofertas y actualizaciones del marketplace.</div>
                </div>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                <input type="checkbox" checked={stockUpdates} onChange={e => setStockUpdates(e.target.checked)} style={{ width: 17, height: 17, accentColor: "var(--red)", cursor: "pointer" }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>Actualizaciones de stock</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Recibí alertas cuando haya nuevos productos disponibles.</div>
                </div>
              </label>
              {prefMsg && (
                <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, background: prefMsg.ok ? "#F0FDF4" : "#FEF2F2", color: prefMsg.ok ? "#15803D" : "#B91C1C", border: `1px solid ${prefMsg.ok ? "#BBF7D0" : "#FECACA"}` }}>
                  {prefMsg.ok ? "✅ " : "⚠️ "}{prefMsg.text}
                </div>
              )}
              <button className="btn btn-primary" style={{ alignSelf: "flex-start", minWidth: 200 }} onClick={handleSavePrefs} disabled={prefSaving}>
                {prefSaving ? "Guardando..." : "Guardar preferencias"}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
    </>
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
  const [form, setForm] = useState({ name: "", details: "", price: "", cost: "", stock: "", sales: "", tiers: [], category: "bm" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [reviewProductId, setReviewProductId] = useState(null);
  const setF = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: "", details: "", price: "", cost: "", stock: "", sales: "", tiers: [], category: "bm" });
    setError("");
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({ name: p.name, details: p.details || "", price: p.price, cost: p.cost || "", stock: p.stock, sales: p.sales ?? "", tiers: Array.isArray(p.tiers) ? p.tiers.map(t => ({ qty: t.qty, price: t.price })) : [], category: p.category || "bm" });
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
      const body = { name: form.name, details: form.details, price: parseFloat(form.price), cost: parseFloat(form.cost) || 0, tiers: cleanTiers, stock: parseInt(form.stock) || 0, category: form.category || "bm", sales: parseInt(form.sales) || 0 };
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
            <div className="form-group">
              <label className="form-label">Ventas mostradas</label>
              <input className="form-input" type="number" min="0" value={form.sales} onChange={setF("sales")} placeholder="0" />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 3 }}>Número de ventas visible en la tienda (social proof)</div>
            </div>
            <div className="form-group">
              <label className="form-label">Categoría</label>
              <select className="form-input" value={form.category} onChange={setF("category")}>
                <option value="bm">BM Verificada</option>
                <option value="ads-account">Cuenta para Publicidad</option>
              </select>
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
              <tr><th>Nombre</th><th>Detalles</th><th>Categoría</th><th>Venta</th><th>Costo</th><th>Margen</th><th>Stock</th><th>Ventas</th><th>Badge %</th><th>Estado</th><th>Acciones</th></tr>
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
                  <td>
                    <span className="chip" style={{ background: (p.category || "bm") === "ads-account" ? "#EFF6FF" : "#F0FDF4", color: (p.category || "bm") === "ads-account" ? "#1D4ED8" : "#15803D", border: `1px solid ${(p.category || "bm") === "ads-account" ? "#BFDBFE" : "#BBF7D0"}`, whiteSpace: "nowrap", fontSize: 10 }}>
                      {(p.category || "bm") === "ads-account" ? "Cuentas Ads" : "BM Verificada"}
                    </span>
                  </td>
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
    if (!pct || pct < 1 || pct > 100) return;
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
          <input className="custom-percent" type="number" min="1" max="100" placeholder="35" value={custom} onChange={e => { setCustom(e.target.value); setSel(null); }} />
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
        <button className="btn btn-purple" onClick={generate} style={{ opacity: (!pct || pct < 1 || pct > 100) ? 0.5 : 1 }}>⚡ Generar cupón</button>
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
const AdminOrders = ({ orders, onConfirm, onDeliver }) => {
  const pending = orders.filter(o => o.status === "pending");
  const fileInputRef = useRef(null);
  const [targetId, setTargetId] = useState(null);
  const [uploading, setUploading] = useState(null);

  const triggerUpload = (orderId) => {
    setTargetId(orderId);
    fileInputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !targetId) return;
    setUploading(targetId);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await onDeliver(targetId, ev.target.result);
      setUploading(null);
      setTargetId(null);
      e.target.value = "";
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div>
      <input ref={fileInputRef} type="file" accept=".txt,text/plain" style={{ display: "none" }} onChange={handleFile} />
      <div className="page-title">📦 Gestión de Órdenes</div>
      {pending.length > 0 && (
        <div style={{ background: "var(--amber-light)", border: "1px solid var(--amber-border)", borderRadius: 12, padding: "12px 16px", marginBottom: 18, fontSize: 13, color: "var(--amber)", display: "flex", alignItems: "center", gap: 8 }}>
          ⏳ <strong>{pending.length} orden{pending.length > 1 ? "es" : ""} pendiente{pending.length > 1 ? "s" : ""} de confirmación de pago</strong>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Cliente</th><th>Productos</th><th>Red</th><th>Total</th><th>TX Hash</th><th>Estado</th><th>Acción</th><th>Entrega</th></tr></thead>
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
                  <td>
                    {uploading === o.id
                      ? <span style={{ fontSize: 12, color: "var(--muted)" }}>Subiendo…</span>
                      : o.deliveryContent
                        ? <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <span style={{ fontSize: 11, color: "#15803D", fontWeight: 700 }}>✅ Entregado</span>
                            <button className="deliver-btn" onClick={() => triggerUpload(o.id)}>↑ Reemplazar</button>
                          </div>
                        : <button className="deliver-btn" onClick={() => triggerUpload(o.id)}>📁 Subir .txt</button>
                    }
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
  const [range, setRange]         = useState("today");
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

// ─── THUMBNAIL MANAGER ────────────────────────────────────────────────────────
const ThumbnailManager = ({ onThumbsChange }) => {
  const [thumbs, setThumbs] = useState({ thumb_bm: null, thumb_ads: null });
  const [saving, setSaving] = useState({ thumb_bm: false, thumb_ads: false });
  const [saved, setSaved]   = useState({ thumb_bm: false, thumb_ads: false });

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => setThumbs({ thumb_bm: data.thumb_bm || null, thumb_ads: data.thumb_ads || null }))
      .catch(() => {});
  }, []);

  const handleUpload = (imgKey) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(p => ({ ...p, [imgKey]: true }));
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      try {
        const res = await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ [imgKey]: base64 }),
        });
        if (res.ok) {
          setThumbs(p => ({ ...p, [imgKey]: base64 }));
          setSaved(p => ({ ...p, [imgKey]: true }));
          if (onThumbsChange) onThumbsChange(imgKey, base64);
          setTimeout(() => setSaved(p => ({ ...p, [imgKey]: false })), 2500);
        }
      } catch {}
      setSaving(p => ({ ...p, [imgKey]: false }));
    };
    reader.readAsDataURL(file);
  };

  const cards = [
    { imgKey: "thumb_bm",   emoji: "🏢", label: "BMs Verificadas",         desc: "Miniatura para productos de Business Manager" },
    { imgKey: "thumb_ads",  emoji: "📢", label: "Cuentas para Publicidad",  desc: "Miniatura para productos de cuentas de ads" },
  ];

  return (
    <div>
      <div className="page-title">🖼 Miniaturas de Productos</div>
      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 24 }}>
        Estas imágenes aparecen como miniatura en la lista de productos de la tienda. Recomendado: 200×200 px, PNG o JPG.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {cards.map(({ imgKey, emoji, label, desc }) => (
          <div key={imgKey} className="card" style={{ textAlign: "center" }}>
            <div className="card-title" style={{ marginBottom: 8 }}>{emoji} {label}</div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 16 }}>{desc}</div>
            <div style={{ width: 120, height: 120, margin: "0 auto 16px", borderRadius: 14, overflow: "hidden", border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
              {thumbs[imgKey]
                ? <img src={thumbs[imgKey]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ fontSize: 44, opacity: 0.4 }}>🖼</span>
              }
            </div>
            <label style={{ cursor: "pointer" }}>
              <span className={`btn btn-sm ${saved[imgKey] ? "btn-outline" : "btn-primary"}`} style={{ pointerEvents: "none" }}>
                {saving[imgKey] ? "Subiendo..." : saved[imgKey] ? "✅ Guardado" : "📤 Subir imagen"}
              </span>
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload(imgKey)} disabled={saving[imgKey]} />
            </label>
            {thumbs[imgKey] && (
              <button
                className="btn btn-outline btn-sm"
                style={{ marginLeft: 8 }}
                onClick={async () => {
                  await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [imgKey]: "" }) });
                  setThumbs(p => ({ ...p, [imgKey]: null }));
                  if (onThumbsChange) onThumbsChange(imgKey, null);
                }}
              >🗑</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── ADMIN PANEL ──────────────────────────────────────────────────────────────
const AdminPanel = ({ orders, onConfirmOrder, onDeliverOrder, coupons, setCoupons, products, setProducts, onThumbsChange }) => {
  const [section, setSection] = useState(() => {
    try { return sessionStorage.getItem("admin_section") || "overview"; } catch { return "overview"; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("admin_section", section); } catch {}
  }, [section]);

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
    { id: "thumbnails", icon: "🖼", label: "Miniaturas" },
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
        {section === "orders" && <AdminOrders orders={orders} onConfirm={onConfirmOrder} onDeliver={onDeliverOrder} />}
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
        {section === "thumbnails" && <ThumbnailManager onThumbsChange={onThumbsChange} />}
      </div>
    </div>
  );
};

// ─── RESET PASSWORD MODAL ─────────────────────────────────────────────────────
const ResetPasswordModal = ({ token, onClose }) => {
  const [form, setForm] = useState({ newPw: "", confirm: "" });
  const [msg, setMsg] = useState(null); // { text, ok }
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    setMsg(null);
    if (!form.newPw || !form.confirm) return setMsg({ text: "Completá todos los campos.", ok: false });
    if (form.newPw !== form.confirm) return setMsg({ text: "Las contraseñas no coinciden.", ok: false });
    if (form.newPw.length < 6) return setMsg({ text: "Mínimo 6 caracteres.", ok: false });
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: form.newPw }),
      });
      const data = await res.json();
      if (res.ok) { setDone(true); }
      else { setMsg({ text: data.error || "Error al restablecer la contraseña.", ok: false }); }
    } catch {
      setMsg({ text: "Error de red.", ok: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={!done ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🔐</div>
        <div className="modal-title">Nueva contraseña</div>
        <div className="modal-sub">Elegí una contraseña segura para tu cuenta</div>
        {done ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
            <div style={{ fontFamily: "Syne", fontSize: 16, fontWeight: 800, marginBottom: 8 }}>¡Contraseña actualizada!</div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>Ya podés iniciar sesión con tu nueva contraseña.</div>
            <button className="btn btn-primary btn-full" onClick={onClose}>Ir al inicio de sesión</button>
          </div>
        ) : (
          <>
            <div className="form-group">
              <label className="form-label">Nueva contraseña</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.newPw} onChange={e => setForm(p => ({ ...p, newPw: e.target.value }))} autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Confirmar contraseña</label>
              <input className="form-input" type="password" placeholder="••••••••" value={form.confirm} onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleReset()} />
            </div>
            {msg && (
              <div style={{ fontSize: 13, padding: "9px 13px", borderRadius: 9, marginBottom: 8, background: msg.ok ? "#F0FDF4" : "#FEF2F2", color: msg.ok ? "#15803D" : "#B91C1C", border: `1px solid ${msg.ok ? "#BBF7D0" : "#FECACA"}` }}>
                {msg.text}
              </div>
            )}
            <button className="btn btn-primary btn-full" onClick={handleReset} disabled={loading}>
              {loading ? "Guardando..." : "Guardar nueva contraseña"}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// ─── LEGAL DOCS ───────────────────────────────────────────────────────────────
const LegalPlaceholder = ({ title }) => (
  <p style={{ color: "var(--muted)" }}>El contenido de <strong>{title}</strong> estará disponible próximamente.</p>
);

const LegalPublicOffer = () => (
  <div>
    <p><strong>IMPORTANTE:</strong> Antes de aceptar esta Oferta, el Vendedor debe leer cuidadosamente sus términos, así como el Acuerdo de Usuario, la Política de Privacidad, las Reglas Generales de BM Verificada y las Reglas de Reemplazo de Productos Inválidos (colectivamente, los "Documentos de la Plataforma"). La aceptación de esta Oferta constituye un acuerdo pleno e incondicional del Vendedor con todos los términos.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Definiciones</p>
    <p>1.1. Los términos usados tienen los significados definidos en el Acuerdo de Usuario de BM Verificada.</p>
    <p>1.2. <strong>Vendedor (Proveedor)</strong> — Usuario de la Plataforma que ha aceptado esta Oferta y utiliza las funcionalidades de la Plataforma para listar Bienes Digitales a la venta.</p>
    <p>1.3. <strong>Bienes Digitales</strong> — cuentas de redes sociales, cuentas de plataformas publicitarias, servicios promocionales, claves digitales, software, bases de datos y otros contenidos digitales.</p>
    <p>1.4. <strong>Cuenta del Vendedor</strong> — sección dedicada de la Plataforma para gestionar listados, ventas, transacciones financieras y comunicación con Compradores.</p>
    <p>1.5. <strong>Comisión de la Plataforma</strong> — tarifa pagadera por el Vendedor a la Plataforma por el uso de sus funcionalidades. El monto y método de cálculo se comunican al Vendedor a través de la Cuenta del Vendedor.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Objeto del Acuerdo</p>
    <p>2.1. La Plataforma otorga al Vendedor el derecho a usar las funcionalidades de BM Verificada para listar Bienes Digitales y proporciona servicios informativos y tecnológicos relacionados.</p>
    <p>2.2. La Plataforma <strong>no es vendedora, propietaria ni titular de derechos</strong> de los Bienes Digitales. Actúa únicamente como intermediaria tecnológica.</p>
    <p>2.3. Todos los contratos de venta de Bienes Digitales se celebran directamente entre el Vendedor y el Comprador. La Plataforma no es parte de dichos contratos.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Aceptación de la Oferta</p>
    <p>El Vendedor acepta esta Oferta mediante: registro en BM Verificada como Usuario, marcación del checkbox de aceptación durante el registro, e inicio del uso de funcionalidades del Vendedor (carga de Bienes Digitales, fijación de precios). Desde ese momento, el Acuerdo se considera celebrado.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Derechos y Obligaciones</p>
    <p><strong>La Plataforma se compromete a:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Proveer al Vendedor acceso a la Cuenta del Vendedor y funcionalidades relacionadas.</li>
      <li>Notificar al Vendedor sobre cambios en esta Oferta y los Documentos de la Plataforma.</li>
      <li>Aceptar pagos de Compradores y transferir los ingresos al Vendedor menos la Comisión.</li>
    </ul>
    <p style={{ marginTop: 10 }}><strong>La Plataforma tiene derecho a:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Cobrar Comisión.</li>
      <li>Rechazar, suspender o eliminar listados que violen los términos, derechos de terceros o la ley.</li>
      <li>Restringir o bloquear la Cuenta del Vendedor en caso de infracciones.</li>
      <li>Modificar esta Oferta, Documentos de la Plataforma y tarifas de Comisión unilateralmente.</li>
      <li>Usar la información de productos del Vendedor con fines de marketing.</li>
    </ul>
    <p style={{ marginTop: 10 }}><strong>El Vendedor se compromete a:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Proporcionar información precisa y actualizada.</li>
      <li>Listar únicamente Bienes Digitales lícitos para los cuales posea derechos de distribución.</li>
      <li>Ser el único responsable de la calidad, legalidad y cumplimiento de los Bienes Digitales.</li>
      <li>Cumplir las Reglas de Reemplazo de Productos Inválidos.</li>
      <li>Pagar oportunamente la Comisión de la Plataforma.</li>
      <li>Resolver de forma independiente los reclamos de Compradores y terceros.</li>
      <li>No intentar eludir los pagos de Comisión ni usar indebidamente los datos de Compradores.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Condiciones Financieras</p>
    <p>5.1. Las tarifas de Comisión se establecen en la Cuenta del Vendedor o sección relevante de la Plataforma.</p>
    <p>5.2. La Plataforma puede deducir la Comisión de los pagos del Comprador antes de transferir los fondos al Vendedor.</p>
    <p>5.3. Todos los pagos se realizan en la moneda indicada en la Plataforma. Los gastos de conversión y bancarios corren por cuenta del Vendedor.</p>
    <p>5.4. La Plataforma no es agente fiscal del Vendedor. El Vendedor es responsable del cumplimiento fiscal.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Responsabilidad y Limitaciones</p>
    <p>6.1. El Vendedor asume plena responsabilidad por la exactitud y legalidad de la información proporcionada, la calidad y legalidad de los Bienes Digitales, las violaciones de derechos de terceros, y las pérdidas causadas a la Plataforma, Compradores o terceros.</p>
    <p>6.2. La Plataforma actúa únicamente como intermediaria técnica y no autoriza, promueve ni avala ningún uso de Bienes Digitales que viole las leyes aplicables o las reglas de plataformas de terceros.</p>
    <p>6.3. La Plataforma no es responsable por el contenido, calidad o legalidad de los Bienes Digitales; acciones de Vendedores o Compradores; fallos técnicos o causas de fuerza mayor.</p>
    <p>6.4. La responsabilidad de la Plataforma se limita a la Comisión pagada por el Vendedor en los últimos 3 meses.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Propiedad Intelectual</p>
    <p>7.1. Todos los derechos sobre BM Verificada pertenecen a la Plataforma o sus afiliados.</p>
    <p>7.2. Al publicar contenido, el Vendedor otorga a la Plataforma una licencia mundial, libre de regalías y no exclusiva para usar dicho contenido en el funcionamiento de la Plataforma.</p>
    <p>7.3. El Vendedor garantiza que el contenido publicado no infringe derechos de terceros.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>8. Confidencialidad y Datos Personales</p>
    <p>El tratamiento de datos personales se rige por la Política de Privacidad de BM Verificada. El Vendedor debe cumplir las leyes de protección de datos y usar los datos del Comprador únicamente para cumplir este Acuerdo.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>9. Vigencia y Rescisión</p>
    <p>9.1. Este Acuerdo es efectivo desde la aceptación y permanece vigente hasta su rescisión. El Vendedor puede terminar el uso de la Plataforma eliminando la Cuenta, siempre que no existan obligaciones pendientes. La rescisión no libera al Vendedor de las obligaciones contraídas antes de la misma.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>10. Fuerza Mayor</p>
    <p>Las partes no son responsables por incumplimientos causados por fuerza mayor (desastres naturales, guerra, actos gubernamentales, fallos de internet, ataques a servidores, etc.). Si la fuerza mayor dura más de 30 días, cualquiera de las partes puede rescindir el Acuerdo.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>11. Ley Aplicable y Resolución de Disputas</p>
    <p>Las disputas se resolverán mediante negociaciones. Si no se resuelven, serán sometidas al tribunal en la ubicación de la Plataforma.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>12. Disposiciones Finales</p>
    <p>12.1. La Plataforma puede modificar esta Oferta y los Documentos de la Plataforma de forma unilateral publicando actualizaciones. El uso continuado de la Plataforma tras las actualizaciones constituye la aceptación por parte del Vendedor.</p>
    <p>12.2. Los siguientes Apéndices forman parte integral de este Acuerdo: Apéndice 1 — Lista de Bienes y Servicios Prohibidos; Apéndice 2 — Procedimiento para Solicitudes de Autoridades Gubernamentales.</p>
  </div>
);

const LegalUserAgreement = () => (
  <div>
    <p>Este Acuerdo de Usuario (el "Acuerdo") rige la relación entre el titular de la plataforma online <strong>BM Verificada</strong> (la "Plataforma" o el "Marketplace") y cualquier persona física o jurídica (el "Usuario") que se registre y/o utilice las funcionalidades de la Plataforma.</p>
    <p style={{ marginTop: 8 }}>El Acuerdo forma parte integral del paquete de documentación legal de la Plataforma (Oferta Pública, Política de Privacidad, Reglas Generales). En caso de discrepancias, se aplica la siguiente prioridad: Oferta Pública → Reglas Generales → este Acuerdo.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Definiciones</p>
    <p>1.1. <strong>BM Verificada</strong> — la Plataforma de marketplace digital de Business Managers verificados.</p>
    <p>1.2. <strong>Plataforma / Marketplace</strong> — entorno online que permite la publicación e intercambio de información sobre bienes digitales, así como transacciones entre vendedores y compradores.</p>
    <p>1.3. <strong>Cuenta Personal</strong> — interfaz del Usuario dentro de la Plataforma, accesible tras autorización, con datos personales, estadísticas e información de saldo.</p>
    <p>1.4. <strong>Usuario</strong> — toda persona física capaz legalmente registrada en la Plataforma que utilice sus funcionalidades.</p>
    <p>1.5. <strong>Vendedor</strong> — persona física o jurídica que publica ofertas de bienes digitales en la Plataforma.</p>
    <p>1.6. <strong>Comprador</strong> — Usuario que adquiere bienes digitales de un Vendedor a través de la interfaz de la Plataforma.</p>
    <p>1.7. <strong>Transacción</strong> — acuerdo entre Vendedor y Comprador para la venta de un bien digital.</p>
    <p>1.8. <strong>Saldo</strong> — registro de los fondos del Usuario dentro de la Plataforma, incluyendo entradas y salidas.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Derechos de Propiedad Intelectual</p>
    <p>2.1. Los derechos exclusivos sobre la Plataforma —incluyendo software, bases de datos, diseño, logotipo, marcas y demás elementos— pertenecen a BM Verificada.</p>
    <p>2.2. Sin consentimiento previo por escrito, ninguna parte de la Plataforma podrá ser reproducida, modificada, distribuida, exhibida públicamente ni usada de ninguna otra forma.</p>
    <p>2.3. Al aceptar este Acuerdo, BM Verificada otorga al Usuario un derecho no exclusivo de usar las funcionalidades de la Plataforma. El incumplimiento del Acuerdo puede resultar en la suspensión de la cuenta.</p>
    <p>2.4. Está estrictamente prohibido cualquier tipo de spam, manipulación de enlaces de afiliados o copia de la Plataforma con intención de engañar a terceros.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Registro y Acceso</p>
    <p>3.1. Para registrarse, el Usuario debe completar todos los campos obligatorios del formulario de registro. Se requiere un email válido para la confirmación.</p>
    <p>3.2. La aceptación de este Acuerdo se confirma marcando la casilla "Acepto" durante el registro.</p>
    <p>3.3. Cualquier acción realizada con las credenciales del Usuario se considera realizada por el Usuario y tiene el mismo efecto legal que una firma electrónica simple.</p>
    <p>3.4. El Usuario debe mantener sus credenciales confidenciales. BM Verificada puede restablecer una contraseña si sospecha de una vulneración.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Ejecución de Transacciones</p>
    <p>4.1. Los pagos entre Compradores y Vendedores se procesan mediante escrow en la Plataforma (ver Oferta Pública, sección 4.2).</p>
    <p>4.2. El Usuario acepta que cualquier cambio en su saldo mostrado en la Cuenta Personal es legalmente vinculante y queda registrado en el sistema contable automatizado de BM Verificada.</p>
    <p>4.3. Todas las liquidaciones se realizan según los tipos de cambio, comisiones y condiciones vigentes al momento de la transacción.</p>
    <p>4.4. La Plataforma no es parte de las transacciones entre Usuarios, salvo lo indicado expresamente en la Oferta Pública.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Responsabilidad</p>
    <p>5.1. Las violaciones de este Acuerdo pueden resultar en suspensión temporal, restricción de funcionalidades o cancelación permanente del acceso a la Plataforma.</p>
    <p>5.2. El Usuario es plenamente responsable de la información que publique, las acciones que realice y las consecuencias derivadas del uso de la Plataforma.</p>
    <p>5.3. BM Verificada no se responsabiliza por:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Pérdidas sufridas por el Usuario por el uso o la imposibilidad de usar la Plataforma.</li>
      <li>Acciones de terceros, incluidos otros Usuarios.</li>
      <li>Errores técnicos, fallos o interrupciones de comunicación, incluyendo interrupciones del servicio de internet.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Eliminación de Cuenta</p>
    <p>6.1. El Usuario puede eliminar su cuenta a través de la interfaz de la Cuenta Personal, siempre que no haya obligaciones pendientes, deudas o transacciones activas.</p>
    <p>6.2. La Plataforma puede eliminar la cuenta de un Usuario:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>En caso de violaciones legales.</li>
      <li>En caso de incumplimiento de este Acuerdo u otros documentos de la Plataforma.</li>
      <li>Tras inactividad prolongada (más de 12 meses).</li>
    </ul>
    <p>6.3. La eliminación de la cuenta conlleva la supresión de los datos personales, salvo que la ley exija su conservación.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Tratamiento de Datos Personales</p>
    <p>7.1. Todo lo relacionado con el tratamiento de datos personales se rige por la Política de Privacidad publicada en la Plataforma.</p>
    <p>7.2. Al registrarse y usar la Plataforma, el Usuario consiente el tratamiento de sus datos personales para: cumplir las obligaciones del Acuerdo, habilitar la Cuenta Personal, cumplir las leyes aplicables (incluidos los requisitos AML/CFT) y prevenir fraude y abuso.</p>
    <p>7.3. El Usuario puede revocar su consentimiento mediante notificación escrita, lo que resulta en la eliminación de la cuenta y la terminación del acceso a la Plataforma.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>8. Disposiciones Finales</p>
    <p>8.1. Este Acuerdo constituye una oferta pública y entra en vigencia al ser aceptado por el Usuario durante el registro.</p>
    <p>8.2. BM Verificada puede modificar este Acuerdo unilateralmente. La versión actual siempre estará disponible en la Plataforma.</p>
    <p>8.3. Si el Usuario no está de acuerdo con las modificaciones, deberá dejar de usar la Plataforma. El uso continuado constituye la aceptación del Acuerdo revisado.</p>
  </div>
);

const LegalAppendix1 = () => (
  <div>
    <p>Este documento define las categorías de productos digitales y servicios que los Vendedores tienen estrictamente prohibido listar o vender en la Plataforma. La Plataforma se reserva el derecho, a su exclusiva discreción, de actualizar esta lista y eliminar cualquier producto o servicio que viole estas reglas o represente un riesgo, incluso si no se menciona explícitamente a continuación.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Productos y Servicios que Violan Leyes o Derechos de Terceros</p>
    <p>Cualquier producto o servicio de naturaleza ilegal o destinado a facilitar actividades ilícitas, incluyendo:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Artículos cuya distribución, venta o uso viole las leyes locales, nacionales o internacionales aplicables.</li>
      <li><strong>Contenido falsificado y pirata:</strong> software, juegos, música, películas, libros y cursos distribuidos sin autorización del titular de derechos; versiones crackeadas, copias sin licencia, claves de activación obtenidas ilegalmente; bienes que infrinjan derechos de autor, patentes, marcas u otra propiedad intelectual.</li>
      <li><strong>Activos digitales robados o adquiridos ilegalmente:</strong> objetos de videojuegos, monedas, cuentas, criptoactivos, etc.</li>
      <li><strong>Datos obtenidos o distribuidos ilegalmente:</strong> bases de datos con datos personales (direcciones, teléfonos, IDs, datos financieros, etc.), secretos gubernamentales, corporativos, bancarios o médicos sin autorización, software espía y herramientas de interceptación de tráfico sin consentimiento del usuario.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Software Malicioso y Herramientas de Acceso No Autorizado</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Malware: virus, troyanos, spyware, adware, botnets, rootkits, ransomware, etc.</li>
      <li>Software y servicios para hackear, hacer phishing, eludir seguridad o ingeniería social.</li>
      <li>Servicios de ciberataque: ataques DDoS, hackeo por encargo, distribución de malware.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Productos y Servicios Relacionados con el Fraude</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Bienes y servicios diseñados para engañar o inducir a error.</li>
      <li>Documentos falsificados: pasaportes, DNIs, diplomas, certificados, etc.</li>
      <li>Software y servicios para generar documentos falsos, incluyendo deepfakes.</li>
      <li>Servicios para alterar o falsificar datos: historiales crediticios, kilometraje, y registros similares.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Violaciones de los Términos de Servicio de Terceros</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Venta o distribución de cuentas, licencias, claves y otros activos digitales obtenidos en violación de los términos de servicio de terceros (Steam, Epic Games, Google, Meta, TikTok, Telegram, etc.).</li>
      <li>Transferencia o venta de derechos de acceso sin titularidad legal (cuentas de prueba, acceso obtenido mediante bugs o exploits).</li>
      <li>Cualquier actividad que infrinja los acuerdos de usuario, políticas de seguridad, reglas de protección de PI o directrices de uso justo de servicios de terceros.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Contenido que Viola Estándares Morales, Éticos o de Orden Público</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Contenido pornográfico, incluido material de explotación infantil, o cualquier contenido que muestre violencia, crueldad o explotación.</li>
      <li>Promoción de la violencia, el racismo, la xenofobia, la discriminación, el terrorismo o el extremismo.</li>
      <li>Contenido que incite al odio nacional, racial, religioso o social.</li>
      <li>Contenido que denigre la dignidad humana, contenga amenazas o insultos, fomente el suicidio o promueva el daño a uno mismo o a otros.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Fraude Financiero, Esquemas Ilegales y Operaciones en la Sombra</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Venta o promoción de esquemas de evasión fiscal, lavado de dinero, transferencias de dinero ilegales, transacciones simuladas u otras operaciones financieras fraudulentas.</li>
      <li>Cursos, guías e instrucciones para fraude, hackeo, elusión de sistemas de identificación, ingeniería social u otras actividades ilícitas.</li>
      <li>Servicios de "drop" (uso de terceros en fraude financiero), esquemas de cash-out u operaciones en mercados paralelos.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Amenazas a la Seguridad de la Plataforma</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Cualquier actividad dirigida a interrumpir las operaciones de la Plataforma: DDoS, ataques de bots, distribución de spam, scraping automatizado, inyección de scripts maliciosos, explotación de vulnerabilidades, etc.</li>
      <li>Creación de versiones duplicadas o falsas de la Plataforma, uso no autorizado de la marca o marcas registradas de BM Verificada.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>8. Otros Productos y Servicios Prohibidos</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Cuentas para servicios gubernamentales o municipales (portales de servicios públicos, cuentas tributarias, sistemas de salud, etc.).</li>
      <li>Venta de productos digitales personalizados creados en violación de derechos personales (deepfake, perfiles falsos).</li>
      <li>Servicios que explotan programas de bonificaciones, promociones o sistemas de fidelización mediante medios deshonestos (generación fraudulenta de códigos promocionales o cupones).</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>9. Riesgos y Disposiciones Adicionales</p>
    <p><strong>9.1.</strong> La Plataforma se reserva el derecho de clasificar cualquier producto o servicio como prohibido a su exclusiva discreción; eliminar o bloquear un producto o Vendedor sin previo aviso si se sospechan infracciones; y reportar infracciones a las autoridades competentes o titulares de derechos.</p>
    <p><strong>9.2.</strong> Listar productos o servicios prohibidos puede resultar en: eliminación del listado, suspensión o cancelación de la cuenta del Vendedor, retención o congelamiento de fondos hasta completar la investigación, y responsabilidad civil, administrativa o penal según la ley aplicable.</p>
    <p><strong>9.3.</strong> El Vendedor reconoce y confirma que ha leído esta Lista, comprende las consecuencias de las infracciones y acepta cumplir con todos los requisitos aquí establecidos.</p>
  </div>
);

const LegalAppendix2 = () => (
  <div>
    <p>Este Procedimiento establece las condiciones y procesos bajo los cuales la Plataforma responde a solicitudes de información de usuarios y registros de actividad recibidas de: organismos de aplicación de la ley, tribunales, otros órganos gubernamentales o municipales ("Autoridades Gubernamentales"), así como representantes de terceros que actúen bajo procedimientos legales (consultas de abogados, procedimientos civiles o arbitrales respaldados por orden judicial).</p>
    <p style={{ marginTop: 8 }}>La Plataforma se compromete a: proteger la confidencialidad de los datos de los usuarios y el derecho a la privacidad, y cumplir con las leyes aplicables cooperando con las Autoridades Gubernamentales cuando sea requerido.</p>
    <p style={{ marginTop: 8 }}><strong>Principios fundamentales:</strong> Legalidad (los datos se divulgan solo cuando existe una base legal válida); Necesidad y Proporcionalidad (la divulgación se limita estrictamente a lo requerido); Protección de Datos (la Plataforma toma medidas para evitar divulgaciones excesivas).</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Bases para la Divulgación</p>
    <p>La Plataforma puede divulgar información únicamente bajo una de las siguientes bases legales:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Solicitud oficial de una Autoridad Gubernamental emitida conforme a la ley aplicable: órdenes judiciales, mandamientos o resoluciones; solicitudes de organismos de investigación o fiscales; solicitudes de otros organismos competentes (tributarios, antimonopolio, etc.) dentro de su autoridad legal.</li>
      <li>Circunstancias de emergencia que impliquen una amenaza inminente a la vida o riesgo grave para la salud. En tales casos se divulgará solo el mínimo de datos necesarios y se requerirá una solicitud formal posterior.</li>
      <li>Consentimiento voluntario del usuario, en forma escrita o electrónica.</li>
      <li>Cumplimiento de regulaciones AML/CFT (antilavado de dinero y financiamiento del terrorismo), donde corresponda.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Procedimiento de Gestión de Solicitudes</p>
    <p><strong>Forma y contenido:</strong> Las solicitudes deben presentarse por escrito en papel membretado oficial de la autoridad solicitante, o en formato electrónico desde un dominio oficial. Cada solicitud debe especificar: nombre de la autoridad, base legal, propósito, información específica requerida, plazo de respuesta y datos de contacto del funcionario solicitante.</p>
    <p style={{ marginTop: 8 }}><strong>Revisión por la Plataforma:</strong> La Plataforma verificará el cumplimiento de la solicitud con la ley aplicable, la existencia de bases legales válidas, la autoridad del firmante y la claridad del alcance de los datos solicitados. La Plataforma puede rechazar la divulgación si la solicitud no cumple los requisitos, solicitar aclaraciones o posponer la ejecución.</p>
    <p style={{ marginTop: 8 }}><strong>Plazos de respuesta:</strong> La Plataforma se esforzará por cumplir dentro del plazo especificado. Si no se indica plazo, responderá en un período razonable, normalmente no mayor a 10 días hábiles.</p>
    <p style={{ marginTop: 8 }}><strong>Notificación al usuario:</strong> Salvo prohibición legal, la Plataforma puede notificar al Usuario sobre la solicitud y cualquier divulgación de sus datos. La notificación puede demorarse si una prohibición legal lo impide o si la divulgación podría comprometer evidencia o interferir con una investigación.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Solicitudes Internacionales</p>
    <p>La Plataforma puede procesar solicitudes de autoridades extranjeras sujeto a: existencia de un tratado o acuerdo internacional entre el país solicitante y la jurisdicción de la Plataforma; presentación de traducción oficial al español u otro idioma legalmente requerido; validez legal y cumplimiento tanto del derecho internacional como doméstico. En casos de emergencia excepcionales (amenazas inminentes a la vida), se puede tomar acción preliminar antes de completar las formalidades.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Restricciones y Rechazos</p>
    <p>La Plataforma se reserva el derecho de rechazar la divulgación si:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>La solicitud no cumple los requisitos formales, carece de detalles obligatorios o es presentada por una parte no autorizada.</li>
      <li>No existen bases legales o se ha violado el procedimiento legal.</li>
      <li>El alcance de los datos solicitados es desproporcionado respecto al propósito declarado.</li>
      <li>La solicitud infringe los derechos y libertades de los Usuarios (ausencia de orden judicial obligatoria).</li>
      <li>Se duda de la autenticidad o fiabilidad de la solicitud.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Registro y Almacenamiento</p>
    <p>Todas las solicitudes y acciones relacionadas se registran y almacenan en un sistema cifrado, incluyendo: fecha y hora de recepción, información del remitente, contenido y base legal de la solicitud, detalles de los datos divulgados, empleado responsable y motivos de rechazo (si aplica).</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Disposiciones Finales</p>
    <p>Este Procedimiento aplica a todos los Usuarios de la Plataforma, independientemente de su nacionalidad o ubicación. La Plataforma puede modificar este documento unilateralmente. Todas las actualizaciones se publicarán, y el uso continuado de la Plataforma constituye la aceptación de dichas actualizaciones.</p>
  </div>
);

const LegalRules = () => (
  <div>
    <p><strong>Introducción</strong></p>
    <p>Estas Reglas Generales de la Plataforma BM Verificada (en adelante, las "Reglas") forman parte integral del Acuerdo de Usuario y la Oferta Pública para Vendedores (colectivamente, los "Documentos Principales"). Al usar la Plataforma, confirmás haber leído, comprendido y aceptado plenamente estas Reglas y los Documentos Principales.</p>
    <p style={{ marginTop: 8 }}>El propósito de estas Reglas es establecer estándares de conducta, obligaciones y restricciones para todos los usuarios al utilizar la Plataforma, garantizando un entorno seguro, justo y eficiente.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Principios Generales de Uso de la Plataforma</p>
    <p><strong>1.1 Legalidad:</strong> Los usuarios deben usar la Plataforma únicamente con fines lícitos, cumpliendo las leyes aplicables de su jurisdicción, así como las normas internacionales.</p>
    <p><strong>1.2 Integridad:</strong> Los usuarios deben actuar con honestidad y buena fe hacia otros Usuarios y la Plataforma. Cualquier forma de fraude, engaño o competencia desleal está prohibida.</p>
    <p><strong>1.3 Respeto:</strong> Los usuarios deben tratar con respeto a los demás Usuarios y representantes de la Plataforma. Se prohíben estrictamente insultos, amenazas, conductas discriminatorias y el uso de lenguaje ofensivo.</p>
    <p><strong>1.4 Seguridad:</strong> Los usuarios no deben realizar acciones que puedan comprometer la seguridad o estabilidad de la Plataforma o los datos de otros Usuarios.</p>
    <p style={{ marginTop: 8, fontStyle: "italic" }}>La Plataforma actúa únicamente como intermediaria técnica y no autoriza, promueve ni avala ningún uso de productos o servicios que viole las leyes aplicables o las reglas de plataformas de terceros.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Registro y Cuentas</p>
    <p><strong>2.1 Exactitud:</strong> Al registrarse y durante el uso de la Plataforma, los Usuarios deben proporcionar información precisa, completa y actualizada.</p>
    <p><strong>2.2 Cuenta única:</strong> Cada Usuario puede mantener generalmente solo una cuenta. Crear múltiples cuentas sin permiso explícito puede resultar en la suspensión de todas las cuentas relacionadas.</p>
    <p><strong>2.3 Seguridad de la cuenta:</strong> Los usuarios son plenamente responsables de mantener la confidencialidad de sus credenciales y de todas las acciones realizadas bajo su cuenta. Cualquier actividad no autorizada debe reportarse de inmediato al soporte de la Plataforma.</p>
    <p><strong>2.4 Transferencia de cuenta:</strong> Vender o transferir una cuenta de BM Verificada a terceros está prohibido sin el consentimiento previo por escrito de la Plataforma.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Reglas para Listar Productos Digitales (para Vendedores)</p>
    <p><strong>3.1 Productos permitidos:</strong> Los Vendedores solo pueden listar bienes y servicios digitales que no violen las leyes aplicables, las reglas de la Plataforma ni los derechos de terceros.</p>
    <p><strong>3.2 Productos prohibidos:</strong> La lista de bienes y servicios prohibidos se establece en el Apéndice 1 de la Oferta Pública. Listar dichos productos está estrictamente prohibido y puede resultar en sanciones.</p>
    <p><strong>3.3 Calidad y exactitud:</strong> Los Vendedores deben proporcionar descripciones completas y precisas de sus productos digitales que reflejen las características reales y no induzcan a error.</p>
    <p><strong>3.4 Derechos legales:</strong> Los Vendedores garantizan que poseen todos los derechos y licencias necesarios para los productos digitales listados.</p>
    <p><strong>3.5 Esquemas fraudulentos:</strong> La venta de productos o servicios diseñados para engañar a compradores, eludir sistemas de seguridad, hackear software o realizar actividades fraudulentas está estrictamente prohibida.</p>
    <p><strong>3.6 Entrega técnica:</strong> Los Vendedores son responsables de garantizar el correcto funcionamiento y la entrega oportuna de los productos digitales.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Comunicación y Conducta</p>
    <p><strong>Los usuarios no deben:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Usar la Plataforma para spam, phishing, distribución de malware o actividades similares.</li>
      <li>Insultar a otros Usuarios o representantes de la Plataforma.</li>
      <li>Adoptar comportamientos abusivos, provocadores o tóxicos.</li>
      <li>Difundir información falsa o engañosa sobre la Plataforma o sus participantes.</li>
    </ul>
    <p>En caso de conflictos entre Usuarios, se recomienda usar el sistema de soporte interno. La comunicación con la administración debe ser cortés y constructiva.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Responsabilidad y Sanciones</p>
    <p>Las infracciones a estas Reglas pueden resultar en:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Advertencia.</li>
      <li>Suspensión temporal de las funcionalidades de la cuenta.</li>
      <li>Eliminación permanente de la cuenta.</li>
      <li>Retención de fondos pendiente de investigación.</li>
      <li>Remisión de información a las autoridades competentes.</li>
    </ul>
    <p>La Plataforma se reserva el derecho de no divulgar los motivos de suspensión o eliminación de cuentas si las acciones del Usuario representan riesgos para el servicio o violan las leyes aplicables.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Quejas y Consultas</p>
    <p>Los Usuarios pueden presentar quejas a través del formulario de contacto o el email indicado en la sección de Contacto (ver Sección 11 de la Política de Privacidad). Las quejas deben incluir descripción del problema, evidencias y datos de contacto. La Plataforma revisa las quejas generalmente dentro de los 10 días hábiles.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Disposiciones Finales</p>
    <p>7.1 Estas Reglas están vigentes desde la fecha de publicación. La Plataforma se reserva el derecho de modificarlas unilateralmente. La versión actualizada se considera aceptada por el Usuario una vez publicada.</p>
    <p>7.2 Si un Usuario no está de acuerdo con alguna modificación, debe dejar de usar la Plataforma. El uso continuado constituye la aceptación de la versión revisada.</p>
  </div>
);

const LegalReplacement = () => (
  <div>
    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Disposiciones Generales</p>
    <p>Un <strong>producto digital</strong> (en adelante – producto) son credenciales de acceso a cuentas u otros datos textuales utilizados en sitios web o software.</p>
    <p>Un <strong>producto válido</strong> es un producto funcional, no bloqueado, que corresponde a la descripción.</p>
    <p>Un <strong>producto inválido</strong> es un producto bloqueado o no funcional, o un producto que no corresponde a la descripción.</p>
    <p>La <strong>garantía del producto</strong> es el proceso de reemplazar un producto inválido por uno válido, o corregir los defectos del producto dentro de las 24 horas.</p>
    <p>La verificación de un producto inválido se realiza dentro de las 24 horas. Si no se toma una decisión de garantía dentro de ese plazo, el producto es reemplazado.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Términos de Garantía</p>
    <p>El período de garantía para todos los productos después de la entrega es de <strong>60 minutos</strong>. Una vez vencido el período de garantía, el producto se considera válido y no puede ser reemplazado.</p>

    <p style={{ marginTop: 10 }}><strong>Se provee garantía si:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Existen problemas de acceso al producto que no pueden resolverse de inmediato.</li>
      <li>Puede establecerse de manera fehaciente que el bloqueo u otras restricciones que hicieron inválido al producto ocurrieron antes de la compra.</li>
      <li>Al producto le faltan parámetros importantes declarados en la descripción:
        <ul style={{ paddingLeft: 16, marginTop: 4 }}>
          <li><strong>Facebook:</strong> antigüedad del producto, estado de verificación, estado PZRD (Reintegrada).</li>
          <li><strong>Google:</strong> estado de verificación.</li>
          <li><strong>TikTok:</strong> estado de verificación, acceso al email.</li>
          <li><strong>Twitter y Discord:</strong> estado de verificación o seguidores faltantes.</li>
          <li><strong>Servicios de boosting y redes neuronales:</strong> ausencia de moneda de saldo interno.</li>
          <li><strong>Otros productos:</strong> antigüedad, ausencia de amigos o seguidores, estado de verificación.</li>
        </ul>
      </li>
    </ul>

    <p style={{ marginTop: 10 }}><strong>No se provee garantía si:</strong></p>
    <ul style={{ paddingLeft: 18 }}>
      <li>El inicio de sesión (incluso mediante token, cookies o perfil de navegador anti-detect) resultó en el bloqueo del producto.</li>
      <li>Cualquier acción posterior al inicio de sesión, o la falta de ella, provocó bloqueo, restricciones de funcionalidad, cancelación de verificación, deducción de saldo, mal funcionamiento de objetos asociados a la cuenta, o el producto se volvió inválido tras el inicio de sesión.</li>
      <li>Se realizaron acciones sobre un producto inválido: presentar una apelación, transferir objetos, cambiar información de la cuenta, etc.</li>
      <li>El producto tiene defectos menores que no afectan su estado válido, o falta algún dato complementario que no lo invalida (cookies, email, 2FA, ID, token, enlaces a materiales adicionales, etc.).</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Otras Condiciones</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Cualquier producto se vende en el marketplace una sola vez.</li>
      <li>En la página del producto pueden figurar términos de garantía adicionales con carácter prioritario.</li>
      <li>Los productos válidos comprados en el marketplace o entregados mediante soporte técnico no están sujetos a devolución ni reemplazo. Esto también aplica a productos comprados accidentalmente, por error, por descuido y/o por cualquier otra razón.</li>
      <li>Si un producto fue comprado pero no utilizado, dicho producto no es elegible para reemplazo (ver cláusula 2.1).</li>
      <li>Si los reclamos relacionados con un producto no encajan en ninguna de las situaciones listadas, esos casos se revisan individualmente.</li>
    </ul>
  </div>
);

const LegalPrivacy = () => (
  <div>
    <p>Esta Política de Privacidad es parte integral del Acuerdo de Usuario y los Términos Generales de la plataforma <strong>BM Verificada</strong> (en adelante "la Plataforma" o el "Marketplace"). En caso de inconsistencia, esta Política prevalecerá.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>1. Disposiciones Generales</p>
    <p>1.1. Esta Política explica qué datos personales recopilamos, cómo y en qué bases legales los procesamos, y tus derechos según el RGPD, CCPA/CPRA y otras regulaciones aplicables. 1.2. Al usar la Plataforma, confirmas haber leído y aceptado plenamente esta Política. Si no estás de acuerdo, por favor deja de usar la Plataforma.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>2. Categorías de Datos que Recopilamos</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Información personal proporcionada durante el registro.</li>
      <li>Información técnica (dirección IP, tipo de navegador, detalles del dispositivo).</li>
      <li>Historial de transacciones y actividad en la Plataforma.</li>
      <li>Datos proporcionados voluntariamente (por ejemplo, al contactar soporte).</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>3. Fuentes de Recopilación de Datos</p>
    <p>Recopilamos datos:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Directamente de ti al registrarte, realizar un pedido o contactar soporte.</li>
      <li>De socios como proveedores de pago y análisis.</li>
      <li>Automáticamente mediante cookies y SDKs de terceros (ver Sección 6).</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>4. Base Legal para el Tratamiento</p>
    <p>Procesamos datos personales cuando se aplica al menos una de las siguientes bases legales:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Ejecución de un contrato con el usuario.</li>
      <li>Cumplimiento de obligaciones legales (contabilidad, KYC/AML).</li>
      <li>Intereses legítimos (prevención de fraude).</li>
      <li>Consentimiento del usuario (banner de cookies, comunicaciones de marketing).</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>5. Compartición y Divulgación de Datos</p>
    <p><strong>5.1. Dentro de nuestro grupo corporativo</strong> — el acceso se otorga estrictamente en base a la necesidad de conocer.</p>
    <p><strong>5.2. Proveedores de servicios externos</strong> — procesadores de pago (Capitalist, Cryptomus), proveedores de análisis (Google Analytics), hosting y nube. Las transferencias de datos se rigen por contratos que incluyen Cláusulas Contractuales Estándar de la UE donde corresponda.</p>
    <p><strong>5.3. Transferencias transfronterizas</strong> — al usar la Plataforma, consientes la transferencia de tus datos fuera de tu jurisdicción.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>6. Cookies y Tecnologías de Seguimiento</p>
    <p>Usamos cookies de sesión para autenticación, cookies persistentes para recordar preferencias, y píxeles/SDKs para análisis. En tu primera visita verás un banner de cookies para gestionar tus preferencias.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>7. Retención de Datos</p>
    <p>Conservamos los datos el tiempo necesario para cumplir los fines descritos en la Sección 2, o por más tiempo cuando la ley lo exija (por ejemplo, cinco años para registros contables). Transcurrido ese período, los datos se eliminan o anonymizan.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>8. Seguridad y Limitación de Responsabilidad</p>
    <p>8.1. Utilizamos cifrado, controles de acceso y monitoreo de incidentes para proteger tus datos. 8.2. Sin embargo, ningún método de transmisión o almacenamiento es completamente seguro. La Plataforma no se responsabiliza por accesos no autorizados fuera de su control razonable.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>9. Tus Derechos</p>
    <p>Tenés derecho a:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Acceder, corregir o eliminar tus datos.</li>
      <li>Retirar el consentimiento en cualquier momento.</li>
      <li>Restringir u oponerte al tratamiento.</li>
      <li>Solicitar la portabilidad de datos (donde la ley lo permita).</li>
      <li>Presentar una queja ante una autoridad supervisora.</li>
    </ul>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>10. Actualizaciones de la Política</p>
    <p>Esta Política puede actualizarse periódicamente. Los cambios significativos se anunciarán con al menos 10 días de anticipación. El uso continuado de la Plataforma tras la entrada en vigor de los cambios constituye la aceptación de la Política actualizada.</p>

    <p style={{ marginTop: 16, fontWeight: 700, color: "var(--text)" }}>11. Información de Contacto</p>
    <p>Para cualquier consulta sobre el tratamiento de datos personales, contáctanos:</p>
    <ul style={{ paddingLeft: 18 }}>
      <li>Email: <a href="mailto:soporte@bmverificada.com" style={{ color: "var(--accent)" }}>soporte@bmverificada.com</a></li>
      <li>Soporte Telegram: <a href="https://t.me/bmverificada_support" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>@bmverificada_support</a></li>
    </ul>
  </div>
);

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const sessionResult = useSession();
  const session = sessionResult?.data ?? null;
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  // ── DARK MODE ──
  const [darkMode, setDarkMode] = useState(true);
  useEffect(() => {
    const key = `bmverif_theme_${user?.email || "guest"}`;
    const saved = localStorage.getItem(key);
    setDarkMode(saved !== "light");
  }, [user?.email]);
  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    const key = `bmverif_theme_${user?.email || "guest"}`;
    localStorage.setItem(key, next ? "dark" : "light");
  };

  const [view, setView] = useState(() => {
    try { return sessionStorage.getItem("client_view") || "shop"; } catch { return "shop"; }
  });
  useEffect(() => {
    try { sessionStorage.setItem("client_view", view); } catch {}
  }, [view]);
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
  const [chatOpen, setChatOpen] = useState(false);

  // ── GLOBAL PENDING ORDER (persists across navigation and F5) ──
  const [globalPending, setGlobalPending] = useState(() => {
    try {
      const s = sessionStorage.getItem("bmveri_pending_order");
      if (!s) return null;
      const o = JSON.parse(s);
      if (o?.expiresAt && new Date() > new Date(o.expiresAt)) return null;
      return o;
    } catch { return null; }
  });
  const [globalPendingFull, setGlobalPendingFull] = useState(false);
  useEffect(() => {
    try {
      if (globalPending) sessionStorage.setItem("bmveri_pending_order", JSON.stringify(globalPending));
      else sessionStorage.removeItem("bmveri_pending_order");
    } catch {}
  }, [globalPending?.id]);
  const [legalModal, setLegalModal] = useState(null); // null | "privacy" | "user-agreement" | "public-offer" | "replacement" | "rules" | "appendix1" | "appendix2"
  const [resetToken, setResetToken] = useState(null);
  const [verifyResult, setVerifyResult] = useState(null); // null | "success" | "error" | string(error msg)
  // Detect ?reset=TOKEN and ?verify=TOKEN in URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reset = params.get("reset");
      const verify = params.get("verify");
      if (reset || verify) window.history.replaceState({}, "", "/"); // clean URL
      if (reset) setResetToken(reset);
      if (verify) {
        // Auto-verify the email
        fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: verify }),
        })
          .then(r => r.json())
          .then(d => setVerifyResult(d.ok ? "success" : (d.error || "error")))
          .catch(() => setVerifyResult("Error de red."));
      }
    }
  }, []);
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
  const refreshOrders = () => {
    if (!user) return;
    fetch("/api/orders")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setOrders(data); })
      .catch(() => {});
  };
  useEffect(() => { refreshOrders(); }, [user?.email]);
  useEffect(() => { if (view === "account") refreshOrders(); }, [view]);

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

  // ── WALLETS + THUMBS (dynamic from DB) ──
  const [wallets, setWallets] = useState(WALLETS);
  const [thumbs, setThumbs] = useState({ bm: null, ads: null });
  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.json())
      .then(data => {
        setWallets(prev => ({
          ...prev,
          TRC20: { ...prev.TRC20, addr: data.wallet_trc20 || prev.TRC20.addr },
          BEP20: { ...prev.BEP20, addr: data.wallet_bep20 || prev.BEP20.addr },
        }));
        setThumbs({ bm: data.thumb_bm || null, ads: data.thumb_ads || null });
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

  const handlePaySuccess = (order) => {
    setOrders(prev => [order, ...prev]);
    setLastOrder(order);
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

  const handleDeliverOrder = async (orderId, content) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryContent: content }),
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
          <div className="logo" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Logo" style={{ height: 36, width: 36, objectFit: "contain" }} />
            <span style={{ fontSize: 11, background: "var(--red)", color: "#fff", padding: "2px 8px", borderRadius: 6 }}>ADMIN</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>Panel de administración · {user.email}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button className="dark-toggle" onClick={toggleDark} title={darkMode ? "Modo claro" : "Modo oscuro"}>{darkMode ? "☀️" : "🌙"}</button>
            <button className="btn btn-outline btn-sm" onClick={() => signOut()}>← Cerrar sesión</button>
          </div>
        </div>
        <AdminPanel orders={orders} onConfirmOrder={handleConfirmOrder} onDeliverOrder={handleDeliverOrder} coupons={coupons} setCoupons={setCoupons} products={products} setProducts={setProducts} onThumbsChange={(key, val) => setThumbs(p => ({ ...p, [key === "thumb_bm" ? "bm" : "ads"]: val }))} />
      </div>
    );
  }

  return (
    <div className={`app${darkMode ? " dark" : ""}`}>
      <style>{css}</style>
      <div className="topbar">
        <div className="logo" onClick={() => { setView("shop"); setSelectedProduct(null); }}>
          <img src="/logoR.png" alt="BM Verificada" />
        </div>
        <div className="topbar-right">
          {user ? (
            <>
              <button className={`nav-tab ${view === "shop" ? "active" : ""}`} onClick={() => { setView("shop"); setSelectedProduct(null); }}>🛍 Tienda</button>
              <button className={`nav-tab ${view === "account" ? "active" : ""}`} onClick={() => setView("account")}>👤 Mi cuenta</button>
              <NotificationBell user={user} onGoAccount={() => setView("account")} />
              <button className="btn btn-outline btn-sm" onClick={() => signOut()}>Salir</button>
            </>
          ) : (
            <>
              <button className="btn btn-outline btn-sm" onClick={() => { setAuthTab("login"); setShowAuth(true); }}>Iniciar sesión</button>
              <button className="btn btn-primary btn-sm" onClick={() => { setAuthTab("register"); setShowAuth(true); }}>Registrarse</button>
            </>
          )}
          {user && <button className="chat-support-btn" onClick={() => setChatOpen(true)} title="Soporte">🎧</button>}
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

      {/* Side buttons bar — scrolls with page, hides under sticky topbar */}
      <div className="side-btns-bar">
        <div className="left-panel">
          <a href="https://t.me/bmverificada_soporte" target="_blank" rel="noopener noreferrer" className="left-panel-btn tg-support">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.268.942z"/></svg>
            Support
          </a>
          <a href="https://t.me/bmverificadamarketplace" target="_blank" rel="noopener noreferrer" className="left-panel-btn tg-channel">
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L7.88 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.268.942z"/></svg>
            Telegram Channel
          </a>
        </div>
        <a href="https://t.me/bmverificada_soporte" target="_blank" rel="noopener noreferrer" className="support-fab">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 18v-6a9 9 0 0 1 18 0v6"/>
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/>
            <path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>
          </svg>
          Support
        </a>
      </div>

      {view === "shop" && !selectedProduct && <ShopPage cart={cart} onAddToCart={addToCart} onBuyNow={handleBuyNow} onCartOpen={() => setCartOpen(true)} liked={liked} onToggleLike={toggleLike} products={products} onProductClick={p => setSelectedProduct(p)} thumbs={thumbs} />}
      {view === "shop" && selectedProduct && <ProductDetailPage product={selectedProduct} cart={cart} onBack={() => setSelectedProduct(null)} onAddToCartQty={addToCartQty} onBuyNowQty={handleBuyNowQty} liked={liked} onToggleLike={toggleLike} user={user} />}
      {view === "checkout" && <CheckoutPage cart={cart} onQty={setQty} onRemove={removeFromCart} user={user} onGoShop={() => setView("shop")} onShowAuth={() => { setAuthTab("login"); setShowAuth(true); }} onSuccess={order => { setOrders(prev => [order, ...prev]); setCart([]); }} onOrderPending={order => setGlobalPending(order)} wallets={wallets} />}
      {view === "account" && user && <UserAccount user={user} userOrders={orders} liked={liked} onToggleLike={toggleLike} onGoShop={() => setView("shop")} products={products} wallets={wallets} onOrderUpdate={updatedOrder => setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o))} />}

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
      {showPayment && user && <PaymentModal cart={cart} user={user} coupon={pendingCoupon} finalTotal={pendingTotal} onClose={() => setShowPayment(false)} onSuccess={handlePaySuccess} onOrderUpdate={o => setOrders(prev => { const ex = prev.find(x => x.id === o.id); return ex ? prev.map(x => x.id === o.id ? o : x) : [o, ...prev]; })} onOrderPending={order => setGlobalPending(order)} wallets={wallets} />}
      {showSuccess && lastOrder && <SuccessModal order={lastOrder} onClose={() => { setShowSuccess(false); setView("account"); }} />}
      {resetToken && <ResetPasswordModal token={resetToken} onClose={() => { setResetToken(null); setAuthTab("login"); setShowAuth(true); }} />}
      {verifyResult && (
        <div className="modal-overlay" onClick={() => { setVerifyResult(null); if (verifyResult === "success") { setAuthTab("login"); setShowAuth(true); } }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            {verifyResult === "success" ? (
              <>
                <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
                <div className="modal-title">¡Email verificado!</div>
                <div className="modal-sub">Tu cuenta está activada. Ya podés iniciar sesión.</div>
                <button className="btn btn-primary btn-full" style={{ marginTop: 16 }} onClick={() => { setVerifyResult(null); setAuthTab("login"); setShowAuth(true); }}>
                  → Iniciar sesión
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44, marginBottom: 10 }}>⚠️</div>
                <div className="modal-title">Error de verificación</div>
                <div className="modal-sub" style={{ color: "var(--red)" }}>{verifyResult}</div>
                <button className="btn btn-outline btn-full" style={{ marginTop: 16 }} onClick={() => setVerifyResult(null)}>Cerrar</button>
              </>
            )}
          </div>
        </div>
      )}

      <ChatWidget user={user} open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Global pending order widget — persists across navigation and F5 */}
      {globalPending && !globalPendingFull && (
        <GlobalPendingWidget
          order={globalPending}
          wallets={wallets}
          onExpand={() => setGlobalPendingFull(true)}
          onClear={() => { setGlobalPending(null); setGlobalPendingFull(false); }}
        />
      )}
      {globalPending && globalPendingFull && (
        <PaymentPendingModal
          order={globalPending}
          walletAddr={wallets?.[globalPending.network]?.addr || ""}
          walletColor={wallets?.[globalPending.network]?.color || "#f0a500"}
          onSuccess={() => { setGlobalPending(null); setGlobalPendingFull(false); refreshOrders(); }}
          onCancel={() => setGlobalPendingFull(false)}
          onMinimize={() => setGlobalPendingFull(false)}
          onCancelled={() => { setGlobalPending(null); setGlobalPendingFull(false); refreshOrders(); }}
        />
      )}

      {legalModal && (
        <div className="modal-overlay" onClick={() => setLegalModal(null)} style={{ alignItems: "flex-start", paddingTop: 40 }}>
          <div className="modal" style={{ maxWidth: 700, width: "100%" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text)" }}>
                {legalModal === "privacy" && "Política de Privacidad"}
                {legalModal === "user-agreement" && "Acuerdo de Usuario"}
                {legalModal === "public-offer" && "Oferta Pública"}
                {legalModal === "replacement" && "Política de Reemplazo de Bienes Digitales"}
                {legalModal === "rules" && "Reglas de la Plataforma"}
                {legalModal === "appendix1" && "Apéndice 1 – Productos y Servicios Prohibidos"}
                {legalModal === "appendix2" && "Apéndice 2 – Solicitudes de Autoridades Gubernamentales"}
              </h2>
              <button onClick={() => setLegalModal(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "var(--muted)", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.8, color: "var(--muted)", maxHeight: "70vh", overflowY: "auto" }}>
              {legalModal === "privacy" && <LegalPrivacy />}
              {legalModal === "user-agreement" && <LegalUserAgreement />}
              {legalModal === "public-offer" && <LegalPublicOffer />}
              {legalModal === "replacement" && <LegalReplacement />}
              {legalModal === "rules" && <LegalRules />}
              {legalModal === "appendix1" && <LegalAppendix1 />}
              {legalModal === "appendix2" && <LegalAppendix2 />}
            </div>
          </div>
        </div>
      )}

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="site-footer-logo">BM <span>Verificada</span></div>
          <div className="site-footer-links">
            <button className="site-footer-link" onClick={() => setLegalModal("privacy")}>Política de Privacidad</button>
            <button className="site-footer-link" onClick={() => setLegalModal("user-agreement")}>Acuerdo de Usuario</button>
            <button className="site-footer-link" onClick={() => setLegalModal("public-offer")}>Oferta Pública</button>
            <button className="site-footer-link" onClick={() => setLegalModal("replacement")}>Política de Reemplazo de Bienes Digitales</button>
            <button className="site-footer-link" onClick={() => setLegalModal("rules")}>Reglas de la Plataforma</button>
            <button className="site-footer-link" onClick={() => setLegalModal("appendix1")}>Productos Prohibidos</button>
            <button className="site-footer-link" onClick={() => setLegalModal("appendix2")}>Solicitudes Gubernamentales</button>
          </div>
          <div className="site-footer-copy">© {new Date().getFullYear()} BM Verificada</div>
        </div>
      </footer>

    </div>
  );
}
