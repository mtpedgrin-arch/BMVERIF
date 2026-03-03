import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
// Usa fetch directo (sin SDK de OpenAI) igual que el resto del proyecto
async function callOpenAI(messages) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({ model: "gpt-4o-mini", temperature: 0.2, messages }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const data = await res.json();
  return data.choices[0]?.message?.content?.trim() || "";
}

// POST /api/admin/sync-descriptions
// Body: { limit: 20, offset: 0, overwrite: false }
// Genera descripciones en español desde el nombre del producto (titleEn con " · " separadores).
// Una sola llamada a OpenAI por batch → rápido y sin timeout.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 503 });
  }

  let limit     = 20;
  let offset    = 0;
  let overwrite = false;
  try {
    const body = await req.json();
    if (typeof body.limit     === "number") limit     = Math.min(body.limit, 40);
    if (typeof body.offset    === "number") offset    = body.offset;
    if (typeof body.overwrite === "boolean") overwrite = body.overwrite;
  } catch {}

  const where = overwrite
    ? { supplierProductId: { not: null } }
    : { supplierProductId: { not: null }, OR: [{ details: null }, { details: "" }] };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
      skip:  offset,
      take:  limit,
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

  const productList = products.map((p, i) => `${i + 1}. ${p.name}`).join("\n");

  let descriptions = [];
  try {
    const raw = await callOpenAI([
        {
          role: "system",
          content: `Sos redactor de una tienda argentina que vende cuentas y herramientas de Facebook/Meta.
Te doy productos cuyo nombre contiene sus características separadas por " · ".

Para cada producto generá una descripción en español argentino con EXACTAMENTE este formato de líneas "Clave: valor":

Para cuentas de Facebook (Account Facebook):
Verificación: [email, teléfono, selfie — según lo que figure en el nombre]
Antigüedad: [X+ días/meses de farm si figura, si no: "recién creada"]
Amigos: [rango si figura]
Incluye: [cookies, token, avatar, 2FA, etc. según el nombre]
Geo: [país o región si figura, sino "Mix de países"]
Uso ideal: Para CRM, automatización y herramientas de marketing digital
Entrega: Inmediata tras confirmación del pago · Formato: usuario:contraseña:cookie

Para Business Managers (Business Manager):
Tipo: [Verificado / No verificado según el nombre]
WhatsApp API: [Activa / No incluida — según si dice "WhatsApp API" o "WA" en el nombre]
Cuenta publicitaria: [Incluida / No incluida — según si dice "Ad account created/not created"]
Límite de gasto: [si figura en el nombre, ej: $250]
Geo: [país o región si figura, sino "Mix de países"]
Antigüedad: [años de creación si figuran]
Sin riesgo de ban: [Sí / No — según si dice "no ban risk"]
Uso ideal: Para publicidad en Meta, WhatsApp Business API, e-commerce y lead generation
Entrega: Inmediata · Formato: enlace de acceso al Business Manager

Para Fan Pages (Fan Page):
Tipo: [con o sin seguidores, tipo de nicho si figura]
Nombre: [cambiable / no cambiable — según el nombre]
Antigüedad: [año de creación si figura]
Seguidores: [cantidad si figura]
Uso ideal: Para publicidad y presencia de marca en Facebook
Entrega: Inmediata · Formato: acceso completo a la página

Para Ads Accounts (Ads Account):
Límite de gasto: [si figura, ej: $50, $250, ilimitado]
Transferencia: [si dice "Transfer to Your BM" incluirlo]
Geo: [país o región si figura]
Uso ideal: Para campañas publicitarias en Meta Ads
Entrega: Inmediata · Formato: acceso a la cuenta publicitaria

GARANTÍA ESTÁNDAR (agregar siempre al final, adaptada al producto):
Garantía: Reposición si hay problemas de acceso o el producto no funciona al momento de la entrega. Sin garantía post-uso (una vez que activás o usás la cuenta).

REGLAS:
- Solo incluí líneas que tengan info real del nombre del producto
- Máximo 8 líneas por producto
- Usá "vos" y español argentino informal pero profesional
- No inventes datos que no están en el nombre

Respondé SOLO con un JSON array sin markdown:
[{"index": 1, "details": "Verificación: ...\nIncluye: ...\nGarantía: ..."}, ...]`,
        },
        {
          role: "user",
          content: `Generá descripciones para estos ${products.length} productos:\n\n${productList}`,
        },
      ],
    ]);

    const jsonStr = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "");
    descriptions = JSON.parse(jsonStr);
  } catch (err) {
    return NextResponse.json({ error: `Error OpenAI: ${err.message}` }, { status: 500 });
  }

  // Guardar en una sola transacción
  const updates = descriptions
    .map(d => {
      const product = products[d.index - 1];
      if (!product || !d.details?.trim()) return null;
      return prisma.product.update({
        where: { id: product.id },
        data:  { details: d.details.trim() },
      });
    })
    .filter(Boolean);

  let processed = 0;
  const errors  = [];
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
    remaining:  Math.max(0, total - offset - products.length),
    nextOffset: offset + products.length,
    errors,
    // preview de los primeros 2 para verificar calidad
    preview: descriptions.slice(0, 2).map(d => ({
      product: products[d.index - 1]?.name?.slice(0, 60),
      details: d.details,
    })),
  });
}
