import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// GET /api/blog          → published posts (public)
// GET /api/blog?all=true → all posts incl. drafts (admin only)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  if (all) {
    const session = await getServerSession(authOptions);
    if (!["admin", "support"].includes(session?.user?.role)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const posts = await prisma.blogPost.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(posts);
  }

  const posts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      imageUrl: true,
      publishedAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json(posts);
}

// POST /api/blog → create post (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { title, excerpt, content, published, imageUrl } = await req.json();
  if (!title?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: "Título y contenido son obligatorios." },
      { status: 400 }
    );
  }

  // Generate unique slug
  let base = slugify(title);
  let slug = base;
  let counter = 1;
  while (await prisma.blogPost.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }

  const isPublished = Boolean(published);
  const post = await prisma.blogPost.create({
    data: {
      title: title.trim(),
      slug,
      excerpt: excerpt?.trim() || null,
      content: content.trim(),
      imageUrl: imageUrl?.trim() || null,
      published: isPublished,
      publishedAt: isPublished ? new Date() : null,
    },
  });
  return NextResponse.json(post);
}
