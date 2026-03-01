import Link from "next/link";

export const metadata = {
  title: "Blog · BM Verificada",
  description:
    "Artículos sobre Business Managers Verificados, API de WhatsApp, cuentas Meta Ads y pagos en USDT.",
  alternates: { canonical: "https://bmverificada.store/blog" },
  openGraph: {
    title: "Blog · BM Verificada",
    description:
      "Guías y noticias sobre Business Managers Verificados y publicidad en Meta.",
    url: "https://bmverificada.store/blog",
    siteName: "BM Verificada",
    locale: "es_AR",
    type: "website",
  },
};

const BASE = process.env.NEXTAUTH_URL || "https://bmverificada.store";

async function getPosts() {
  try {
    const res = await fetch(`${BASE}/api/blog`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function BlogPage() {
  const posts = await getPosts();

  return (
    <main
      style={{
        maxWidth: 800,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <a
          href="/"
          style={{
            fontSize: 13,
            color: "#D92B2B",
            textDecoration: "none",
            fontWeight: 600,
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            marginBottom: 20,
          }}
        >
          ← Volver a la tienda
        </a>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(26px, 5vw, 36px)",
            fontWeight: 800,
            margin: "0 0 8px",
            color: "#1a1a1a",
          }}
        >
          Blog
        </h1>
        <p style={{ color: "#777", fontSize: 15, margin: 0 }}>
          Guías, novedades y consejos sobre Business Managers Verificados y publicidad en Meta.
        </p>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#999", fontSize: 15 }}>
          No hay artículos publicados aún. ¡Volvé pronto!
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                background: "#fff",
                border: "1.5px solid #e8e4df",
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
              }}
            >
              {/* Image */}
              {post.imageUrl && (
                <Link href={`/blog/${post.slug}`} style={{ display: "block" }}>
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    style={{
                      width: "100%",
                      height: 200,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                </Link>
              )}

              {/* Content */}
              <div style={{ padding: "22px 26px" }}>
                <Link href={`/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                  <h2
                    style={{
                      fontFamily: "Syne, sans-serif",
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#1a1a1a",
                      marginBottom: 8,
                      marginTop: 0,
                      lineHeight: 1.3,
                    }}
                  >
                    {post.title}
                  </h2>
                </Link>

                {post.excerpt && (
                  <p style={{ color: "#777", fontSize: 14, lineHeight: 1.65, marginBottom: 16, marginTop: 0 }}>
                    {post.excerpt}
                  </p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: 12, color: "#aaa" }}>
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("es-AR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                  <Link
                    href={`/blog/${post.slug}`}
                    style={{
                      background: "#D92B2B",
                      color: "#fff",
                      padding: "7px 16px",
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    Leer más →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "Blog · BM Verificada",
            url: "https://bmverificada.store/blog",
            description: "Artículos sobre Business Managers Verificados y publicidad en Meta.",
            blogPost: posts.map((p) => ({
              "@type": "BlogPosting",
              headline: p.title,
              url: `https://bmverificada.store/blog/${p.slug}`,
              datePublished: p.publishedAt,
              description: p.excerpt,
              image: p.imageUrl,
            })),
          }),
        }}
      />
    </main>
  );
}
