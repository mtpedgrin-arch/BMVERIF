import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/favorites — favoritos del usuario logueado
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([]);

  const favs = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { productId: true },
  });
  return NextResponse.json(favs.map(f => f.productId));
}

// POST /api/favorites — toggle favorito { productId }
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { productId } = await req.json();
  if (!productId) return NextResponse.json({ error: "Falta productId." }, { status: 400 });

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: session.user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  } else {
    await prisma.favorite.create({ data: { userId: session.user.id, productId } });
    return NextResponse.json({ liked: true });
  }
}
