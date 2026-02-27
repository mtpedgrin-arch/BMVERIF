import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const { token, password } = await req.json();
    if (!token || !password)
      return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });
    if (password.length < 6)
      return NextResponse.json({ error: "Mínimo 6 caracteres." }, { status: 400 });

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, "resetTokenExpiry" FROM "User" WHERE "resetToken" = $1`,
      token
    );
    const user = users[0];

    if (!user)
      return NextResponse.json({ error: "Enlace inválido o ya utilizado." }, { status: 400 });
    if (new Date(user.resetTokenExpiry) < new Date())
      return NextResponse.json({ error: "El enlace expiró. Solicitá uno nuevo." }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET password = $1, "resetToken" = NULL, "resetTokenExpiry" = NULL WHERE id = $2`,
      hashed, user.id
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error:", e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
