import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { sendVerificationEmail } from "../../../../lib/mailer";

// POST /api/auth/resend-verification — resend verification email by email address
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email requerido." }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Always return ok to avoid exposing whether email exists
    if (!user || user.emailVerified) return NextResponse.json({ ok: true });

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "verifyToken" = $1, "verifyTokenExpiry" = $2 WHERE id = $3`,
      verifyToken, verifyTokenExpiry, user.id
    );

    const baseUrl = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";
    const verifyUrl = `${baseUrl}/?verify=${verifyToken}`;

    await sendVerificationEmail({ to: normalizedEmail, name: user.name || "Usuario", verifyUrl });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("resend-verification error:", e);
    return NextResponse.json({ error: "Error al enviar el email." }, { status: 500 });
  }
}
