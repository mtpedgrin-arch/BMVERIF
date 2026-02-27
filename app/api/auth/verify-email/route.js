import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// POST /api/auth/verify-email — verify account with token
export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: "Token requerido." }, { status: 400 });

    const users = await prisma.$queryRawUnsafe(
      `SELECT id, email, "verifyTokenExpiry" FROM "User" WHERE "verifyToken" = $1`,
      token
    );
    const user = users[0];

    if (!user)
      return NextResponse.json({ error: "Enlace inválido o ya utilizado." }, { status: 400 });

    if (new Date(user.verifyTokenExpiry) < new Date()) {
      // Token expired — delete the unverified account
      await prisma.$executeRawUnsafe(`DELETE FROM "User" WHERE id = $1`, user.id).catch(() => {});
      return NextResponse.json({ error: "El enlace expiró. Registrate nuevamente." }, { status: 400 });
    }

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "emailVerified" = true, "verifyToken" = NULL, "verifyTokenExpiry" = NULL WHERE id = $1`,
      user.id
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("verify-email error:", e);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
