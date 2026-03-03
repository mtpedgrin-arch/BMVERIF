import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { supplierGetProduct, supplierGetProducts } from "../../../../lib/npprteam";

// GET /api/admin/supplier-product-debug?id=SUPPLIER_ID
// Muestra todos los campos que devuelve el proveedor para un producto específico.
// Si no se pasa id, muestra los primeros 3 productos del catálogo con TODOS sus campos.
export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    // Detalle de un producto específico
    const { ok, data } = await supplierGetProduct(id);
    return NextResponse.json({ ok, supplierProductId: id, data });
  }

  // Sin id: muestra los primeros 3 del catálogo con TODOS sus campos
  try {
    const raw = await supplierGetProducts("facebook");
    const items = (raw.facebook || []).slice(0, 3);
    return NextResponse.json({
      note: "Primeros 3 productos del catálogo — todos sus campos",
      items,
      allKeys: items.length > 0 ? Object.keys(items[0]) : [],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502 });
  }
}
