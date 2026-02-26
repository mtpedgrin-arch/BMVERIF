import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// POST /api/coupons/apply — valida un cupón (cualquier usuario)
export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code: code.toUpperCase().trim() } });

  if (!coupon) return NextResponse.json({ error: "Cupón inválido." }, { status: 404 });
  if (!coupon.active) return NextResponse.json({ error: "Ese cupón está pausado." }, { status: 400 });
  if (coupon.uses >= coupon.maxUses) return NextResponse.json({ error: "Ese cupón ya fue usado el máximo de veces." }, { status: 400 });

  return NextResponse.json({ code: coupon.code, discount: coupon.discount });
}
