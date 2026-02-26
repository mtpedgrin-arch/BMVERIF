import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { productCreateSchema } from "../../../lib/validators";

export async function GET() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ ok: true, products });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const parsed = productCreateSchema.parse(body);

    const product = await prisma.product.create({ data: parsed });
    return NextResponse.json({ ok: true, product }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Invalid request", details: err?.message },
      { status: 400 }
    );
  }
}
