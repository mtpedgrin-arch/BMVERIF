import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/orders — admin: todas; usuario: las suyas
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (session.user.role === "admin") {
    const orders = await prisma.order.findMany({
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  }

  const orders = await prisma.order.findMany({
    where: { userEmail: session.user.email },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

// POST /api/orders — crear orden (usuario autenticado)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { items, subtotal, discount, coupon, total, network, txHash } = await req.json();
  if (!items?.length || !network || total == null) {
    return NextResponse.json({ error: "Faltan campos obligatorios." }, { status: 400 });
  }

  const order = await prisma.order.create({
    data: {
      status: "pending",
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      subtotal: parseFloat(subtotal) || 0,
      discount: parseFloat(discount) || 0,
      coupon: coupon || null,
      total: parseFloat(total),
      network,
      txHash: txHash || null,
      userId: session.user.id || null,
      items: {
        create: items.map(i => ({
          name: i.name,
          price: parseFloat(i.price),
          qty: parseInt(i.qty) || 1,
        })),
      },
    },
    include: { items: true },
  });

  return NextResponse.json(order);
}
