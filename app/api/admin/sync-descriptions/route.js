import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// El proveedor no tiene campo "description" — toda la info está en el título
// separada por " · ". Este endpoint la formatea en español con OpenAI.
//
// POST /api/admin/sync-descriptions
// Body: { limit: 30, offset: 0, overwrite: false }
// Procesar de a 30 por llamada para no superar el timeout de Vercel.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 503 });
  }

  let limit    = 30;
  let offset   = 0;
  let overwrite = false;
  try {
    const body = await req.json();
    if (typeof body.limit     === "number") limit     = Math.min(body.limit, 50);
    if (typeof body.offset    === "number") offset    = body.offset;
    if (typeof body.overwrite === "boolean") overwrite = body.overwrite;
  } catch {}

  // Traer productos pendientes (sin details, o todos si overwrite=true)
  const where = overwrite
    ? { supplierProductId: { not: null } }
    : { supplierProductId: { not: null }, OR: [{ details: null }, { details: "" }] };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      skip: offset,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  if (products.length === 0) {
    return NextResponse.json({
      ok: true,
      message: "✅ Todos los productos ya tienen descripción.",
      total,
      processed: 0,
      remaining: 0,
    });
  }

  // Armar un prompt batch con todos los productos del lote
  // (1 llamada a OpenAI para todo el batch en vez de N llamadas individuales)
  const productList = products
    .map((p, i) => `${i + 1}. ${p.name}`)
    .join("\n");

  let descriptions = [];
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `Sos un redactor de una tienda argentina de cuentas y herramientas de Facebook/Meta.
Te doy una lista de productos. Cada nombre está separado por " · " y contiene las características del producto.
Para cada producto generá una descripción corta en español argentino con este formato exacto:

Verificación: [tipo de verificación — email, teléfono, selfie, etc.]
Antigüedad: [tiempo de farm o creación si figura]
Contenido: [qué incluye — cookies, token, avatar, etc.]
Uso ideal: [para qué sirve — ads, CRM, publicidad, etc.]
Entrega: Inmediata tras confirmación del pago

Solo incluí las líneas que tengan datos reales en el nombre. Máximo 5 líneas por producto.
Respondé SOLO con un JSON array con este formato:
[
  {"index": 1, "details": "Verificación: ...\nContenido: ..."},
  {"index": 2, "details": "..."},
  ...
]
No agregues explicaciones ni texto extra, solo el JSON.`,
        },
        {
          role: "user",
          content: `Generá descripciones para estos ${products.length} productos:\n\n${productList}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content?.trim() || "[]";
    // Limpiar posible markdown code block
    const jsonStr = raw.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/i, "");
    descriptions = JSON.parse(jsonStr);
  } catch (err) {
    return NextResponse.json({ error: `Error OpenAI: ${err.message}` }, { status: 500 });
  }

  // Guardar en la DB en una sola transacción
  let processed = 0;
  const errors  = [];

  const updates = descriptions
    .map(d => {
      const product = products[d.index - 1];
      if (!product || !d.details) return null;
      return prisma.product.update({
        where: { id: product.id },
        data:  { details: d.details },
      });
    })
    .filter(Boolean);

  try {
    await prisma.$transaction(updates);
    processed = updates.length;
  } catch (err) {
    errors.push(err.message);
  }

  return NextResponse.json({
    ok: true,
    total,
    offset,
    processed,
    remaining: Math.max(0, total - offset - products.length),
    nextOffset: offset + products.length,
    errors,
  });
}
