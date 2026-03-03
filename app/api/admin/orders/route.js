import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// DELETE /api/admin/orders
// Body: { statuses: ["pending", "cancelled"] }  ← statuses a eliminar permanentemente
// Admin only. OrderItems se borran en cascada (onDelete: Cascade).
export async function DELETE(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const statuses = body.statuses;

  if (!Array.isArray(statuses) || statuses.length === 0) {
    return NextResponse.json(
      { error: "Enviá { statuses: ['pending','cancelled',...] }" },
      { status: 400 }
    );
  }

  // Statuses permitidos para eliminar (nunca se pueden eliminar órdenes "paid" o "delivered" por seguridad)
  const ALLOWED = ["pending", "cancelled", "expired"];
  const invalid = statuses.filter(s => !ALLOWED.includes(s));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Statuses no permitidos: ${invalid.join(", ")}. Solo se pueden borrar: ${ALLOWED.join(", ")}` },
      { status: 400 }
    );
  }

  // Borrar notificaciones huérfanas de esas órdenes primero
  const ordersToDelete = await prisma.order.findMany({
    where: { status: { in: statuses } },
    select: { id: true },
  });
  const ids = ordersToDelete.map(o => o.id);

  if (ids.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0, message: "No hay órdenes con esos statuses." });
  }

  // Limpiar notificaciones que referencian esas órdenes
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Notification" WHERE "orderId" = ANY($1::text[])`,
    ids
  ).catch(() => {});

  // Borrar las órdenes (OrderItems se borran en cascada automáticamente)
  const result = await prisma.order.deleteMany({
    where: { status: { in: statuses } },
  });

  return NextResponse.json({
    ok: true,
    deleted: result.count,
    statuses,
    message: `✅ ${result.count} órdenes eliminadas permanentemente.`,
  });
}
