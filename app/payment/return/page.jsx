"use client";
import { Suspense } from "react";
import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

function PaymentReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const orderId = searchParams.get("orderId");

  const [state, setState] = useState("checking"); // checking | paid | pending | expired | error
  const [txHash, setTxHash] = useState(null);
  const pollRef = useRef(null);
  const attemptsRef = useRef(0);
  const MAX_ATTEMPTS = 20; // ~60 segundos de polling

  const clearCart = () => {
    try { localStorage.removeItem("bmveri_cart"); } catch {}
  };

  const checkPayment = async () => {
    if (!orderId || !session?.user) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/check-payment`);
      const data = await res.json();

      if (data.paid) {
        clearCart();
        setTxHash(data.txHash);
        setState("paid");
        if (pollRef.current) clearInterval(pollRef.current);
        // Fire client-side Meta Purchase event (deduped with CAPI via eventID)
        try {
          if (typeof window !== "undefined" && window.fbq) {
            window.fbq("track", "Purchase", {
              value: data.amount ?? 0,
              currency: "USD",
            }, { eventID: `purchase_${orderId}` });
          }
        } catch {}
        return;
      }
      if (data.expired) {
        setState("expired");
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }

      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setState("pending");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {
      attemptsRef.current += 1;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        setState("error");
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }
  };

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) { router.replace("/"); return; }
    if (!orderId) { router.replace("/"); return; }

    checkPayment();
    pollRef.current = setInterval(checkPayment, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [sessionStatus, session, orderId]);

  const goToOrders = () => router.push("/?view=account");
  const goToShop = () => router.push("/");

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#0f1117",
      fontFamily: "'DM Sans', sans-serif",
      padding: "20px",
    }}>
      <div style={{
        background: "#1a1d27",
        border: "1.5px solid #2a2d3a",
        borderRadius: 20,
        padding: "48px 40px",
        maxWidth: 480,
        width: "100%",
        textAlign: "center",
        boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
      }}>

        {/* CHECKING */}
        {state === "checking" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🔍</div>
            <h2 style={{ color: "#fff", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
              Verificando tu pago
            </h2>
            <p style={{ color: "#8b8fa8", fontSize: 15, marginBottom: 28 }}>
              Estamos confirmando tu transacción en la blockchain. Esto puede demorar unos segundos.
            </p>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{
                width: 40, height: 40,
                border: "3px solid #2a2d3a",
                borderTop: "3px solid #26a17b",
                borderRadius: "50%",
                animation: "spin 0.9s linear infinite",
              }} />
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </>
        )}

        {/* PAID ✅ */}
        {state === "paid" && (
          <>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 style={{ color: "#26a17b", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 24, marginBottom: 12 }}>
              ¡Pago confirmado!
            </h2>
            <p style={{ color: "#8b8fa8", fontSize: 15, marginBottom: 8 }}>
              Tu pago fue procesado exitosamente. En breve recibirás un email de confirmación.
            </p>
            {txHash && (
              <p style={{ color: "#5a5e72", fontSize: 12, marginBottom: 24, wordBreak: "break-all" }}>
                TX: {txHash}
              </p>
            )}
            <button onClick={goToOrders} style={{
              width: "100%", padding: "13px", background: "#26a17b",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}>
              Ver mis órdenes →
            </button>
          </>
        )}

        {/* PENDING ⏳ */}
        {state === "pending" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
            <h2 style={{ color: "#f59e0b", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
              Pago en proceso
            </h2>
            <p style={{ color: "#8b8fa8", fontSize: 15, marginBottom: 24 }}>
              Tu pago todavía no fue confirmado en la blockchain. Puede demorar algunos minutos.
              Podés seguir el estado desde &quot;Mis Órdenes&quot;.
            </p>
            <button onClick={goToOrders} style={{
              width: "100%", padding: "13px", background: "#f59e0b",
              color: "#000", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "Syne, sans-serif", marginBottom: 12,
            }}>
              Ver mis órdenes
            </button>
            <button onClick={goToShop} style={{
              width: "100%", padding: "11px", background: "transparent",
              color: "#8b8fa8", border: "1.5px solid #2a2d3a", borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Volver a la tienda
            </button>
          </>
        )}

        {/* EXPIRED ❌ */}
        {state === "expired" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>❌</div>
            <h2 style={{ color: "#ef4444", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
              Orden expirada
            </h2>
            <p style={{ color: "#8b8fa8", fontSize: 15, marginBottom: 24 }}>
              La orden venció antes de que se confirmara el pago. Si ya realizaste la transferencia,
              contactá a soporte con el comprobante.
            </p>
            <button onClick={goToShop} style={{
              width: "100%", padding: "13px", background: "#1877F2",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "Syne, sans-serif", marginBottom: 12,
            }}>
              Volver a la tienda
            </button>
            <button onClick={goToOrders} style={{
              width: "100%", padding: "11px", background: "transparent",
              color: "#8b8fa8", border: "1.5px solid #2a2d3a", borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>
              Ver mis órdenes
            </button>
          </>
        )}

        {/* ERROR */}
        {state === "error" && (
          <>
            <div style={{ fontSize: 56, marginBottom: 16 }}>⚠️</div>
            <h2 style={{ color: "#f59e0b", fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: 22, marginBottom: 12 }}>
              Error al verificar
            </h2>
            <p style={{ color: "#8b8fa8", fontSize: 15, marginBottom: 24 }}>
              No pudimos verificar el estado de tu pago. Chequeá &quot;Mis Órdenes&quot; o contactá a soporte.
            </p>
            <button onClick={goToOrders} style={{
              width: "100%", padding: "13px", background: "#1877F2",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 700, cursor: "pointer",
              fontFamily: "Syne, sans-serif",
            }}>
              Ver mis órdenes
            </button>
          </>
        )}

        <p style={{ color: "#3d4056", fontSize: 12, marginTop: 28 }}>
          BM Verificada · Business Managers Verificados
        </p>
      </div>
    </div>
  );
}

// Suspense boundary requerido por Next.js 15 para useSearchParams()
export default function PaymentReturnPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f1117" }}>
        <div style={{ width: 40, height: 40, border: "3px solid #2a2d3a", borderTop: "3px solid #26a17b", borderRadius: "50%", animation: "spin 0.9s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    }>
      <PaymentReturn />
    </Suspense>
  );
}
