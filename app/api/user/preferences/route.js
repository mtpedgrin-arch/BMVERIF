import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// PATCH /api/user/preferences — update newsletter and stockUpdates
export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const { newsletter, stockUpdates } = await req.json();

  await prisma.user.update({
    where: { email: session.user.email },
    data: {
      newsletter:   typeof newsletter   === "boolean" ? newsletter   : undefined,
      stockUpdates: typeof stockUpdates === "boolean" ? stockUpdates : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
