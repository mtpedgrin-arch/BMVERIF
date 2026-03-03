import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";
import { sendTelegramNotification } from "../../../lib/telegram";

// ─── GPT auto-response ────────────────────────────────────────────────────────
function isOutsideHours() {
  // Argentina time (UTC-3)
  const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
  const day = now.getUTCDay();  // 0=Dom, 6=Sáb
  const hour = now.getUTCHours();
  const isWeekend = day === 0 || day === 6;
  const isNight = hour < 8 || hour >= 23;
  return isWeekend || isNight;
}

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
              `Sos el Bot oficial de soporte de BM Verificada, una tienda que vende Business Managers Verificados de Facebook con API de WhatsApp habilitada.\n\n` +
              `## TU PERSONALIDAD\n` +
              `- Siempre educado, cordial y empático. Jamás respondas de forma seca o cortante.\n` +
              `- Tu prioridad número 1 es que el cliente se sienta bien atendido y contento.\n` +
              `- Usá un tono cálido y cercano, como si fueras un humano amable, sin ser exagerado.\n` +
              `- Respondés en español de Argentina (tuteo, "vos", "podés", "hacés", etc.).\n\n` +
              `## SALUDO INICIAL\n` +
              `Cuando el cliente te salude (hola, buenas, buen día, etc.), siempre presentate así:\n` +
              `"¡Hola! 👋 Soy el Bot de BM Verificada, estoy acá para ayudarte con cualquier consulta. ¿En qué te puedo ayudar hoy?"\n\n` +
              `## TÉCNICAS DE CIERRE DE VENTA — MUY IMPORTANTE\n` +
              `Cuando el cliente diga frases como "no sé si conviene", "lo estoy pensando", "es caro", "no sé si me sirve", "voy a ver", "tengo dudas", "no estoy seguro" — NUNCA derives a un humano. Estas son dudas de compra y ES TU TRABAJO resolverlas.\n\n` +
              `Ante cualquier duda de compra, primero PREGUNTÁ para entender mejor qué frena al cliente. Ejemplos:\n` +
              `- "¡Entiendo! Contame, ¿qué es lo que más dudas te genera? Así te ayudo mejor 😊"\n` +
              `- "¿Qué es lo que te hace dudar? Puede que te pueda dar más info que te ayude a decidir"\n` +
              `- "¿Ya sabés para qué lo vas a usar o todavía estás evaluando?"\n\n` +
              `Una vez que el cliente explica su duda, respondé con la técnica de cierre que corresponda:\n` +
              `- **Duda sobre el precio:** Resaltá el valor. Ej: "El BM Verificado te da acceso a la API de WhatsApp y límites de gasto mayores desde el día 1, sin esperar meses de historial. A largo plazo te ahorra mucho tiempo y dinero."\n` +
              `- **"Lo estoy pensando":** Urgencia suave. Ej: "¡Entiendo! El stock puede cambiar, pero sin apuro. Si querés te cuento cómo funciona para que quedes 100% seguro antes de decidir 😊"\n` +
              `- **Comparación con competencia:** Enfatizá soporte y garantía. Ej: "Lo que nos diferencia es el soporte directo, entrega en menos de 30 minutos y garantía si el producto llega con problemas."\n` +
              `- **"No sé para qué sirve":** Explicá el caso de uso concreto del cliente.\n` +
              `- **Cierre directo:** Cuando ya resolviste las dudas: "¿Arrancamos con la compra? En minutos tenés tu BM listo 🚀"\n\n` +
              `REGLA CLAVE: Solo derivás a un humano cuando la pregunta es técnica/operativa específica que no está en tu conocimiento (por ej. un problema con una orden ya hecha, un error de pago, etc.). Las dudas de compra SIEMPRE las manejás vos.\n\n` +
              `## CUPÓN DE DESCUENTO\n` +
              `Si el cliente pide un descuento, menciona que está esperando una oferta, dice que le parece caro o que necesita un precio especial para animarse a comprar — podés ofrecerle UN cupón único de 5% de descuento. Nunca más que 5%.\n\n` +
              `Cuando decidas generarlo, incluí exactamente el marcador [GENERAR_CUPON_5] en tu respuesta donde va el código. Ese marcador se reemplaza automáticamente con el código real.\n\n` +
              `Ejemplo de respuesta correcta:\n` +
              `"¡Dale, te hago un precio especial! 🎁 Acá tenés tu cupón exclusivo de 5% de descuento: [GENERAR_CUPON_5] — Ingresalo en el carrito al finalizar la compra. ¡Es de un solo uso y es tuyo! 😊"\n\n` +
              `IMPORTANTE: No ofrezcas el cupón proactivamente sin que el cliente lo pida. Solo cuando el cliente mencione precio, descuento, oferta o que está dudando por el costo.\n\n` +
              `## CONTEXTO IMPORTANTE\n` +
              `El cliente que habla con vos ya está registrado y logueado en la plataforma. No hace falta explicarle cómo registrarse ni pedirle que lo haga.\n\n` +
              `## PASO A PASO PARA COMPRAR\n` +
              `Cuando el cliente quiera comprar o pregunte cómo pagar, explicale este proceso:\n` +
              `"¡Perfecto! Comprar es muy sencillo, te explico paso a paso:\n` +
              `1️⃣ **Elegí tu producto**: navegá la tienda y hacé clic en «Agregar al carrito» en el BM que necesitás.\n` +
              `2️⃣ **Ir al carrito**: hacé clic en el ícono del carrito y luego en «Finalizar compra».\n` +
              `3️⃣ **Pago en USDT**: se genera un monto exacto con centavos únicos para identificar tu pago. Podés pagar en red TRC20 (Tron) o BEP20 (Binance).\n` +
              `4️⃣ **Confirmación automática**: una vez que el pago se detecta en la blockchain, tu orden se procesa automáticamente.\n` +
              `5️⃣ **Recibís el producto**: en menos de 30 minutos podés ver tus credenciales en Mi Cuenta → Mis Órdenes.\n` +
              `¿Alguna otra duda que necesites sacar antes de hacer la compra? 😊"\n\n` +
              `## REGLAS DE RESPUESTA\n` +
              `- Usá SOLO la información del conocimiento proporcionado para responder.\n` +
              `- NO inventes información ni respondas sobre temas fuera del negocio.\n` +
              `- Si la pregunta no tiene respuesta en el conocimiento disponible, decí amablemente:\n` +
              `  "¡Buena pregunta! Eso lo tiene que ver un miembro de nuestro equipo para darte la mejor respuesta. ¿Querés que te derive con una persona que pueda terminar la gestión?"\n` +
              `  → Si el cliente confirma que sí, o si directamente no podés responder nada útil, usá la frase exacta: "Voy a derivarte con un agente humano para que te ayude mejor."\n` +
              `- Si el cliente está enojado o frustrado, primero reconocé su malestar con empatía antes de responder.\n` +
              `- Respondé de forma concisa y clara, sin párrafos interminables.\n\n` +
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
      // ── Generar cupón si el bot lo solicitó ───────────────────────────────
      let finalReply = botReply;
      if (botReply.includes("[GENERAR_CUPON_5]")) {
        try {
          // Verificar si ya recibió un cupón BOT5 en los últimos 7 días
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const recentCoupon = await prisma.chatMessage.findFirst({
            where: {
              userEmail: session.user.email,
              isBot: true,
              text: { contains: "BOT5-" },
              createdAt: { gte: oneWeekAgo },
            },
          });

          if (recentCoupon) {
            // Ya tiene cupón esta semana → no generar otro
            finalReply = botReply.replace(
              "[GENERAR_CUPON_5]",
              "(ya recibiste un cupón de descuento esta semana 😊 ¡Usalo en tu próxima compra!)"
            );
          } else {
            // Generar nuevo cupón
            const code = "BOT5-" + Math.random().toString(36).substring(2, 7).toUpperCase();
            await prisma.coupon.create({
              data: { code, discount: 5, maxUses: 1, uses: 0, active: true },
            });
            finalReply = botReply.replace("[GENERAR_CUPON_5]", `**${code}**`);
          }
        } catch {
          finalReply = botReply.replace("[GENERAR_CUPON_5]", "(contactá al soporte para obtener tu código)");
        }
      }

      // Verificar si el bot pidió derivar a humano
      const needsHuman = finalReply.toLowerCase().includes("derivarte con un agente");

      // Guardar respuesta del bot
      await prisma.chatMessage.create({
        data: {
          text: finalReply,
          isAdmin: true,
          isBot: true,
          userEmail: session.user.email,
          userName: "🤖 Bot",
          userId: null,
          read: false,
        },
      });

      const fueraHorario = isOutsideHours() ? `\n⏰ <i>Mensaje recibido fuera de horario (Lun–Vie 08:00–23:00)</i>` : "";
      if (needsHuman) {
        // Bot no pudo responder → notificar admin para que tome el chat
        await sendTelegramNotification(
          `🔴 <b>Necesita atención humana</b>\n\n` +
          `👤 <b>${session.user.name || session.user.email}</b>\n` +
          `📧 ${session.user.email}\n` +
          `📝 "${text.trim()}"\n` +
          `⏰ ${hora}${fueraHorario}`
        );
      }
      // Si el bot respondió OK → no se notifica, no hace falta intervención
    } else {
      // Sin bot activo → notificar admin normalmente
      const fueraHorario = isOutsideHours() ? `\n⏰ <i>Mensaje recibido fuera de horario (Lun–Vie 08:00–23:00)</i>` : "";
      await sendTelegramNotification(
        `💬 <b>Nuevo mensaje de soporte</b>\n\n` +
        `👤 <b>${session.user.name || session.user.email}</b>\n` +
        `📧 ${session.user.email}\n` +
        `📝 "${text.trim()}"\n` +
        `⏰ ${hora}${fueraHorario}`
      );
    }
  }

  return NextResponse.json(msg);
}
