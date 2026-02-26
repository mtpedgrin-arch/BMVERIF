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
  { id: "ORD-001", userId: 1, userEmail: "charlyxentorix@gmail.com", userName: "Charly Xentorix", items: [{ name: "BM Facebook · Verified · Europe/USA", price: 33.00, qty: 1 }], subtotal: 33.00, discount: 0, coupon: null, total: 33.00, network: "TRC20", txHash: "", status: "paid", date: "2026-02-20" },
  { id: "ORD-002", userId: 2, userEmail: "john@example.com", userName: "John Doe", items: [{ name: "BM Facebook · Verified · LATAM", price: 22.00, qty: 1 }, { name: "BM Facebook · Verified · Europe/USA", price: 33.00, qty: 1 }], subtotal: 55.00, discount: 10, coupon: "DEMO10", total: 49.50, network: "BEP20", txHash: "", status: "pending", date: "2026-02-22" },
];

// ─── COUPONS ─────────────────────────────────────────────────────────────────
const COUPON_DB = [
  { code: "DEMO10", discount: 10, used: false, usedBy: null, usedAt: null, createdAt: "2026-02-20" },
  { code: "VIP20", discount: 20, used: false, usedBy: null, usedAt: null, createdAt: "2026-02-22" },
  { code: "EXPIRED50", discount: 50, used: true, usedBy: "john@example.com", usedAt: "2026-02-23", createdAt: "2026-02-21" },
];

const PRODUCTS = [
  { id: "p1", name: "BM Facebook · Verified · Europe/USA", price: 33.00, type: "BM Verificada", delivery: "1–24h", stock: "High", desc: "Business Manager verificada para API." },
  { id: "p2", name: "BM Facebook · Verified · LATAM", price: 22.00, type: "BM Verificada", delivery: "1–24h", stock: "Medium", desc: "BM verificada para proyectos LATAM." },
  { id: "p3", name: "Business Suite · Setup + Pixel", price: 15.00, type: "Servicio", delivery: "24–48h", stock: "Disponible", desc: "Configuración completa para campañas." },
];

const ChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([{ from: "bot", text: "Hola 👋 ¿Necesitás ayuda con tu compra?" }]);
  const [txt, setTxt] = useState("");

  const send = () => {
    const t = txt.trim();
    if (!t) return;
    setMsgs(m => [...m, { from: "me", text: t }]);
    setTxt("");
    setTimeout(() => setMsgs(m => [...m, { from: "bot", text: "Perfecto, lo veo. ¿Querés pagar por TRC20 o BEP20?" }]), 500);
  };

  return (
    <div className="chat-root">
      {!open ? (
        <button className="chat-fab" onClick={() => setOpen(true)}>💬</button>
      ) : (
        <div className="chat-box">
          <div className="chat-head">
            <div style={{ fontWeight: 700 }}>Soporte</div>
            <button className="icon-btn" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="chat-body">
            {msgs.map((m, i) => (
              <div key={i} className={`chat-msg ${m.from === "me" ? "me" : "bot"}`}>{m.text}</div>
            ))}
          </div>
          <div className="chat-foot">
            <input className="chat-input" value={txt} onChange={e => setTxt(e.target.value)} placeholder="Escribí..." onKeyDown={e => e.key === "Enter" && send()} />
            <button className="btn btn-primary btn-sm" onClick={send}>Enviar</button>
          </div>
        </div>
      )}
    </div>
  );
};

const AuthModal = ({ onClose }) => {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>Iniciar sesión</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <p style={{ marginTop: 8, opacity: 0.9 }}>
          Para continuar con la compra necesitás iniciar sesión.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "flex-end" }}>
          <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => signIn()}>
            Ir a login
          </button>
        </div>
      </div>
    </div>
  );
};

