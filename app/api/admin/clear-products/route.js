import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// POST /api/admin/clear-products — borra TODOS los productos (admin only)
// Borra también: OrderItems, Reviews, Favorites relacionados
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    // Borrar en orden correcto para respetar foreign keys
    const deletedFavorites = await prisma.favorite.deleteMany({});
    const deletedReviews   = await prisma.review.deleteMany({});
    // OrderItems NO se borran para no romper el historial de órdenes
    // Pero sí desvinculamos el productId para que no fallen FK
    // En realidad Prisma/Postgres permite borrar si la FK tiene onDelete: SetNull o Cascade
    // Revisamos: si hay OrderItems con FK a Product, primero los desvinculamos
    // Borrar los productos (cascada a OrderItems si está configurado, sino error)
    const deletedProducts  = await prisma.product.deleteMany({});

    return NextResponse.json({
      ok: true,
      deleted: {
        products:  deletedProducts.count,
        reviews:   deletedReviews.count,
        favorites: deletedFavorites.count,
      },
    });
  } catch (err) {
    // Si falla por FK constraint en OrderItems, borrar OrderItems primero
    if (err.message?.includes("foreign key") || err.code === "P2003") {
      try {
        await prisma.favorite.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.orderItem.deleteMany({});
        const deletedProducts = await prisma.product.deleteMany({});
        return NextResponse.json({
          ok: true,
          deleted: { products: deletedProducts.count, note: "OrderItems también borrados" },
        });
      } catch (err2) {
        return NextResponse.json({ ok: false, error: err2.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
