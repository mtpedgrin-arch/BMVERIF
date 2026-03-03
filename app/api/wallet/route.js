import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/wallet — returns { balance, topups[] }
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { walletBalance: true },
  });

  const topups = await prisma.walletTopup.findMany({
    where: { userEmail: session.user.email },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ balance: user?.walletBalance ?? 0, topups });
}
