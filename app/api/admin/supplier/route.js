import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { supplierGetProducts, supplierGetBalance } from "../../../../lib/npprteam";

// GET /api/admin/supplier — lista productos + saldo del proveedor (admin only)
export async function GET() {
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

  try {
    const [rawProducts, balance] = await Promise.all([
      supplierGetProducts(),
      supplierGetBalance(),
    ]);

    // Flatten: { category: [products] } → [{ ...product, category }]
    const products = Object.entries(rawProducts).flatMap(([category, items]) =>
      Array.isArray(items)
        ? items.map(item => ({ ...item, category }))
        : []
    );

    return NextResponse.json({ products, balance });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Error al conectar con el proveedor" }, { status: 502 });
  }
}
