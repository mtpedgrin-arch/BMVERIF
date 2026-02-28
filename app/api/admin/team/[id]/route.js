import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { prisma } from "../../../../../lib/prisma";

// PATCH /api/admin/team/[id] — actualizar permisos
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;
  const { permissions } = await req.json();

  const user = await prisma.user.update({
    where: { id },
    data: { permissions: permissions || {} },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(user);
}

// DELETE /api/admin/team/[id] — eliminar usuario de soporte
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;
  // Ensure we only delete support users, not admins
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user || user.role !== "support")
    return NextResponse.json({ error: "Usuario no encontrado o no es soporte." }, { status: 404 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
