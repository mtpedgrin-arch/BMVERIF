import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/orders/[id] — cambiar estado (admin)
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = params;
  const body = await req.json();
  const { status, deliveryContent } = body;

  // Allow delivery-only update (no status required)
  if (!status && deliveryContent === undefined)
    return NextResponse.json({ error: "Falta status o deliveryContent." }, { status: 400 });

  // Read current order before updating (need previous status + items)
  const current = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const updateData = {};
  if (status) updateData.status = status;
  if (deliveryContent !== undefined) updateData.deliveryContent = deliveryContent;

  const order = await prisma.order.update({
    where: { id },
    data: updateData,
    include: { items: true },
  });

  // Transitioning TO "paid" → increment sales on each product
  if (status && status === "paid" && current.status !== "paid") {
    for (const item of order.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { sales: { increment: item.qty } },
        }).catch(() => {}); // ignore if product was deleted
      }
    }
  }

  // Transitioning FROM "paid" (e.g. cancelled) → decrement sales
  if (status && current.status === "paid" && status !== "paid") {
    for (const item of current.items) {
      if (item.productId) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { sales: { decrement: item.qty } },
        }).catch(() => {});
      }
    }
  }

  return NextResponse.json(order);
}
