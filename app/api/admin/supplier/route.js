import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { supplierGetProducts, supplierGetBalance, supplierGetProduct } from "../../../../lib/npprteam";

// GET /api/admin/supplier — saldo + productos del proveedor (admin only)
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

  // Si se pide un producto individual por ID
  if (productId) {
    try {
      const result = await supplierGetProduct(productId);
      return NextResponse.json(result);
    } catch (err) {
      return NextResponse.json({ ok: false, data: { message: err.message } });
    }
  }

  // Saldo + intentar catálogo (puede fallar)
  const balance = await supplierGetBalance().catch(() => null);
  let products = null;
  let productsError = null;

  try {
    const rawProducts = await supplierGetProducts();
    products = Object.entries(rawProducts).flatMap(([category, items]) =>
      Array.isArray(items)
        ? items.map(item => ({ ...item, category }))
        : []
    );
  } catch (err) {
    productsError = err.message || "El catálogo no está disponible";
  }

  return NextResponse.json({ products, productsError, balance });
}
