import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

// POST /api/auth/check-verification — used after failed login to distinguish
// "wrong password" from "account not verified"
export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ unverified: false });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { emailVerified: true },
    });

    return NextResponse.json({ unverified: user ? !user.emailVerified : false });
  } catch {
    return NextResponse.json({ unverified: false });
  }
}
