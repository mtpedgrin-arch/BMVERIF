import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// POST /api/admin/run-migration — apply schema migration (admin only, one-time use)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" DROP COLUMN IF EXISTS "showTierBadge"`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "badgeDiscount" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    return NextResponse.json({ ok: true, message: "Migration applied: showTierBadge → badgeDiscount" });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
