import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// GET /api/blog/[id]          → by id (admin)
// GET /api/blog/[slug]?slug=true → by slug (public page)
export async function GET(req, { params }) {
  const { id } = params;
  const { searchParams } = new URL(req.url);
  const bySlug = searchParams.get("slug") === "true";

  const post = bySlug
    ? await prisma.blogPost.findUnique({ where: { slug: id } })
    : await prisma.blogPost.findUnique({ where: { id } });

  if (!post) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Public access: only published posts
  const session = await getServerSession(authOptions);
  const isStaff = ["admin", "support"].includes(session?.user?.role);
  if (!post.published && !isStaff) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  return NextResponse.json(post);
}

// PATCH /api/blog/[id] → update (admin only)
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const existing = await prisma.blogPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const wasPublished = existing.published;
  const nowPublished =
    body.published !== undefined ? Boolean(body.published) : existing.published;

  const post = await prisma.blogPost.update({
    where: { id },
    data: {
      title:     body.title?.trim()   ?? existing.title,
      excerpt:   body.excerpt?.trim() ?? existing.excerpt,
      content:   body.content?.trim() ?? existing.content,
      published: nowPublished,
      // Allow manual override of publishedAt (admin only), otherwise set on first publish
      publishedAt: body.publishedAt
        ? new Date(body.publishedAt)
        : nowPublished && !wasPublished
        ? new Date()
        : existing.publishedAt,
    },
  });
  return NextResponse.json(post);
}

// DELETE /api/blog/[id] → delete (admin only)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  await prisma.blogPost.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
