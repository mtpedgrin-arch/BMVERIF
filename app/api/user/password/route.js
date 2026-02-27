import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcryptjs";

// PATCH /api/user/password — change password (authenticated)
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { current, newPassword } = await req.json();
  if (!current || !newPassword)
    return NextResponse.json({ error: "Completá todos los campos." }, { status: 400 });
  if (newPassword.length < 6)
    return NextResponse.json({ error: "Mínimo 6 caracteres." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user?.password)
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });

  const ok = await bcrypt.compare(current, user.password);
  if (!ok)
    return NextResponse.json({ error: "Contraseña actual incorrecta." }, { status: 400 });

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { email: session.user.email },
    data: { password: hashed },
  });

  return NextResponse.json({ ok: true });
}
