import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// POST /api/cart/save
// Upserts the logged-in user's saved cart (for abandoned-cart emails).
// Sending items=[] deletes the saved cart record.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ ok: false }, { status: 401 });

  const { items, total } = await req.json();

  if (!Array.isArray(items) || items.length === 0) {
    // Cart emptied — remove the saved record so no email is sent
    await prisma.savedCart.deleteMany({ where: { userEmail: session.user.email } });
    return NextResponse.json({ ok: true });
  }

  await prisma.savedCart.upsert({
    where: { userEmail: session.user.email },
    update: {
      items,
      total: Number(total) || 0,
      emailSent: false, // reset so a new email can be sent on the next cron run
    },
    create: {
      userEmail: session.user.email,
      userName: session.user.name || session.user.email,
      items,
      total: Number(total) || 0,
    },
  });

  return NextResponse.json({ ok: true });
}
