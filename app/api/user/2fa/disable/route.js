import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { verifySync } from "otplib";
import { prisma } from "../../../../../lib/prisma";

// POST /api/user/2fa/disable — verify current TOTP code and disable 2FA
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "Ingresá tu código de Google Authenticator." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorEnabled) return NextResponse.json({ error: "El 2FA no está activo." }, { status: 400 });

  const valid = verifySync({ token: code, secret: user.twoFactorSecret })?.valid;
  if (!valid) return NextResponse.json({ error: "Código incorrecto." }, { status: 400 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ ok: true });
}
