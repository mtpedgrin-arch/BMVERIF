import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL || "https://bmverif.vercel.app";

function generateReferralCode(name) {
  const prefix = (name || "USER").replace(/[^a-zA-Z]/g, "").toUpperCase().slice(0, 4).padEnd(4, "X");
  const suffix = Math.random().toString(36).toUpperCase().slice(2, 6);
  return prefix + suffix;
}

// GET /api/referrals — returns the user's referral code, credit balance, and referral list
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, referralCode: true, referralCredit: true },
  });

  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Auto-generate referralCode if the user doesn't have one yet (pre-existing accounts)
  if (!user.referralCode) {
    let code = generateReferralCode(session.user.name || session.user.email);
    let attempts = 0;
    while (attempts < 10) {
      const exists = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = generateReferralCode(session.user.name || session.user.email);
      attempts++;
    }
    user = await prisma.user.update({
      where: { email: session.user.email },
      data: { referralCode: code },
      select: { id: true, referralCode: true, referralCredit: true },
    });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    referralCode:   user.referralCode,
    referralCredit: user.referralCredit,
    referralLink:   `${BASE_URL}/?ref=${user.referralCode}`,
    referrals: referrals.map(r => ({
      email:       r.referredEmail.replace(/(.{2}).*(@.*)/, "$1***$2"),
      status:      r.status,
      creditEarned: r.creditEarned,
      createdAt:   r.createdAt,
    })),
  });
}
