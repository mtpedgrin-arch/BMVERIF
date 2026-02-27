import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/notifications/[id] — mark single notification as read
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;
  await prisma.$executeRawUnsafe(
    `UPDATE "Notification" SET read = true WHERE id = $1 AND "userEmail" = $2`,
    id, session.user.email
  );
  return NextResponse.json({ ok: true });
}
