import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { sendResetEmail } from "../../../../lib/mailer";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return ok — don't reveal if email exists
    if (!user) return NextResponse.json({ ok: true });

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "resetToken" = $1, "resetTokenExpiry" = $2 WHERE email = $3`,
      token, expiry, normalizedEmail
    );

    const baseUrl = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";
    const resetUrl = `${baseUrl}/?reset=${token}`;

    await sendResetEmail({ to: normalizedEmail, resetUrl });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("forgot-password error:", e);
    return NextResponse.json({ error: "Error al enviar el email. Verificá la configuración SMTP." }, { status: 500 });
  }
}
