import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// GET /api/user/profile — fetch current user's profile data
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, twoFactorEnabled: true, newsletter: true, stockUpdates: true },
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  return NextResponse.json(user);
}

// PATCH /api/user/profile — update name
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "El nombre no puede estar vacío." }, { status: 400 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { name: name.trim() },
  });

  return NextResponse.json({ ok: true });
}
