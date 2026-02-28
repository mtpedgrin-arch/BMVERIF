import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

const ALLOWED = ["admin", "support"];

// GET /api/coupons — lista todos los cupones (admin o soporte)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!ALLOWED.includes(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

// POST /api/coupons — crea un cupón (admin sin límite; soporte con límites de permisos)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!ALLOWED.includes(session?.user?.role)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code, discount, maxUses } = await req.json();
  if (!code || !discount || !maxUses) {
    return NextResponse.json({ error: "Faltan campos" }, { status: 400 });
  }

  const d = parseInt(discount);
  const u = parseInt(maxUses);

  if (isNaN(d) || d < 1 || d > 100) {
    return NextResponse.json({ error: "El descuento debe ser entre 1 y 100." }, { status: 400 });
  }

  // Enforce support user limits
  if (session.user.role === "support") {
    const perms = session.user.permissions || {};
    const maxDiscount = parseInt(perms.couponMaxDiscount) || 5;
    const maxUsesLimit = parseInt(perms.couponMaxUses) || 1;
    if (d > maxDiscount) {
      return NextResponse.json({ error: `Tu cuenta solo puede crear cupones de hasta ${maxDiscount}%.` }, { status: 403 });
    }
    if (u > maxUsesLimit) {
      return NextResponse.json({ error: `Tu cuenta solo puede crear cupones de hasta ${maxUsesLimit} uso(s).` }, { status: 403 });
    }
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ error: "Ese código ya existe" }, { status: 400 });
  }
  const coupon = await prisma.coupon.create({
    data: { code, discount: d, maxUses: u, uses: 0, active: true },
  });
  return NextResponse.json(coupon);
}
