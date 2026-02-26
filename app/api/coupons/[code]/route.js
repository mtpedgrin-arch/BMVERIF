import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/coupons/[code] — activa o pausa un cupón
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { code } = params;
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon) return NextResponse.json({ error: "Cupón no encontrado" }, { status: 404 });

  const updated = await prisma.coupon.update({
    where: { code },
    data: { active: !coupon.active },
  });
  return NextResponse.json(updated);
}

// DELETE /api/coupons/[code] — elimina un cupón
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { code } = params;
  await prisma.coupon.delete({ where: { code } });
  return NextResponse.json({ ok: true });
}
