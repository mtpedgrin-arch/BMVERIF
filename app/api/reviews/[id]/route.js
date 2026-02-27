import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

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

// DELETE /api/reviews/[id] — admin only
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  const [review] = await prisma.$queryRawUnsafe(
    `SELECT "productId" FROM "Review" WHERE id = $1`, id
  );
  if (!review) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.$executeRawUnsafe(`DELETE FROM "Review" WHERE id = $1`, id);
  await recalcProduct(review.productId);

  return NextResponse.json({ ok: true });
}
