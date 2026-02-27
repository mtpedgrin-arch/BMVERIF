import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { sendTelegramNotification } from "../../../lib/telegram";

// GET /api/chat — usuario: sus mensajes | admin: todos
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetEmail = searchParams.get("userEmail");

  if (session.user.role === "admin") {
    if (targetEmail) {
      // mensajes de una conversación específica
      const msgs = await prisma.chatMessage.findMany({
        where: { userEmail: targetEmail },
        orderBy: { createdAt: "asc" },
      });
      // marcar como leídos los del usuario
      await prisma.chatMessage.updateMany({
        where: { userEmail: targetEmail, isAdmin: false, read: false },
        data: { read: true },
      });
      return NextResponse.json(msgs);
    }
    // resumen de todas las conversaciones (último mensaje + no leídos)
    const all = await prisma.chatMessage.findMany({
      orderBy: { createdAt: "desc" },
    });
    // agrupar por userEmail
    const convMap = {};
    for (const m of all) {
      if (!convMap[m.userEmail]) {
        convMap[m.userEmail] = { userEmail: m.userEmail, userName: m.userName, lastMsg: m.text, lastAt: m.createdAt, unread: 0 };
      }
      if (!m.isAdmin && !m.read) convMap[m.userEmail].unread++;
    }
    return NextResponse.json(Object.values(convMap));
  }

  // usuario normal — sus mensajes
  const msgs = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  // marcar como leídos los mensajes del admin hacia el usuario
  await prisma.chatMessage.updateMany({
    where: { userId: session.user.id, isAdmin: true, read: false },
    data: { read: true },
  });
  return NextResponse.json(msgs);
}

// POST /api/chat — enviar mensaje
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { text, targetEmail, targetName } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });

  const isAdmin = session.user.role === "admin";

  const msg = await prisma.chatMessage.create({
    data: {
      text: text.trim(),
      isAdmin,
      userEmail: isAdmin ? targetEmail : session.user.email,
      userName: isAdmin ? (targetName || targetEmail) : (session.user.name || session.user.email),
      userId: isAdmin ? null : session.user.id,
      read: false,
    },
  });

  // notificación a Telegram solo cuando escribe el usuario (no el admin)
  if (!isAdmin) {
    const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
    await sendTelegramNotification(
      `💬 <b>Nuevo mensaje en BMVERIF</b>\n\n` +
      `👤 <b>${session.user.name || session.user.email}</b>\n` +
      `📧 ${session.user.email}\n` +
      `📝 "${text.trim()}"\n` +
      `⏰ ${hora}`
    );
  }

  return NextResponse.json(msg);
}
