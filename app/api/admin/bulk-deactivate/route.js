import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// POST /api/admin/bulk-deactivate — desactivar productos por lista de IDs
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ids } = await req.json();
  if (!ids?.length) return NextResponse.json({ error: "Sin IDs" }, { status: 400 });

  const result = await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true, desactivados: result.count });
}
