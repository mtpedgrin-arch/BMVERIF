import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { supplierGetProducts, supplierGetBalance, supplierGetProduct } from "../../../../lib/npprteam";

// Clasifica un producto por categoría L3 según su título (alineado con PRODUCT_CATS)
function getSubcat(titleEn) {
  if (!titleEn) return "other";
  const t = titleEn.toLowerCase();
  if (t.includes("fan page")) return "fan-pages";
  if (t.includes("softreg") || t.includes("selfreg")) return "softregs";
  if (t.startsWith("ads account") || t.startsWith("facebook ads account")) {
    if (t.includes("usa") || t.includes("u.s.a")) return "ads-usa";
    return "ads-general";
  }
  if (t.startsWith("business manager facebook") ||
      t.startsWith("facebook business manager") ||
      t.startsWith("account business manager")) {
    if (t.includes("balloon"))                                  return "bm-balloon";
    if (t.includes("agenc"))                                    return "bm-agency";
    if (t.includes("credit") || t.includes("line of credit") ||
        t.includes("crédito") || t.includes("credito"))         return "bm-credit";
    return "bm-verified";
  }
  if (t.startsWith("facebook account") || t.startsWith("account facebook") ||
      t.startsWith("accounts facebook") || t.startsWith("usa facebook account")) {
    if (t.includes("usa") || t.startsWith("usa ")) return "accounts-usa";
    return "accounts-general";
  }
  return "other";
}

const SUBCAT_LABELS = {
  "bm-verified":    "✅ BMs Verificadas",
  "bm-balloon":     "🎈 BM Balloon",
  "bm-agency":      "🏛 BM Agencia",
  "bm-credit":      "💳 BM Línea de Crédito",
  "ads-usa":        "🇺🇸 Ads USA",
  "ads-general":    "🌐 Ads General",
  "fan-pages":      "📄 Fan Pages",
  "accounts-usa":   "🇺🇸 Cuentas USA",
  "accounts-general":"🌐 Cuentas General",
  "softregs":       "🤖 Softregs",
  "other":          "📦 Otros",
};

// GET /api/admin/supplier — saldo + productos Facebook (admin only)
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.NPPRTEAM_API_KEY) {
    return NextResponse.json(
      { error: "NPPRTEAM_API_KEY no está configurada en las variables de entorno de Vercel." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  // Lookup individual por ID
  if (productId) {
    try {
      const result = await supplierGetProduct(productId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ ok: false, data: { message: err.message } });
    }
  }

  // Saldo
  const balance = await supplierGetBalance().catch(() => null);

  // Productos Facebook
  let products = null;
  let productsError = null;

  try {
    const raw = await supplierGetProducts("facebook");
    const fbItems = raw.facebook || [];

    // Agregar subcategoría y aplanar
    products = fbItems.map(p => ({
      ...p,
      subcat: getSubcat(p.titleEn),
      subcatLabel: SUBCAT_LABELS[getSubcat(p.titleEn)] || "Otros",
    }));
  } catch (err) {
    productsError = err.message || "El catálogo no está disponible";
  }

  return NextResponse.json({ products, productsError, balance, subcatLabels: SUBCAT_LABELS });
}
