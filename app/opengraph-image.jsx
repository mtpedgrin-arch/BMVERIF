import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BM Verificada – Business Manager Facebook Verificado";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 60%, #111 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#D92B2B",
          }}
        />

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 86, fontWeight: 900, color: "#ffffff", letterSpacing: -2 }}>
            BM
          </div>
          <div style={{ fontSize: 86, fontWeight: 900, color: "#D92B2B", letterSpacing: -2 }}>
            Verificada
          </div>
        </div>

        {/* Divider */}
        <div
          style={{
            width: 80,
            height: 3,
            background: "#D92B2B",
            borderRadius: 2,
            marginBottom: 28,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            fontSize: 34,
            color: "#dddddd",
            textAlign: "center",
            maxWidth: 820,
            fontWeight: 600,
            lineHeight: 1.4,
          }}
        >
          Business Manager Facebook Verificado
        </div>

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#888888",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          API de Publicidad habilitada · Entrega inmediata · Pago USDT
        </div>

        {/* URL badge */}
        <div
          style={{
            marginTop: 52,
            padding: "12px 32px",
            borderRadius: 999,
            border: "2px solid #D92B2B",
            color: "#D92B2B",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          bmverificada.store
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#D92B2B",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
