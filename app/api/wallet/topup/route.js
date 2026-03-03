import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import crypto from "crypto";

const MERCHANT = process.env.CRYPTOMUS_MERCHANT_UUID;
const API_KEY  = process.env.CRYPTOMUS_API_KEY;
const BASE_URL = process.env.NEXTAUTH_URL || "https://bmverificada.space";

function makeSign(body) {
  const json = JSON.stringify(body);
  const b64  = Buffer.from(json).toString("base64");
  return crypto.createHash("md5").update(b64 + API_KEY).digest("hex");
}

// POST /api/wallet/topup — create a Cryptomus payment to top up wallet balance
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { amount } = await req.json();
  const parsed = parseFloat(amount);
  if (!parsed || parsed < 20) {
    return NextResponse.json({ error: "El monto mínimo de recarga es $20 USDT" }, { status: 400 });
  }

  if (!MERCHANT || !API_KEY) {
    return NextResponse.json({ error: "Cryptomus no configurado" }, { status: 503 });
  }

  // Generate unique cents to identify payment on blockchain (0.01–0.99)
  const randomCents = (Math.floor(Math.random() * 99) + 1) / 100;
  const uniqueAmount = parseFloat((parsed + randomCents).toFixed(2));
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create topup record
  const topup = await prisma.walletTopup.create({
    data: {
      userEmail:   session.user.email,
      userName:    session.user.name || session.user.email,
      amount:      parsed,
      uniqueAmount,
      expiresAt,
      status:      "pending",
    },
  });

  const body = {
    amount:       String(uniqueAmount.toFixed(2)),
    currency:     "USDT",
    order_id:     topup.id,
    url_return:   `${BASE_URL}/payment/return?topupId=${topup.id}`,
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
      await prisma.walletTopup.delete({ where: { id: topup.id } });
      return NextResponse.json({ error: data.message || "Error al crear pago en Cryptomus" }, { status: 502 });
    }

    return NextResponse.json({ url: data.result.url, topupId: topup.id, uniqueAmount });
  } catch {
    await prisma.walletTopup.delete({ where: { id: topup.id } });
    return NextResponse.json({ error: "No se pudo conectar con Cryptomus" }, { status: 502 });
  }
}
