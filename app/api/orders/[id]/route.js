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
  const { status } = await req.json();
  if (!status) return NextResponse.json({ error: "Falta el status." }, { status: 400 });

  // Read current order before updating (need previous status + items)
  const current = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  });

  // Transitioning TO "paid" → increment sales on each product
  if (status === "paid" && current.status !== "paid") {
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
  if (current.status === "paid" && status !== "paid") {
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
