import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";
import { supplierGetProduct } from "../../../../lib/npprteam";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extrae todos los campos de texto útiles del producto del proveedor
function extractRawInfo(data) {
  const fields = [];

  // Campos de descripción comunes en APIs de proveedores
  const textFields = [
    "description", "descriptionEn", "desc", "descEn",
    "details", "detailsEn", "info", "infoEn",
    "deliveryFormat", "delivery_format", "format", "formatEn",
    "guarantee", "warranty", "guaranteeEn", "warrantyEn",
    "terms", "conditions", "notes", "note",
    "replacement", "refund", "policy",
    "instructions", "howToUse", "how_to_use",
  ];

  for (const key of textFields) {
    if (data[key] && typeof data[key] === "string" && data[key].trim().length > 5) {
      fields.push(`[${key}]: ${data[key].trim()}`);
    }
  }

  // También capturamos campos desconocidos que sean strings largos (>30 chars)
  for (const [key, val] of Object.entries(data || {})) {
    if (!textFields.includes(key) && typeof val === "string" && val.trim().length > 30) {
      // Ignorar campos que ya tenemos (nombre, precio, etc.)
      if (!["titleEn", "title", "priceUsd", "id", "category", "slug", "image", "imageUrl", "url"].includes(key)) {
        fields.push(`[${key}]: ${val.trim()}`);
      }
    }
  }

  return fields.join("\n");
}

// POST /api/admin/sync-descriptions
// Body: { limit: 20, offset: 0, overwrite: false }
// Trae detalle del proveedor, traduce con OpenAI y guarda en product.details.
// Procesar de a 20 por llamada para evitar timeout de Vercel.
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OPENAI_API_KEY no configurada." }, { status: 503 });
  }
  if (!process.env.NPPRTEAM_API_KEY) {
    return NextResponse.json({ error: "NPPRTEAM_API_KEY no configurada." }, { status: 503 });
  }

  let limit = 20;
  let offset = 0;
  let overwrite = false; // false = solo procesar productos sin details
  try {
    const body = await req.json();
    if (typeof body.limit  === "number") limit     = Math.min(body.limit, 50);
    if (typeof body.offset === "number") offset    = body.offset;
    if (typeof body.overwrite === "boolean") overwrite = body.overwrite;
  } catch {}

  // Traer productos del proveedor que necesitan descripción
  const where = overwrite
    ? { supplierProductId: { not: null } }
    : { supplierProductId: { not: null }, OR: [{ details: null }, { details: "" }] };

  const products = await prisma.product.findMany({
    where,
    select: { id: true, name: true, supplierProductId: true },
    orderBy: { createdAt: "asc" },
    skip: offset,
    take: limit,
  });

  const total = await prisma.product.count({ where });

  if (products.length === 0) {
    return NextResponse.json({ ok: true, message: "No hay productos pendientes de descripción.", total, offset, processed: 0 });
  }

  let processed = 0;
  let skipped   = 0;
  const errors  = [];

  for (const product of products) {
    try {
      // 1. Traer detalle del proveedor
      const { ok, data } = await supplierGetProduct(product.supplierProductId);

      // 2. Extraer campos de texto
      const rawInfo = extractRawInfo(data);

      if (!rawInfo || rawInfo.length < 10) {
        // El proveedor no tiene descripción para este producto — generar desde el nombre
        const details = await generateFromName(product.name);
        if (details) {
          await prisma.product.update({ where: { id: product.id }, data: { details } });
          processed++;
        } else {
          skipped++;
        }
        continue;
      }

      // 3. Traducir y formatear con OpenAI
      const details = await translateAndFormat(product.name, rawInfo);
      if (!details) { skipped++; continue; }

      // 4. Guardar en la DB
      await prisma.product.update({ where: { id: product.id }, data: { details } });
      processed++;

    } catch (err) {
      errors.push({ id: product.id, name: product.name.slice(0, 50), error: err.message });
    }
  }

  return NextResponse.json({
    ok: true,
    total,           // total de productos pendientes
    offset,          // desde qué posición procesamos
    processed,       // cuántos se actualizaron
    skipped,
    remaining: Math.max(0, total - offset - products.length),
    nextOffset: offset + products.length,
    errors: errors.slice(0, 5),
  });
}

async function translateAndFormat(productName, rawInfo) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Sos un asistente de una tienda online argentina que vende cuentas y herramientas de Facebook/Meta.
Tu tarea es traducir y formatear la información técnica de un producto al español argentino claro y profesional.

Formato de salida (usar exactamente este formato con "Clave: valor" por línea):
Entrega: [cómo se entrega, en cuánto tiempo]
Formato: [qué recibe el cliente — credenciales, cookies, etc.]
Garantía: [política de reemplazo o garantía]
Uso recomendado: [para qué sirve, cómo se usa]
Requisitos: [si hay requisitos previos]
Notas: [información adicional importante]

Solo incluí las líneas que tengan información real. No inventes datos. Si algo no está en la info original, no lo pongas.
Usá "vos" en lugar de "tú". Máximo 8 líneas en total.`,
      },
      {
        role: "user",
        content: `Producto: ${productName}\n\nInformación del proveedor:\n${rawInfo}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || null;
}

async function generateFromName(productName) {
  // Si el proveedor no tiene descripción, genera algo mínimo desde el nombre
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: `Sos un asistente de una tienda online argentina de cuentas Facebook/Meta.
Generá una descripción corta y profesional en español argentino basada solo en el nombre del producto.
Formato: "Clave: valor" por línea. Máximo 4 líneas. Solo información verosímil según el nombre.`,
      },
      {
        role: "user",
        content: `Producto: ${productName}`,
      },
    ],
  });
  return completion.choices[0]?.message?.content?.trim() || null;
}
