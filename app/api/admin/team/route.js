import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/team — listar usuarios de soporte
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { role: "support" },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(users);
}

// POST /api/admin/team — crear usuario de soporte
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { name, email, password, permissions } = await req.json();
  if (!name?.trim() || !email?.trim() || !password?.trim())
    return NextResponse.json({ error: "Nombre, email y contraseña son obligatorios." }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing)
    return NextResponse.json({ error: "Ya existe un usuario con ese email." }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashed,
      role: "support",
      emailVerified: true,
      permissions: permissions || {},
    },
    select: { id: true, name: true, email: true, permissions: true, createdAt: true },
  });
  return NextResponse.json(user);
}
