import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import { supplierGetProducts } from "../../../../lib/npprteam";

// Extrae la cantidad mínima de compra del producto del proveedor.
function extractMinQty(sp) {
  const direct = parseInt(sp.minQty || sp.min_qty || sp.minOrder || sp.min_order || sp.minimum || 0);
  if (direct > 1) return direct;
  const title = sp.titleEn || sp.title || "";
  const m = title.match(/[Ff]rom\s+(\d+)\s+[Pp][Cc][Ss]?/);
  if (m) return Math.max(1, parseInt(m[1]));
  return 1;
}

// POST /api/admin/sync-minqty
// Actualiza SOLO stock y minQty de los productos ya importados.
// NUNCA toca precio, costo, nombre, categoría, tiers ni isActive.
// Seguro de correr en cualquier momento sin afectar configuración del admin.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.NPPRTEAM_API_KEY) {
    return NextResponse.json({ error: "NPPRTEAM_API_KEY no configurada." }, { status: 503 });
  }

  // 1. Traer catálogo del proveedor
  let fbItems = [];
  try {
    const raw = await supplierGetProducts("facebook");
    fbItems = raw.facebook || [];
  } catch (err) {
    return NextResponse.json({ error: `Error al obtener catálogo: ${err.message}` }, { status: 502 });
  }

  if (fbItems.length === 0) {
    return NextResponse.json({ error: "El proveedor devolvió 0 productos." }, { status: 502 });
  }

  // 2. Traer nuestros productos con supplierProductId
  const existing = await prisma.product.findMany({
    where: { supplierProductId: { not: null } },
    select: { id: true, supplierProductId: true, name: true, minQty: true },
  });
  const existingMap = new Map(existing.map(p => [p.supplierProductId, p]));

  let updated = 0;
  let unchanged = 0;
  const changed = []; // productos donde minQty cambió
  const errors = [];

  for (const sp of fbItems) {
    const sid    = String(sp.id);
    const stock  = parseInt(sp.qty) || 0;
    const minQty = extractMinQty(sp);

    if (!existingMap.has(sid)) continue; // producto nuevo, no lo tocamos

    const existing = existingMap.get(sid);

    try {
      await prisma.product.update({
        where: { id: existing.id },
        data: { stock, minQty }, // SOLO stock y minQty — nunca precio, costo, nombre, etc.
      });

      if (existing.minQty !== minQty) {
        changed.push({ name: existing.name.slice(0, 60), prev: existing.minQty, now: minQty });
      } else {
        unchanged++;
      }
      updated++;
    } catch (err) {
      errors.push({ id: sid, error: err.message });
    }
  }

  return NextResponse.json({
    ok: true,
    supplierTotal: fbItems.length,
    existingProducts: existing.length,
    updated,
    unchanged,
    minQtyChanges: changed,
    errors: errors.slice(0, 10),
    timestamp: new Date().toISOString(),
  });
}
