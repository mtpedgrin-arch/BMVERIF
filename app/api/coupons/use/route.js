import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// POST /api/coupons/use — incrementa el contador cuando se paga con cupón
export async function POST(req) {
  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Código requerido" }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });

  const updated = await prisma.coupon.update({
    where: { code },
    data: { uses: { increment: 1 } },
  });

  return NextResponse.json({ ok: true, uses: updated.uses, maxUses: updated.maxUses });
}
