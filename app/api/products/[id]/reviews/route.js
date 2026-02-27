import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { prisma } from "../../../../../lib/prisma";
// Simple cuid-style unique ID generator
function createId() {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// Helper: anonymize user name for display  "Roberto" → "R***o"
function anonymize(name) {
  if (!name) return "Usuario";
  const clean = name.trim();
  if (clean.length <= 2) return clean + "***";
  return clean[0] + "***" + clean[clean.length - 1];
}

// Helper: recalculate product rating + review count
async function recalcProduct(productId) {
  const all = await prisma.$queryRawUnsafe(
    `SELECT rating FROM "Review" WHERE "productId" = $1`, productId
  );
  const count = all.length;
  const avg = count > 0 ? all.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round(avg * 100) / 100, reviews: count },
  });
}

// GET /api/products/[id]/reviews — public
export async function GET(req, { params }) {
  const { id } = params;
  const rows = await prisma.$queryRawUnsafe(
    `SELECT id, "productId", rating, comment, "userName", "createdAt"
     FROM "Review" WHERE "productId" = $1 ORDER BY "createdAt" DESC`, id
  );
  return NextResponse.json(rows);
}

// POST /api/products/[id]/reviews — logged-in user OR admin (with custom name)
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const rating = parseInt(body.rating);
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating inválido (1-5)" }, { status: 400 });
  }

  const isAdmin = session.user.role === "admin";
  // Admin can supply a custom display name; regular users get anonymized name
  const userName = isAdmin && body.adminName?.trim()
    ? body.adminName.trim()
    : anonymize(session.user.name || session.user.email);

  const reviewId = createId();
  await prisma.$executeRawUnsafe(
    `INSERT INTO "Review" (id, "productId", rating, comment, "userName", "createdAt", "userId")
     VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
    reviewId, id, rating, body.comment?.trim() || null, userName, session.user.id || null
  );

  await recalcProduct(id);

  const [review] = await prisma.$queryRawUnsafe(
    `SELECT id, "productId", rating, comment, "userName", "createdAt" FROM "Review" WHERE id = $1`, reviewId
  );
  return NextResponse.json({ review });
}
