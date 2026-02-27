import Providers from "./providers";

export const metadata = {
  title: "BM Verificada · Business Manager Premium",
  description: "Business Manager verificados · Entrega inmediata · Pago USDT TRC20 / BEP20",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
        }}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
