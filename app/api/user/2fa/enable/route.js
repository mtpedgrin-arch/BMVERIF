import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { verifySync } from "otplib";
import { prisma } from "../../../../../lib/prisma";

// POST /api/user/2fa/enable — verify code and save secret
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { code, secret } = await req.json();
  if (!code || !secret) return NextResponse.json({ error: "Datos incompletos." }, { status: 400 });

  const valid = verifySync({ token: code, secret })?.valid;
  if (!valid) return NextResponse.json({ error: "Código incorrecto. Intentá de nuevo." }, { status: 400 });

  await prisma.user.update({
    where: { email: session.user.email },
    data: { twoFactorEnabled: true, twoFactorSecret: secret },
  });

  return NextResponse.json({ ok: true });
}
