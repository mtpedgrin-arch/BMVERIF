import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../../lib/prisma";

// POST /api/auth/check-login
// Called before signIn to determine what step is needed:
// { valid, unverified, requires2fa }
export async function POST(req) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ valid: false });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { password: true, emailVerified: true, twoFactorEnabled: true },
    });

    if (!user?.password) return NextResponse.json({ valid: false });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return NextResponse.json({ valid: false });

    return NextResponse.json({
      valid: true,
      unverified: !user.emailVerified,
      requires2fa: user.twoFactorEnabled && user.emailVerified,
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
