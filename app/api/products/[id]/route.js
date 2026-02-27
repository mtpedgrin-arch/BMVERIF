import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/products/[id] — editar producto (admin)
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = params;
  const body = await req.json();

  const data = {};
  if (body.name != null) data.name = body.name.trim();
  if (body.details != null) data.details = body.details.trim() || null;
  if (body.price != null) data.price = parseFloat(body.price);
  if (body.cost != null) data.cost = parseFloat(body.cost) || 0;
  if (body.tiers != null) data.tiers = Array.isArray(body.tiers) ? body.tiers : [];
  if (body.stock != null) data.stock = parseInt(body.stock);
  if (body.isActive != null) data.isActive = body.isActive;
  if (body.badgeDiscount != null) data.badgeDiscount = parseFloat(body.badgeDiscount) || 0;
  if (body.category != null) data.category = body.category;

  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json(product);
}

// DELETE /api/products/[id] — borrar producto (admin)
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { id } = params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
