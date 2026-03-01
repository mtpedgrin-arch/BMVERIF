import { notFound } from "next/navigation";

const BASE = process.env.NEXTAUTH_URL || "https://bmverificada.store";

async function getPost(slug) {
  try {
    const res = await fetch(`${BASE}/api/blog/${slug}?slug=true`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  if (!post) return {};
  return {
    title: `${post.title} · BM Verificada`,
    description: post.excerpt || post.title,
    alternates: {
      canonical: `https://bmverificada.store/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt || post.title,
      url: `https://bmverificada.store/blog/${post.slug}`,
      siteName: "BM Verificada",
      locale: "es_AR",
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      ...(post.imageUrl && { images: [{ url: post.imageUrl, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt || post.title,
      ...(post.imageUrl && { images: [post.imageUrl] }),
    },
  };
}

export default async function BlogPostPage({ params }) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  const htmlContent = post.content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n\n/g, "</p><p style='margin:0 0 16px'>")
    .replace(/\n/g, "<br/>");

  return (
    <main
      style={{
        maxWidth: 760,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial",
      }}
    >
      {/* Breadcrumb */}
      <nav
        style={{
          fontSize: 13,
          color: "#999",
          marginBottom: 28,
          display: "flex",
          gap: 6,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <a href="/" style={{ color: "#999", textDecoration: "none" }}>Inicio</a>
        <span>/</span>
        <a href="/blog" style={{ color: "#999", textDecoration: "none" }}>Blog</a>
        <span>/</span>
        <span style={{ color: "#444" }}>{post.title}</span>
      </nav>

      <article>
        <h1
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(24px, 4vw, 36px)",
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: 12,
            color: "#1a1a1a",
          }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p style={{ fontSize: 16, color: "#666", lineHeight: 1.65, marginBottom: 16, marginTop: 0 }}>
            {post.excerpt}
          </p>
        )}

        <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>
          {post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : ""}
        </div>

        {/* Hero image */}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: 420,
              objectFit: "cover",
              borderRadius: 14,
              marginBottom: 32,
              display: "block",
            }}
          />
        )}

        {!post.imageUrl && (
          <hr style={{ border: "none", borderTop: "1.5px solid #efefef", marginBottom: 32 }} />
        )}

        <div
          style={{ fontSize: 15, lineHeight: 1.85, color: "#333" }}
          dangerouslySetInnerHTML={{
            __html: `<p style="margin:0 0 16px">${htmlContent}</p>`,
          }}
        />
      </article>

      {/* Back link */}
      <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1.5px solid #efefef" }}>
        <a
          href="/blog"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "#D92B2B",
            fontWeight: 700,
            fontSize: 14,
            textDecoration: "none",
          }}
        >
          ← Volver al Blog
        </a>
      </div>

      {/* JSON-LD BlogPosting */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.title,
            description: post.excerpt,
            url: `https://bmverificada.store/blog/${post.slug}`,
            datePublished: post.publishedAt,
            dateModified: post.updatedAt,
            image: post.imageUrl,
            inLanguage: "es",
            publisher: {
              "@type": "Organization",
              name: "BM Verificada",
              logo: { "@type": "ImageObject", url: "https://bmverificada.store/logo.png" },
            },
          }),
        }}
      />
    </main>
  );
}
