import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";

const MERCHANT = process.env.CRYPTOMUS_MERCHANT_UUID;
const API_KEY  = process.env.CRYPTOMUS_API_KEY;
const BASE_URL = process.env.NEXTAUTH_URL || "https://bmverificada.com";

function makeSign(body) {
  const json = JSON.stringify(body);
  const b64  = Buffer.from(json).toString("base64");
  return crypto.createHash("md5").update(b64 + API_KEY).digest("hex");
}

// POST /api/cryptomus/create-payment
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { orderId } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId requerido" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });

  if (order.userEmail !== session.user.email && session.user.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!MERCHANT || !API_KEY || API_KEY === "REPLACE_WITH_YOUR_KEY") {
    return NextResponse.json({ error: "Cryptomus no configurado aún. Volvé a intentar más tarde." }, { status: 503 });
  }

  const body = {
    amount:       String((order.uniqueAmount ?? order.total).toFixed(2)),
    currency:     "USDT",
    order_id:     order.id,
    url_return:   `${BASE_URL}/ordenes`,
    url_callback: `${BASE_URL}/api/cryptomus/webhook`,
    lifetime:     3600,
  };

  try {
    const res = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: MERCHANT,
        sign:     makeSign(body),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || data.state !== 0) {
      return NextResponse.json(
        { error: data.message || "Error al crear pago en Cryptomus" },
        { status: 502 }
      );
    }

    return NextResponse.json({ url: data.result.url, uuid: data.result.uuid });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con Cryptomus" }, { status: 502 });
  }
}
