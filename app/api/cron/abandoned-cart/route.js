import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { sendAbandonedCartEmail } from "../../../../lib/mailer";

const CRON_SECRET = process.env.CRON_SECRET || "bmverif_cron_2026";

// GET /api/cron/abandoned-cart?secret=<CRON_SECRET>
// Call this endpoint every hour from cron-job.org (or similar).
// Sends one reminder email per cart that has been idle > 2 hours with no completed order.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  // Carts not updated in the last 2 hours and email not sent yet
  const carts = await prisma.savedCart.findMany({
    where: {
      updatedAt: { lte: twoHoursAgo },
      emailSent: false,
    },
  });

  let sent = 0;
  for (const cart of carts) {
    // If the user completed a purchase recently, skip and clean up
    const recentPaid = await prisma.order.findFirst({
      where: {
        userEmail: cart.userEmail,
        status: "paid",
        createdAt: { gte: twoHoursAgo },
      },
    });

    if (recentPaid) {
      await prisma.savedCart.delete({ where: { id: cart.id } });
      continue;
    }

    try {
      await sendAbandonedCartEmail({
        to: cart.userEmail,
        name: cart.userName,
        items: cart.items,
        total: cart.total,
      });

      await prisma.savedCart.update({
        where: { id: cart.id },
        data: { emailSent: true },
      });

      sent++;
    } catch (e) {
      console.error("[cron/abandoned-cart] Failed to email", cart.userEmail, e?.message);
    }
  }

  return NextResponse.json({ ok: true, processed: carts.length, sent });
}
