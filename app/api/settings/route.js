import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

export async function GET() {
  try {
    const rows = await prisma.settings.findMany();
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({});
  }
}

export async function PATCH(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  try {
    const updates = Object.entries(body).map(([key, value]) =>
      prisma.settings.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      })
    );
    await Promise.all(updates);

    const rows = await prisma.settings.findMany();
    const result = {};
    rows.forEach(r => { result[r.key] = r.value; });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "Error al guardar configuración" }, { status: 500 });
  }
}
