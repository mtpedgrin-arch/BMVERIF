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
                  name: "¿Qué es un Business Manager Verificado?",
                  acceptedAnswer: { "@type": "Answer", text: "Es una cuenta empresarial de Meta (Facebook) que completó el proceso oficial de verificación. Al estar verificada, tiene acceso a mayores límites de gasto, más cuentas publicitarias y la API de WhatsApp habilitada desde el primer día." },
                },
                {
                  "@type": "Question",
                  name: "¿Qué es la API de WhatsApp?",
                  acceptedAnswer: { "@type": "Answer", text: "La API de WhatsApp Business permite a las empresas enviar mensajes masivos, automatizar comunicaciones y conectar WhatsApp con sus sistemas de CRM o marketing. Solo cuentas con un Business Manager verificado tienen acceso completo a esta API." },
                },
                {
                  "@type": "Question",
                  name: "¿Cómo es la entrega del producto?",
                  acceptedAnswer: { "@type": "Answer", text: "La entrega puede demorar entre 5 y 30 minutos dependiendo del pedido. Una vez procesada tu orden, podés acceder a las credenciales y accesos desde tu cuenta: Mi Cuenta → Mis Órdenes → hacé clic en el pedido correspondiente." },
                },
                {
                  "@type": "Question",
                  name: "¿Cómo funciona el pago en USDT?",
                  acceptedAnswer: { "@type": "Answer", text: "Aceptamos USDT tanto en red TRC20 (Tron) como BEP20 (Binance Smart Chain). Al crear tu orden se genera un monto único con centavos aleatorios para identificar tu pago automáticamente. Solo debés enviar el monto exacto indicado." },
                },
                {
                  "@type": "Question",
                  name: "¿Hay reemplazo si la cuenta es baneada?",
                  acceptedAnswer: { "@type": "Answer", text: "Ofrecemos soporte post-venta para casos de inconvenientes. Contactá a nuestro equipo vía Telegram o email dentro de las 24 hs de recibir el producto para evaluar cada caso." },
                },
                {
                  "@type": "Question",
                  name: "¿Puedo tener múltiples cuentas publicitarias dentro del BM?",
                  acceptedAnswer: { "@type": "Answer", text: "Sí. Los Business Managers Verificados permiten crear y administrar significativamente más cuentas publicitarias que los BM no verificados, facilitando el escalado de campañas." },
                },
                {
                  "@type": "Question",
                  name: "¿Necesito una cuenta personal de Facebook?",
                  acceptedAnswer: { "@type": "Answer", text: "No es necesario asociar tu cuenta personal de Facebook al BM que adquirís. El BM viene listo para usar de forma independiente." },
                },
                {
                  "@type": "Question",
                  name: "¿Cómo me registro en BM Verificada?",
                  acceptedAnswer: { "@type": "Answer", text: "Hacé clic en «Registrarse» en la barra superior, completá tu email y contraseña, y ya podés comenzar a comprar. No se requiere información adicional para el registro." },
                },
                {
                  "@type": "Question",
                  name: "¿Qué pasa si Meta revoca la verificación?",
                  acceptedAnswer: { "@type": "Answer", text: "Aunque es poco frecuente, en caso de que Meta revoque la verificación de la cuenta adquirida dentro del período de soporte, nuestro equipo evaluará la situación y buscará la mejor solución para vos." },
                },
                {
                  "@type": "Question",
                  name: "¿Cómo contacto al soporte?",
                  acceptedAnswer: { "@type": "Answer", text: "Podés contactarnos por el chat interno del sitio (ícono 🎧 en la barra superior), por Telegram a @bmverificada_support o por email a soporte@bmverificada.com. El horario de atención es de lunes a viernes de 9 a 18 hs (GMT-3)." },
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
