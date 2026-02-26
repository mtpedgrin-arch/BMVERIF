import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/coupons — lista todos los cupones (solo admin)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

// POST /api/coupons — crea un cupón (solo admin)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { code, discount, maxUses } = await req.json();
  if (!code || !discount || !maxUses) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Ese código ya existe" }, { status: 400 });
  }
  const coupon = await prisma.coupon.create({
    data: { code, discount: parseInt(discount), maxUses: parseInt(maxUses), uses: 0, active: true },
  });
  return NextResponse.json(coupon);
}
