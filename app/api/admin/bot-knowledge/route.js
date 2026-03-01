import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

function adminOnly(session) {
  return session?.user?.role === "admin";
}

// GET /api/admin/bot-knowledge — list all entries
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const entries = await prisma.botKnowledge.findMany({
    orderBy: [{ topic: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(entries);
}

// POST /api/admin/bot-knowledge — create entry
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { topic, content, active } = await req.json();
  if (!topic?.trim() || !content?.trim()) {
    return NextResponse.json({ error: "Tema y contenido son obligatorios." }, { status: 400 });
  }

  const entry = await prisma.botKnowledge.create({
    data: {
      topic: topic.trim(),
      content: content.trim(),
      active: active !== false,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
