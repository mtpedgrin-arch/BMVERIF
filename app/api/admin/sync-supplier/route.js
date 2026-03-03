import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import { supplierGetProducts } from "../../../../lib/npprteam";

// Mapea el título del producto a la categoría L3 más específica posible.
// Mantiene consistencia con PRODUCT_CATS en MarketplaceClient.jsx.
function getSubcat(titleEn) {
  if (!titleEn) return "other";
  const t = titleEn.toLowerCase();

  // Fan Pages
  if (t.includes("fan page")) return "fan-pages";

  // Softregs
  if (t.includes("softreg") || t.includes("selfreg")) return "softregs";

  // Ads Accounts → L3 según GEO
  if (t.startsWith("ads account") || t.startsWith("facebook ads account")) {
    if (t.includes("usa") || t.includes("u.s.a")) return "ads-usa";
    return "ads-general";
  }

  // Business Managers → L3 por tipo
  if (t.startsWith("business manager facebook") ||
      t.startsWith("facebook business manager") ||
      t.startsWith("account business manager")) {
    if (t.includes("balloon"))                                   return "bm-balloon";
    if (t.includes("agenc"))                                     return "bm-agency";
    if (t.includes("credit") || t.includes("line of credit") ||
        t.includes("crédito") || t.includes("credito"))          return "bm-credit";
    // Solo "verified" en el sentido Meta (no "verified email/e-mail")
    const hasVerified = t.includes("verified") || t.includes("verificad");
    const hasEmail    = t.includes("email") || t.includes("e-mail") || t.includes("mail");
    if (hasVerified && !hasEmail)                               return "bm-verified";
    return "bm-ads"; // BM para publicidad (no verificada por Meta)
  }

  // Cuentas Facebook → L3 por GEO
  if (t.startsWith("facebook account") || t.startsWith("account facebook") ||
      t.startsWith("accounts facebook") || t.startsWith("usa facebook account")) {
    if (t.includes("usa") || t.startsWith("usa ")) return "accounts-usa";
    return "accounts-general";
  }

  return "other";
}

// Construye el array de tiers a partir del precio base y los porcentajes de descuento.
// tierDisc5: % de descuento para 5 unidades (0 = sin tier)
// tierDisc10: % de descuento para 10 unidades (0 = sin tier)
function buildTiers(basePrice, tierDisc5, tierDisc10) {
  const tiers = [];
  if (!basePrice) return tiers;
  if (tierDisc5  > 0 && tierDisc5  < 100) tiers.push({ qty: 5,  price: parseFloat((basePrice * (1 - tierDisc5  / 100)).toFixed(2)) });
  if (tierDisc10 > 0 && tierDisc10 < 100) tiers.push({ qty: 10, price: parseFloat((basePrice * (1 - tierDisc10 / 100)).toFixed(2)) });
  return tiers;
}

// POST /api/admin/sync-supplier
// Body: { margin: number (default 30), deactivateMissing: boolean (default false),
//         tierDisc5: number (0 = sin tier), tierDisc10: number (0 = sin tier) }
// Sincroniza TODO el catálogo de Facebook del proveedor a nuestra DB.
// - Si el producto ya existe (por supplierProductId): actualiza nombre, stock, costo, precio, categoría y tiers
// - Si no existe: lo crea
// - Si deactivateMissing=true: desactiva productos que ya no están en el catálogo
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.NPPRTEAM_API_KEY) {
    return NextResponse.json(
      { error: "NPPRTEAM_API_KEY no configurada." },
      { status: 503 }
    );
  }

  let margin = 30;
  let deactivateMissing = false;
  let tierDisc5  = 0; // % de descuento para 5 unidades (0 = sin tier)
  let tierDisc10 = 0; // % de descuento para 10 unidades (0 = sin tier)
  try {
    const body = await req.json();
    if (typeof body.margin === "number" && body.margin >= 0) margin = body.margin;
    if (typeof body.deactivateMissing === "boolean") deactivateMissing = body.deactivateMissing;
    if (typeof body.tierDisc5  === "number" && body.tierDisc5  > 0 && body.tierDisc5  < 100) tierDisc5  = body.tierDisc5;
    if (typeof body.tierDisc10 === "number" && body.tierDisc10 > 0 && body.tierDisc10 < 100) tierDisc10 = body.tierDisc10;
  } catch {}

  const hasTiers = tierDisc5 > 0 || tierDisc10 > 0;

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

  // 2. Traer todos nuestros productos que tienen supplierProductId
  const existingProducts = await prisma.product.findMany({
    where: { supplierProductId: { not: null } },
    select: { id: true, supplierProductId: true },
  });
  const existingMap = new Map(existingProducts.map(p => [p.supplierProductId, p.id]));

  // IDs del proveedor en el catálogo actual
  const supplierIds = new Set(fbItems.map(p => String(p.id)));

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors = [];

  // 3. Procesar cada producto del proveedor
  for (const sp of fbItems) {
    const sid   = String(sp.id);
    const subcat = getSubcat(sp.titleEn);
    const cost   = parseFloat(sp.priceUsd) || 0;
    const price  = parseFloat((cost * (1 + margin / 100)).toFixed(2));
    const stock  = parseInt(sp.qty) || 0;
    const name   = sp.titleEn || sp.title || `Producto #${sid}`;
    const tiers  = buildTiers(price, tierDisc5, tierDisc10);
    // Intentar varios nombres de campo para el conteo de ventas del proveedor
    const soldRaw = sp.sold ?? sp.totalSold ?? sp.soldCount ?? sp.total_sold ?? sp.qty_sold ?? sp.salesCount ?? null;
    const sales   = soldRaw !== null ? parseInt(soldRaw) || 0 : null; // null = no actualizar si no existe el campo

    try {
      if (existingMap.has(sid)) {
        // Actualizar — solo sobreescribimos sales si el proveedor devuelve el campo
        // Solo actualizamos tiers si el admin configuró discuentos (hasTiers=true)
        await prisma.product.update({
          where: { id: existingMap.get(sid) },
          data: {
            name,
            cost,
            price,
            stock,
            category: subcat,
            isActive: true,
            ...(hasTiers ? { tiers } : {}),
            ...(sales !== null ? { sales } : {}),
          },
        });
        updated++;
      } else {
        // Crear — usar ventas del proveedor si las trae, sino 0
        await prisma.product.create({
          data: {
            name,
            cost,
            price,
            stock,
            tiers,
            category:          subcat,
            supplierProductId: sid,
            isActive:          true,
            sales:             sales ?? 0,
            badgeDiscount:     0,
          },
        });
        created++;
      }
    } catch (err) {
      errors.push({ id: sid, name, error: err.message });
      skipped++;
    }
  }

  // 4. Desactivar productos que ya no están en el catálogo
  let deactivated = 0;
  if (deactivateMissing) {
    const toDeactivate = existingProducts.filter(p => !supplierIds.has(p.supplierProductId));
    if (toDeactivate.length > 0) {
      const result = await prisma.product.updateMany({
        where: { id: { in: toDeactivate.map(p => p.id) } },
        data:  { isActive: false },
      });
      deactivated = result.count;
    }
  }

  return NextResponse.json({
    ok: true,
    supplierTotal: fbItems.length,
    created,
    updated,
    skipped,
    deactivated,
    margin,
    tierDisc5,
    tierDisc10,
    errors: errors.slice(0, 10), // solo los primeros 10 para no saturar
  });
}
