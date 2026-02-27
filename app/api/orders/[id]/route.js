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

  const order = await prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true },
  });
  return NextResponse.json(order);
}
