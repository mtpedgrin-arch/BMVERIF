import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password)
      return NextResponse.json({ error: "Completá todos los campos." }, { status: 400 });

    if (password.length < 6)
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });

    const normalizedEmail = email.toLowerCase().trim();

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing)
      return NextResponse.json({ error: "Ese email ya está registrado." }, { status: 400 });

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { name: name.trim(), email: normalizedEmail, password: hashed },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
