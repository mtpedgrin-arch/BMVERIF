import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/notifications/read — mark all as read for current user
export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" SET read = true WHERE "userEmail" = $1 AND read = false`,
    session.user.email
  );
  return NextResponse.json({ ok: true });
}
