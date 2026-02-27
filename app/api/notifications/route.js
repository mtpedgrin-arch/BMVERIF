import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/notifications — returns current user's notifications
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Notification" WHERE "userEmail" = $1 ORDER BY "createdAt" DESC LIMIT 30`,
    session.user.email
  );
  return NextResponse.json(rows);
}
