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
        {/* ── JSON-LD: FAQPage ── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "¿Qué brinda la verificación de Facebook Business Manager?",
                  acceptedAnswer: { "@type": "Answer", text: "Desbloquea capacidades publicitarias avanzadas, reduce el riesgo de baneos y aumenta la confianza de Meta en el negocio." },
                },
                {
                  "@type": "Question",
                  name: "¿Puedo comprar un Business Manager verificado listo para usar?",
                  acceptedAnswer: { "@type": "Answer", text: "Sí, en BM Verificada ofrecemos Business Managers Verificados listos para usar, con API de WhatsApp habilitada y entrega en 5 a 30 minutos." },
                },
                {
                  "@type": "Question",
                  name: "¿Qué riesgos tiene comprar una cuenta verificada?",
                  acceptedAnswer: { "@type": "Answer", text: "Es importante elegir un proveedor confiable. En BM Verificada ofrecemos garantía de reemplazo si hay algún inconveniente dentro del plazo acordado." },
                },
                {
                  "@type": "Question",
                  name: "¿Quién necesita un Business Manager verificado?",
                  acceptedAnswer: { "@type": "Answer", text: "Son ideales para agencias de publicidad, dueños de e-commerce, especialistas en arbitraje y cualquier negocio que trabaje con anuncios de Facebook a escala." },
                },
                {
                  "@type": "Question",
                  name: "¿Cuántas cuentas publicitarias puede manejar un BM verificado?",
                  acceptedAnswer: { "@type": "Answer", text: "Las cuentas verificadas permiten manejar significativamente más cuentas publicitarias que los BM regulares, facilitando el escalado de campañas." },
                },
                {
                  "@type": "Question",
                  name: "¿Cómo recibo el producto después de pagar?",
                  acceptedAnswer: { "@type": "Answer", text: "La entrega puede demorar entre 5 y 30 minutos. Una vez procesada tu orden, podés acceder a las credenciales desde Mi Cuenta → Mis Órdenes → tu pedido." },
                },
                {
                  "@type": "Question",
                  name: "¿Qué métodos de pago aceptan?",
                  acceptedAnswer: { "@type": "Answer", text: "Aceptamos pagos en USDT (Tether) a través de las redes TRC20 y BEP20, lo que garantiza transacciones seguras y anónimas." },
                },
                {
                  "@type": "Question",
                  name: "¿Ofrecen garantía o reemplazo?",
                  acceptedAnswer: { "@type": "Answer", text: "Sí, ofrecemos garantía de reemplazo en caso de inconvenientes con el producto dentro del plazo acordado en cada plan." },
                },
                {
                  "@type": "Question",
                  name: "¿La verificación previene los baneos de Meta?",
                  acceptedAnswer: { "@type": "Answer", text: "Reduce considerablemente la probabilidad de baneos, aunque siempre es importante respetar las políticas publicitarias de Meta para mantener la cuenta activa." },
                },
                {
                  "@type": "Question",
                  name: "¿Tienen soporte post-venta?",
                  acceptedAnswer: { "@type": "Answer", text: "Sí, contamos con soporte post-venta incluido. Podés contactarnos desde el chat del sitio ante cualquier duda o inconveniente con tu compra." },
                },
              ],
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
