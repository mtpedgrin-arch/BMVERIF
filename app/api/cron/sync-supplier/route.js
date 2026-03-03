import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { supplierGetProducts } from "../../../../lib/npprteam";

const CRON_SECRET = process.env.CRON_SECRET || "bmverif_cron_2026";

// Extrae la cantidad mínima de compra del producto del proveedor.
function extractMinQty(sp) {
  const direct = parseInt(sp.minimalOrder || sp.minQty || sp.min_qty || sp.minOrder || sp.min_order || sp.minimum || 0);
  if (direct > 1) return direct;
  const title = sp.titleEn || sp.title || "";
  const m = title.match(/[Ff]rom\s+(\d+)\s+[Pp][Cc][Ss]?/);
  if (m) return Math.max(1, parseInt(m[1]));
  return 1;
}

// GET /api/cron/sync-supplier?secret=<CRON_SECRET>
// Configura en cron-job.org para que corra cada X horas.
// Actualiza STOCK y MINQTY de los productos ya importados — nunca toca precio, tiers ni nombre.
// Si aparecen productos nuevos en el catálogo, los crea automáticamente.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ ok: false, error: "El proveedor devolvió 0 productos." });
  }

  // 2. Traer nuestros productos con supplierProductId
  const existing = await prisma.product.findMany({
    where: { supplierProductId: { not: null } },
    select: { id: true, supplierProductId: true },
  });
  const existingMap = new Map(existing.map(p => [p.supplierProductId, p.id]));

  let stockUpdated = 0;
  let created      = 0;
  let errors       = 0;

  for (const sp of fbItems) {
    const sid    = String(sp.id);
    const stock  = parseInt(sp.qty) || 0;
    const minQty = extractMinQty(sp);

    try {
      if (existingMap.has(sid)) {
        // Actualizar stock y minQty — nunca tocar precio, tiers, nombre ni categoría
        await prisma.product.update({
          where: { id: existingMap.get(sid) },
          data: { stock, minQty },
        });
        stockUpdated++;
      } else {
        // Producto nuevo en el catálogo: crearlo con margen 0 (costo = precio)
        // El admin puede ajustar el precio después desde el panel
        const cost = parseFloat(sp.priceUsd) || 0;
        await prisma.product.create({
          data: {
            name:              sp.titleEn || sp.title || `Producto #${sid}`,
            cost,
            price:             cost, // sin margen — el admin lo ajusta
            stock,
            minQty,
            tiers:             [],
            category:          "other",
            supplierProductId: sid,
            isActive:          false, // desactivado hasta que el admin lo configure
            sales:             0,
            badgeDiscount:     0,
          },
        });
        created++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    ok: true,
    supplierTotal: fbItems.length,
    stockUpdated,
    created,       // nuevos productos (desactivados, pendientes de configurar)
    errors,
    timestamp: new Date().toISOString(),
  });
}
