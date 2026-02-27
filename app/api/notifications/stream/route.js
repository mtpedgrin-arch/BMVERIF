import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const email = session.user.email;
  const encoder = new TextEncoder();

  // Fetch initial notifications
  const initial = await prisma.$queryRawUnsafe(
    `SELECT * FROM "Notification" WHERE "userEmail" = $1 ORDER BY "createdAt" DESC LIMIT 30`,
    email
  );

  // Track the latest createdAt so we only push truly new ones
  let lastCreatedAt = initial.length > 0
    ? new Date(initial[0].createdAt)
    : new Date();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch {}
      };

      // Send initial snapshot
      send({ type: "init", notifs: initial });

      // Poll DB every 4s and push new notifications
      const interval = setInterval(async () => {
        try {
          const newNotifs = await prisma.$queryRawUnsafe(
            `SELECT * FROM "Notification" WHERE "userEmail" = $1 AND "createdAt" > $2 ORDER BY "createdAt" ASC`,
            email, lastCreatedAt
          );
          if (newNotifs.length > 0) {
            lastCreatedAt = new Date(newNotifs[newNotifs.length - 1].createdAt);
            send({ type: "new", notifs: newNotifs });
          }
        } catch { controller.close(); }
      }, 4000);

      // Keep-alive ping every 25s
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); } catch {}
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        clearInterval(ping);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