const PaymentModal = ({ cart, user, coupon, finalTotal, onClose, onSuccess }) => {
  const [network, setNetwork] = useState("TRC20");
  const [hash, setHash] = useState("");
  const [loading, setLoading] = useState(false);

  const wallet = WALLETS[network];

  const submit = async () => {
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 800));
      onSuccess({ network, hash });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-title">Pago</div>
        <div className="modal-sub">Total: <b>${finalTotal.toFixed(2)}</b></div>

        <div className="seg">
          <div className="seg-title">Elegí red</div>
          <div className="seg-row">
            <button className={`seg-btn ${network === "TRC20" ? "active" : ""}`} onClick={() => setNetwork("TRC20")}>TRC20</button>
            <button className={`seg-btn ${network === "BEP20" ? "active" : ""}`} onClick={() => setNetwork("BEP20")}>BEP20</button>
          </div>

          <div className="pay-box" style={{ borderColor: wallet.color }}>
            <div className="pay-line"><span>{wallet.logo} {wallet.network}</span></div>
            <div className="pay-line"><small>Dirección:</small></div>
            <code className="addr">{wallet.addr}</code>
            <div className="pay-line"><small>Fee:</small> {wallet.fee} · <small>Tiempo:</small> {wallet.time}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Tx Hash (opcional)</label>
            <input className="form-input" value={hash} onChange={e => setHash(e.target.value)} placeholder="0x..." />
          </div>

          <button className="btn btn-primary btn-full" onClick={submit} disabled={loading}>
            {loading ? "Procesando..." : "Confirmar pago"}
          </button>
          <button className="btn btn-outline btn-full" onClick={onClose} style={{ marginTop: 8 }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

const SuccessModal = ({ order, onClose }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal" onClick={e => e.stopPropagation()}>
      <div className="modal-title">✅ Pago registrado</div>
      <div className="modal-sub">Orden <b>{order.id}</b> creada.</div>
      <button className="btn btn-primary btn-full" onClick={onClose} style={{ marginTop: 14 }}>Listo</button>
    </div>
  </div>
);

export default function App() {
  const { data: session, status } = useSession();
  const user = session?.user || null;
  const isAdmin = user?.role === "admin";

  const [view, setView] = useState("shop");
  const [cart, setCart] = useState([]);
  const [coupon, setCoupon] = useState("");
  const [couponInfo, setCouponInfo] = useState(null);
  const [couponErr, setCouponErr] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pendingCoupon, setPendingCoupon] = useState(null);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [orders, setOrders] = useState([...ORDERS_DB]);
  const [lastOrder, setLastOrder] = useState(null);

  const subtotal = cart.reduce((a, it) => a + it.price * it.qty, 0);
  const discount = couponInfo ? (subtotal * (couponInfo.discount / 100)) : 0;
  const total = Math.max(0, subtotal - discount);

  const add = p => {
    setCart(prev => {
      const i = prev.findIndex(x => x.id === p.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], qty: next[i].qty + 1 };
        return next;
      }
      return [...prev, { ...p, qty: 1 }];
    });
  };

  const dec = id => setCart(prev => prev.map(x => x.id === id ? { ...x, qty: Math.max(1, x.qty - 1) } : x));
  const rm = id => setCart(prev => prev.filter(x => x.id !== id));

  const applyCoupon = () => {
    const c = coupon.trim().toUpperCase();
    setCouponErr("");
    setCouponInfo(null);
    if (!c) return;

    const found = COUPON_DB.find(x => x.code === c);
    if (!found) return setCouponErr("Cupón inválido.");
    if (found.used) return setCouponErr("Cupón ya usado.");
    setCouponInfo(found);
  };

  const checkout = () => {
    if (!user) { setShowAuth(true); return; }
    if (!cart.length) return;
    setPendingCoupon(couponInfo);
    setPendingTotal(total);
    setShowPayment(true);
  };

  const handlePaySuccess = ({ network, hash }) => {
    const newOrder = {
      id: `ORD-${String(orders.length + 1).padStart(3, "0")}`,
      userId: user?.id ?? 0,
      userEmail: user?.email ?? "",
      userName: user?.name ?? "",
      items: cart.map(x => ({ name: x.name, price: x.price, qty: x.qty })),
      subtotal,
      discount: couponInfo ? couponInfo.discount : 0,
      coupon: couponInfo ? couponInfo.code : null,
      total,
      network,
      txHash: hash || "",
      status: "pending",
      date: new Date().toISOString().slice(0, 10),
    };
    setOrders(prev => [newOrder, ...prev]);
    setLastOrder(newOrder);
    setCart([]);
    setCoupon("");
    setCouponInfo(null);
    setShowPayment(false);
    setShowSuccess(true);
  };

  // --- UI ---
  return (
    <div className="app">
      <style jsx global>{`
        :root {
          --bg: #0b0f16;
          --card: rgba(255,255,255,0.06);
          --card2: rgba(255,255,255,0.04);
          --line: rgba(255,255,255,0.12);
          --muted: rgba(255,255,255,0.65);
          --text: rgba(255,255,255,0.92);
          --blue: #4ea3ff;
          --green: #34d399;
          --yellow: #fbbf24;
          --red: #fb7185;
        }
        body { background: var(--bg); color: var(--text); }
        .app { min-height: 100vh; padding: 18px; max-width: 1200px; margin: 0 auto; }
        .topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; background: var(--card); border: 1px solid var(--line); border-radius: 14px; position: sticky; top: 12px; backdrop-filter: blur(10px); z-index: 5; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .logo { width: 34px; height: 34px; border-radius: 12px; background: radial-gradient(circle at top left, #4ea3ff, #6d28d9); display: grid; place-items: center; font-weight: 900; }
        .title { font-weight: 900; letter-spacing: 0.2px; }
        .subtitle { font-size: 12px; color: var(--muted); margin-top: 2px; }
        .right { display: flex; align-items: center; gap: 10px; }
        .btn { border: 1px solid var(--line); background: var(--card2); color: var(--text); padding: 10px 12px; border-radius: 12px; cursor: pointer; font-weight: 700; }
        .btn:hover { filter: brightness(1.08); }
        .btn:active { transform: translateY(1px); }
        .btn-sm { padding: 7px 10px; border-radius: 10px; font-size: 13px; }
        .btn-full { width: 100%; }
        .btn-primary { background: rgba(78,163,255,0.18); border-color: rgba(78,163,255,0.35); }
        .btn-outline { background: transparent; }
        .icon-btn { border: 1px solid var(--line); background: var(--card2); color: var(--text); width: 34px; height: 34px; border-radius: 12px; cursor: pointer; }
        .grid { display: grid; grid-template-columns: 1fr 360px; gap: 14px; margin-top: 14px; }
        @media(max-width: 980px){ .grid{ grid-template-columns: 1fr; } }
        .card { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 14px; }
        .h { font-weight: 900; margin-bottom: 10px; }
        .products { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 12px; }
        @media(max-width: 700px){ .products{ grid-template-columns: 1fr; } }
        .product { background: var(--card2); border: 1px solid var(--line); border-radius: 16px; padding: 12px; }
        .pname { font-weight: 900; }
        .pdesc { font-size: 12px; color: var(--muted); margin-top: 6px; min-height: 34px; }
        .pmeta { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; font-size: 12px; color: var(--muted); }
        .tag { border: 1px solid var(--line); border-radius: 999px; padding: 4px 10px; background: rgba(255,255,255,0.03); }
        .prow { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
        .price { font-weight: 900; }
        .cart-line { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 10px 0; border-bottom: 1px dashed rgba(255,255,255,0.12); }
        .cart-line:last-child { border-bottom: none; }
        .qty { display: inline-flex; align-items: center; gap: 8px; }
        .qty button { width: 30px; height: 30px; border-radius: 10px; }
        .muted { color: var(--muted); font-size: 12px; }
        .input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: rgba(0,0,0,0.15); color: var(--text); }
        .row { display: flex; gap: 10px; align-items: center; }
        .row > * { flex: 1; }
        .error { color: var(--red); font-size: 12px; margin-top: 6px; }
        .totals { margin-top: 12px; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 12px; }
        .totals .line { display: flex; justify-content: space-between; margin: 6px 0; }
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: grid; place-items: center; padding: 18px; z-index: 50; }
        .modal { width: 100%; max-width: 520px; background: #0c1220; border: 1px solid rgba(255,255,255,0.14); border-radius: 18px; padding: 16px; }
        .modal-title { font-weight: 900; font-size: 18px; }
        .modal-sub { color: var(--muted); font-size: 12px; margin-top: 3px; }
        .seg { margin-top: 14px; }
        .seg-title { font-weight: 800; margin-bottom: 10px; }
        .seg-row { display: flex; gap: 8px; }
        .seg-btn { flex: 1; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: rgba(255,255,255,0.04); color: var(--text); cursor: pointer; }
        .seg-btn.active { border-color: rgba(78,163,255,0.5); background: rgba(78,163,255,0.14); }
        .pay-box { margin-top: 12px; border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 12px; background: rgba(255,255,255,0.03); }
        .pay-line { margin: 6px 0; }
        .addr { display: block; width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px dashed rgba(255,255,255,0.18); background: rgba(0,0,0,0.2); overflow-wrap: anywhere; }
        .form-group { margin-top: 12px; }
        .form-label { font-size: 12px; color: var(--muted); display: block; margin-bottom: 6px; }
        .form-input { width: 100%; padding: 10px 12px; border-radius: 12px; border: 1px solid var(--line); background: rgba(0,0,0,0.18); color: var(--text); }
        .chat-root { position: fixed; right: 16px; bottom: 16px; z-index: 60; }
        .chat-fab { width: 54px; height: 54px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.16); background: rgba(78,163,255,0.18); color: var(--text); font-size: 20px; cursor: pointer; }
        .chat-box { width: 320px; height: 380px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.16); background: #0c1220; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
        .chat-head { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.12); display: flex; align-items: center; justify-content: space-between; }
        .chat-body { flex: 1; padding: 10px 12px; overflow: auto; display: flex; flex-direction: column; gap: 8px; }
        .chat-msg { max-width: 85%; padding: 10px 12px; border-radius: 14px; font-size: 13px; }
        .chat-msg.bot { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.10); }
        .chat-msg.me { align-self: flex-end; background: rgba(78,163,255,0.16); border: 1px solid rgba(78,163,255,0.28); }
        .chat-foot { padding: 10px 12px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; gap: 8px; }
        .chat-input { flex: 1; padding: 10px 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14); background: rgba(0,0,0,0.18); color: var(--text); }
        .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: grid; place-items: center; padding: 18px; z-index: 60; }
        .modal-card { width: 100%; max-width: 420px; background: #0c1220; border: 1px solid rgba(255,255,255,0.16); border-radius: 18px; padding: 14px; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; }
      `}</style>

      <div className="topbar">
        <div className="brand">
          <div className="logo">B</div>
          <div>
            <div className="title">BMVERIF</div>
            <div className="subtitle">Marketplace · API Verified</div>
          </div>
        </div>

        <div className="right">
          {!user ? (
            <button className="btn btn-primary btn-sm" onClick={() => signIn()}>Iniciar sesión</button>
          ) : (
            <>
              <div className="subtitle" style={{ textAlign: "right" }}>
                {user.email}<br />
                <span style={{ color: isAdmin ? "var(--yellow)" : "var(--muted)" }}>
                  {isAdmin ? "ADMIN" : "USER"}
                </span>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => signOut()}>Salir</button>
              <button
                className="btn btn-outline btn-sm"
                style={{ background: "none", border: "none", fontSize: 12, color: "var(--muted)", padding: "6px 8px" }}
                onClick={() => { if (isAdmin) setView("admin"); else alert("No autorizado"); }}
              >
                Admin
              </button>
            </>
          )}
          <button className="cart-fab btn btn-outline btn-sm" onClick={() => setView("shop")}>Tienda</button>
          <button className="cart-fab btn btn-outline btn-sm" onClick={() => setView("account")}>Mi cuenta</button>
        </div>
      </div>

      <div className="grid">
        <div className="card">
          <div className="h">Productos</div>
          <div className="products">
            {PRODUCTS.map(p => (
              <div className="product" key={p.id}>
                <div className="pname">{p.name}</div>
                <div className="pdesc">{p.desc}</div>
                <div className="pmeta">
                  <span className="tag">{p.type}</span>
                  <span className="tag">Entrega: {p.delivery}</span>
                  <span className="tag">Stock: {p.stock}</span>
                </div>
                <div className="prow">
                  <div className="price">${p.price.toFixed(2)}</div>
                  <button className="btn btn-primary btn-sm" onClick={() => add(p)}>Agregar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="h">Carrito</div>

          {cart.length === 0 ? (
            <div className="muted" style={{ padding: "18px 0" }}>Tu carrito está vacío.</div>
          ) : (
            <>
              {cart.map(it => (
                <div className="cart-line" key={it.id}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{it.name}</div>
                    <div className="muted">${it.price.toFixed(2)} c/u</div>
                  </div>
                  <div className="qty">
                    <button className="btn btn-outline btn-sm" onClick={() => dec(it.id)}>-</button>
                    <div style={{ width: 20, textAlign: "center", fontWeight: 800 }}>{it.qty}</div>
                    <button className="btn btn-outline btn-sm" onClick={() => add(it)}>+</button>
                    <button className="btn btn-outline btn-sm" onClick={() => rm(it.id)}>✕</button>
                  </div>
                </div>
              ))}

              <div className="row" style={{ marginTop: 10 }}>
                <input className="input" value={coupon} onChange={e => setCoupon(e.target.value)} placeholder="Cupón (ej: DEMO10)" />
                <button className="btn btn-outline" onClick={applyCoupon}>Aplicar</button>
              </div>
              {couponErr && <div className="error">{couponErr}</div>}
              {couponInfo && <div className="muted" style={{ marginTop: 6 }}>Cupón {couponInfo.code} aplicado: {couponInfo.discount}%</div>}

              <div className="totals">
                <div className="line"><span className="muted">Subtotal</span><b>${subtotal.toFixed(2)}</b></div>
                <div className="line"><span className="muted">Descuento</span><b>-${discount.toFixed(2)}</b></div>
                <div className="line"><span className="muted">Total</span><b>${total.toFixed(2)}</b></div>
              </div>

              <button className="btn btn-primary btn-full" style={{ marginTop: 12 }} onClick={checkout}>
                Pagar →
              </button>
            </>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showPayment && <PaymentModal cart={cart} user={user} coupon={pendingCoupon} finalTotal={pendingTotal} onClose={() => setShowPayment(false)} onSuccess={handlePaySuccess} />}
      {showSuccess && lastOrder && <SuccessModal order={lastOrder} onClose={() => { setShowSuccess(false); setView("account"); }} />}

      <ChatWidget />
    </div>
  );
}