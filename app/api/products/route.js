import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/authOptions";
import { prisma } from "../../../lib/prisma";

// GET /api/products — activos (público) o todos (admin con ?all=true)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const all   = searchParams.get("all")   === "true";
  const count = searchParams.get("count") === "true"; // diagnóstico: solo contar

  try {
    if (all) {
      const session = await getServerSession(authOptions);
      if (session?.user?.role !== "admin") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      if (count) {
        const n = await prisma.product.count();
        return NextResponse.json({ count: n });
      }
      const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
      return NextResponse.json(products);
    }

    // Solo mostrar productos del proveedor activos con stock
    if (count) {
      const n = await prisma.product.count({
        where: { isActive: true, supplierProductId: { not: null }, stock: { gt: 0 } },
      });
      return NextResponse.json({ count: n });
    }
    const products = await prisma.product.findMany({
      where: { isActive: true, supplierProductId: { not: null }, stock: { gt: 0 } },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(products);

  } catch (err) {
    console.error("[GET /api/products] Error:", err);
    return NextResponse.json(
      { error: err?.message || String(err) },
      { status: 500 }
    );
  }
}

// POST /api/products — crear producto (admin)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const { name, details, price, cost, tiers, stock, category, sales, supplierProductId } = await req.json();
  if (!name || price == null) {
    return NextResponse.json({ error: "Nombre y precio son obligatorios." }, { status: 400 });
  }
  const product = await prisma.product.create({
    data: {
      name: name.trim(),
      details: details?.trim() || null,
      price: parseFloat(price),
      cost: parseFloat(cost) || 0,
      tiers: Array.isArray(tiers) ? tiers : [],
      stock: parseInt(stock) || 0,
      sales: parseInt(sales) || 0,
      rating: 0,
      reviews: 0,
      isActive: true,
      category: category || "business-managers",
      supplierProductId: supplierProductId ? String(supplierProductId).trim() : null,
    },
  });
  return NextResponse.json(product);
}
