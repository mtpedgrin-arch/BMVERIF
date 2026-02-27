import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../../../../lib/prisma";
import { sendVerificationEmail } from "../../../../lib/mailer";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "Completá todos los campos." }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    // Cleanup: delete unverified accounts older than 24h
    await prisma.$executeRawUnsafe(
      `DELETE FROM "User" WHERE "emailVerified" = false AND "createdAt" < NOW() - INTERVAL '24 hours'`
    ).catch(() => {});

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing)
      return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" (id, name, email, password, role, "emailVerified", "verifyToken", "verifyTokenExpiry", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, 'user', false, $4, $5, NOW(), NOW())`,
      name.trim(), normalizedEmail, hashed, verifyToken, verifyTokenExpiry
    );

    const baseUrl = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";
    const verifyUrl = `${baseUrl}/?verify=${verifyToken}`;

    // Send verification email (non-blocking)
    sendVerificationEmail({ to: normalizedEmail, name: name.trim(), verifyUrl }).catch(() => {});

    return NextResponse.json({ ok: true, pendingVerification: true });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
