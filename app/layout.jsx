import Script from "next/script";
import Providers from "./providers";

export const metadata = {
  metadataBase: new URL("https://bmverificada.store"),
  title: {
    default: "BM Verificada · Business Manager Facebook Verificado",
    template: "%s · BM Verificada",
  },
  description:
    "Comprá Business Managers Verificados de Facebook con API de WhatsApp habilitada. Entrega en 5-30 min. Cuentas con acceso total y verificación oficial Meta. Pago USDT.",
  keywords: [
    "business manager verificado",
    "bm verificada",
    "bm verificado facebook",
    "api whatsapp business",
    "api whatsapp facebook",
    "cuentas publicitarias facebook",
    "business manager facebook comprar",
    "cuentas meta ads",
    "bm facebook premium",
    "comprar business manager",
  ],
  alternates: {
    canonical: "https://bmverificada.store",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    title: "BM Verificada · Business Manager Facebook Verificado",
    description:
      "Comprá Business Managers Verificados de Facebook con API de WhatsApp habilitada. Entrega en 5-30 min. Pago USDT.",
    url: "https://bmverificada.store",
    siteName: "BM Verificada",
    locale: "es_AR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BM Verificada · Business Manager Facebook Verificado",
    description:
      "Business Managers verificados con API de WhatsApp habilitada. Entrega en 5-30 min. Pago USDT.",
  },
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  other: {
    cryptomus: "3c4bc7a4",
    "facebook-domain-verification": "l9e08q5h1e5rr1w508fru1x6uky5f1",
  },
};

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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
        {/* ── JSON-LD: Organization ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "BM Verificada",
              url: "https://bmverificada.store",
              logo: "https://bmverificada.store/logo.png",
              description:
                "Tienda de Business Managers Verificados de Facebook con API de WhatsApp habilitada. Entrega en 5-30 min.",
            }),
          }}
        />
        {/* ── JSON-LD: WebSite ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "BM Verificada",
              url: "https://bmverificada.store",
              inLanguage: "es",
              description:
                "Comprá Business Managers Verificados de Facebook con API de WhatsApp habilitada.",
            }),
          }}
        />
        {/* ── Meta Pixel base code ── */}
        {PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
