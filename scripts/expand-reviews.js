const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Comment pools ──────────────────────────────────────────────────────────────
const COMMENTS_5 = [
  "Excelente producto, funcionó perfecto desde el primer momento",
  "Muy buena cuenta, sin ningún inconveniente",
  "Entrega inmediata, tal como se prometió. Muy recomendado",
  "Todo perfecto, ya compré varias veces y siempre igual de bien",
  "Recomiendo 100%, muy profesional el servicio",
  "La cuenta llegó rápido y sin problemas, volvería a comprar",
  "Excelente calidad, justo lo que necesitaba para mis campañas",
  "Muy satisfecho, entrega en minutos. Gracias",
  "Funciona perfecto, sin restricciones. Muy bueno",
  "Top seller, ya van 3 compras y siempre impecable",
  "Todo como se describe, entrega rapidísima",
  "Muy buen producto, lo recomiendo a todos",
];
const COMMENTS_4 = [
  "Muy buena cuenta, pequeño detalle al inicio pero se resolvió rápido",
  "Buen producto, entrega un poco más lenta de lo esperado pero llegó bien",
  "Buena calidad general, recomendado",
  "Funciona bien, dentro de lo esperado",
  "Buen servicio, sin mayores inconvenientes",
  "Producto como se describe, satisfecho con la compra",
];
const COMMENTS_3 = [
  "Cumplió con lo básico, nada extraordinario",
  "Funciona, pero tardó un poco más de lo indicado",
  "Producto correcto, esperaba un poco más",
];

const NAMES = [
  "A***n", "M***a", "C***s", "J***e", "R***o",
  "L***a", "D***d", "S***n", "P***o", "F***a",
  "G***l", "K***a", "N***s", "T***r", "B***o",
  "V***a", "H***n", "E***a", "W***n", "I***a",
  "Q***t", "X***o", "Y***a", "Z***n", "U***s",
  "O***r", "Á***s", "M***l", "J***n", "C***a",
  "R***l", "S***a", "P***e", "F***o", "G***a",
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Random date in a specific year range [startMs, endMs]
function randomDateBetween(start, end) {
  const t = start + Math.random() * (end - start);
  return new Date(t);
}

function createId(suffix) {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9) + (suffix || "");
}

// Generate ratings that average to target for N new reviews
function generateRatings(target, count) {
  // Mostly 5s and 4s to hit average
  const total = Math.round(target * count);
  const base = Math.floor(target);
  const ratings = Array(count).fill(base);
  let sum = base * count;
  let i = 0;
  while (sum < total && i < count) { ratings[i]++; sum++; i++; }
  // Shuffle
  for (let j = ratings.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [ratings[j], ratings[k]] = [ratings[k], ratings[j]];
  }
  return ratings;
}

function commentForRating(r) {
  if (r === 5) return pick(COMMENTS_5);
  if (r === 4) return pick(COMMENTS_4);
  return pick(COMMENTS_3);
}

async function recalc(productId) {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT rating FROM "Review" WHERE "productId" = $1`, productId
  );
  const count = rows.length;
  const avg = count > 0 ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { rating: Math.round(avg * 100) / 100, reviews: count },
  });
  return { count, avg: avg.toFixed(2) };
}

async function run() {
  // ── 1. Spread existing reviews across 2025 ────────────────────────────────
  console.log('\n── Step 1: Updating existing review dates to 2025 ──');
  const existing = await prisma.$queryRawUnsafe(
    `SELECT id FROM "Review" ORDER BY "createdAt" ASC`
  );

  const jan2025 = new Date('2025-01-10').getTime();
  const dec2025 = new Date('2025-12-20').getTime();

  for (let i = 0; i < existing.length; i++) {
    // Spread evenly across 2025
    const t = jan2025 + (i / Math.max(existing.length - 1, 1)) * (dec2025 - jan2025);
    const date = new Date(t + Math.random() * 86400000 * 7); // ± 7 day jitter
    await prisma.$executeRawUnsafe(
      `UPDATE "Review" SET "createdAt" = $1 WHERE id = $2`,
      date, existing[i].id
    );
  }
  console.log(`  Updated ${existing.length} existing reviews → dates in 2025`);

  // ── 2. Add more reviews per product ──────────────────────────────────────
  console.log('\n── Step 2: Adding more reviews ──');

  const products = await prisma.product.findMany({ where: { isActive: true } });

  // Target review counts & how to distribute dates
  // Products with many sales get more reviews, spread across 2025 + early 2026
  const targets = [
    { minSales: 400, targetReviews: 18 },
    { minSales: 200, targetReviews: 12 },
    { minSales: 100, targetReviews: 8  },
    { minSales: 50,  targetReviews: 6  },
    { minSales: 0,   targetReviews: 4  },
  ];

  for (const p of products) {
    const currentRows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM "Review" WHERE "productId" = $1`, p.id
    );
    const current = parseInt(currentRows[0].cnt);

    const rule = targets.find(t => p.sales >= t.minSales) || targets[targets.length - 1];
    const needed = Math.max(0, rule.targetReviews - current);

    if (needed === 0) {
      console.log(`  ${p.name.slice(0,40).padEnd(40)} | sales:${p.sales} | reviews: ${current} (already at target)`);
      continue;
    }

    // Keep target rating between 4.7–5.0
    const targetRating = p.rating >= 4.5 ? p.rating : 4.8;
    const ratings = generateRatings(Math.min(targetRating, 5), needed);

    // New reviews: mix of 2025 (70%) and early 2026 (30%)
    const mar2025  = new Date('2025-03-01').getTime();
    const jan2026  = new Date('2026-01-05').getTime();
    const feb2026  = new Date('2026-02-25').getTime();

    for (let i = 0; i < needed; i++) {
      const id = createId(i);
      let date;
      if (i < Math.floor(needed * 0.7)) {
        date = randomDateBetween(mar2025, dec2025);
      } else {
        date = randomDateBetween(jan2026, feb2026);
      }
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Review" (id, "productId", rating, comment, "userName", "createdAt", "userId")
         VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
        id, p.id, ratings[i], commentForRating(ratings[i]), pick(NAMES), date
      );
    }

    const result = await recalc(p.id);
    console.log(`  ${p.name.slice(0,40).padEnd(40)} | +${needed} reviews → total: ${result.count} | avg: ${result.avg}`);
  }

  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
