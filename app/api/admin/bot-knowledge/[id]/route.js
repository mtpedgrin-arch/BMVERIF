import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/authOptions";
import { prisma } from "../../../../../lib/prisma";

function adminOnly(session) {
  return session?.user?.role === "admin";
}

// PATCH /api/admin/bot-knowledge/[id] — update entry
export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = params;
  const body = await req.json();

  const data = {};
  if (body.topic !== undefined) data.topic = body.topic.trim();
  if (body.content !== undefined) data.content = body.content.trim();
  if (body.active !== undefined) data.active = body.active;

  const entry = await prisma.botKnowledge.update({ where: { id }, data });
  return NextResponse.json(entry);
}

// DELETE /api/admin/bot-knowledge/[id] — delete entry
export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.botKnowledge.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
