import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { sendTelegramNotification } from "../../../lib/telegram";

// ─── GPT auto-response ────────────────────────────────────────────────────────
async function generateBotReply(userMessage, userEmail) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    // 1. Cargar conocimiento activo
    const knowledge = await prisma.botKnowledge.findMany({ where: { active: true } });
    if (knowledge.length === 0) return null;

    const knowledgeText = knowledge
      .map(k => `[${k.topic}]\n${k.content}`)
      .join("\n\n---\n\n");

    // 2. Últimos 10 mensajes de la conversación (para contexto)
    const history = await prisma.chatMessage.findMany({
      where: { userEmail },
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    const historyMessages = history.reverse().map(m => ({
      role: m.isAdmin ? "assistant" : "user",
      content: m.text,
    }));

    // 3. Llamada a OpenAI
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 350,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              `Sos el asistente de soporte de BM Verificada, una tienda que vende Business Managers Verificados de Facebook con API de WhatsApp habilitada. Respondés en español (Argentina), de forma clara, amigable y concisa.\n\n` +
              `Usá SOLO la información del siguiente conocimiento para responder. Si la pregunta no tiene respuesta en el conocimiento disponible, decí: "Voy a derivarte con un agente humano para que te ayude mejor." y nada más.\n\n` +
              `NO inventes información. NO respondas sobre temas fuera del negocio.\n\n` +
              `=== CONOCIMIENTO ===\n${knowledgeText}`,
          },
          ...historyMessages,
          { role: "user", content: userMessage },
        ],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    return reply || null;
  } catch {
    return null;
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const targetEmail = searchParams.get("userEmail");

  if (session.user.role === "admin" || session.user.role === "support") {
    if (targetEmail) {
      const msgs = await prisma.chatMessage.findMany({
        where: { userEmail: targetEmail },
        orderBy: { createdAt: "asc" },
      });
      await prisma.chatMessage.updateMany({
        where: { userEmail: targetEmail, isAdmin: false, read: false },
        data: { read: true },
      });
      return NextResponse.json(msgs);
    }
    const all = await prisma.chatMessage.findMany({ orderBy: { createdAt: "desc" } });
    const convMap = {};
    for (const m of all) {
      if (!convMap[m.userEmail]) {
        convMap[m.userEmail] = { userEmail: m.userEmail, userName: m.userName, lastMsg: m.text, lastAt: m.createdAt, unread: 0 };
      }
      if (!m.isAdmin && !m.read) convMap[m.userEmail].unread++;
    }
    return NextResponse.json(Object.values(convMap));
  }

  const msgs = await prisma.chatMessage.findMany({
    where: { userEmail: session.user.email },
    orderBy: { createdAt: "asc" },
  });
  await prisma.chatMessage.updateMany({
    where: { userEmail: session.user.email, isAdmin: true, read: false },
    data: { read: true },
  });
  return NextResponse.json(msgs);
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { text, targetEmail, targetName } = await req.json();
  if (!text?.trim()) return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });

  const isAdmin = session.user.role === "admin" || session.user.role === "support";

  const msg = await prisma.chatMessage.create({
    data: {
      text: text.trim(),
      isAdmin,
      isBot: false,
      userEmail: isAdmin ? targetEmail : session.user.email,
      userName: isAdmin ? (targetName || targetEmail) : (session.user.name || session.user.email),
      userId: isAdmin ? null : session.user.id,
      read: false,
    },
  });

  // Solo cuando escribe el usuario (no el admin)
  if (!isAdmin) {
    const hora = new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

    // Intentar respuesta automática con GPT
    const botReply = await generateBotReply(text.trim(), session.user.email);

    if (botReply) {
      // Verificar si el bot pidió derivar a humano
      const needsHuman = botReply.toLowerCase().includes("derivarte con un agente");

      // Guardar respuesta del bot
      await prisma.chatMessage.create({
        data: {
          text: botReply,
          isAdmin: true,
          isBot: true,
          userEmail: session.user.email,
          userName: "🤖 Bot",
          userId: null,
          read: false,
        },
      });

      if (needsHuman) {
        // Bot no pudo responder → notificar admin para que tome el chat
        await sendTelegramNotification(
          `🔴 <b>Bot no pudo responder — necesita atención humana</b>\n\n` +
          `👤 <b>${session.user.name || session.user.email}</b>\n` +
          `📧 ${session.user.email}\n` +
          `📝 "${text.trim()}"\n` +
          `⏰ ${hora}`
        );
      } else {
        // Bot respondió → notificar solo como info (sin urgencia)
        await sendTelegramNotification(
          `🤖 <b>Bot respondió automáticamente</b>\n\n` +
          `👤 ${session.user.name || session.user.email}\n` +
          `📝 "${text.trim()}"\n` +
          `💬 Bot: "${botReply.slice(0, 100)}${botReply.length > 100 ? "…" : ""}"\n` +
          `⏰ ${hora}`
        );
      }
    } else {
      // Sin bot activo → notificar admin normalmente
      await sendTelegramNotification(
        `💬 <b>Nuevo mensaje de soporte</b>\n\n` +
        `👤 <b>${session.user.name || session.user.email}</b>\n` +
        `📧 ${session.user.email}\n` +
        `📝 "${text.trim()}"\n` +
        `⏰ ${hora}`
      );
    }
  }

  return NextResponse.json(msg);
}
