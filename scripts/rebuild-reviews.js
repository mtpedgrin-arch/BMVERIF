const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ── Pools ─────────────────────────────────────────────────────────────────────
// Cada texto se usa UNA sola vez en toda la DB (pool global)
// null = solo estrellas, no se ve como repetido

const TEXT_5 = [
  "excelente",
  "Exelente!",
  "muy bueno",
  "re buena la compra",
  "100% recomendado",
  "recomiendo",
  "top",
  "ok todo bien",
  "buenisimo",
  "funciona perfecto",
  "Excelente producto, funcionó perfecto desde el primer momento",
  "mui buena cuenta sin ningun inconveniente",
  "entrega inmediata como prometido!! muy recomendado",
  "todo perfecto ya compre varias veces siempre igual de bien",
  "muy profesional el servicio, recomiendo 100%",
  "la cuenta llego rapido y sin problemas, volveria a comprar",
  "Exelente calidad, justo lo ke necesitaba para mis campañas",
  "muy satisfecho entrega en minutos gracias!!",
  "funciona perfecto sin restricciones muy bueno",
  "ya van 3 compras y siempre impecable",
  "todo como se describe, entrega rapidisima",
  "Muy buen producto lo recomiendo a todos",
  "llego todo ok, sin problemas",
  "conforme con la compra",
  "funciono al instante gracias",
  "tal cual dice la descripcion, excelente",
  "5 estrellas merece mas",
  "super rapido todo",
  "respondio rapido mis dudas, muy buen vendedor",
  "compre 2 y los 2 perfectos",
  "sin problemas, la cuenta activa al toque",
  "de 10",
  "re copado todo",
  "tremendo producto, funciono de una",
  "listo y funcionando, gracias",
  "primera compra y no defraudo",
];

const TEXT_4 = [
  "bien",
  "conforme",
  "esta bien",
  "ok",
  "buen producto",
  "buena cuenta, pequeño problema al inicio pero se resolvio rapido",
  "buen producto, entrega un poco mas lenta de lo esperado pero llego bien",
  "buena calidad en general, recomendado",
  "funciona bien, dentro de lo esperado",
  "buen servicio sin mayores inconvenientes",
  "producto como se describe, satisfecho",
  "todo bien, un poco de demora pero llego",
  "funciona aunque tarde un toque mas de lo esperado",
  "recomendable",
  "bien en general, nada que quejarme",
  "cumplio con lo prometido",
  "le falta un poco pero funciona bien",
];

const TEXT_3 = [
  "mas o menos",
  "esperaba mas",
  "cumple pero nada del otro mundo",
  "funciona pero tardo un poco",
  "esta bien, esperaba un poco mas la verdad",
  "producto correcto, nada extraordinario",
  "ok pero tardo bastante",
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

const TARGETS = [
  { minSales: 400, targetReviews: 12 },
  { minSales: 200, targetReviews: 9  },
  { minSales: 100, targetReviews: 7  },
  { minSales: 50,  targetReviews: 5  },
  { minSales: 0,   targetReviews: 3  },
];

// Probabilidad de dejar el comentario en blanco (solo estrellas)
// Alta a propósito: evita repetir textos entre productos distintos
const BLANK_CHANCE = 0.40;

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

function generateRatings(target, count) {
  const total = Math.round(Math.min(target, 5) * count);
  const base = Math.floor(Math.min(target, 5));
  const ratings = Array(count).fill(base);
  let sum = base * count, i = 0;
  while (sum < total && i < count) { ratings[i]++; sum++; i++; }
  return shuffle(ratings);
}

function randomDateBetween(a, b) { return new Date(a + Math.random() * (b - a)); }
function createId() { return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9); }

async function recalc(productId) {
  const rows = await prisma.$queryRawUnsafe(`SELECT rating FROM "Review" WHERE "productId" = $1`, productId);
  const count = rows.length;
  const avg = count > 0 ? rows.reduce((s, r) => s + r.rating, 0) / count : 0;
  await prisma.product.update({ where: { id: productId }, data: { rating: Math.round(avg * 100) / 100, reviews: count } });
  return { count, avg: avg.toFixed(2) };
}

async function run() {
  console.log('\n── Step 1: Borrando todos los reviews ──');
  const del = await prisma.$executeRawUnsafe(`DELETE FROM "Review"`);
  console.log(`  Borrados: ${del}`);

  // Pool global shuffleado — cada texto se consume una sola vez
  const pool5 = shuffle(TEXT_5); let idx5 = 0;
  const pool4 = shuffle(TEXT_4); let idx4 = 0;
  const pool3 = shuffle(TEXT_3); let idx3 = 0;

  function nextText(rating) {
    // Con BLANK_CHANCE % de prob → null (solo estrellas)
    if (Math.random() < BLANK_CHANCE) return null;
    if (rating >= 5) return idx5 < pool5.length ? pool5[idx5++] : null;
    if (rating >= 4) return idx4 < pool4.length ? pool4[idx4++] : null;
    return idx3 < pool3.length ? pool3[idx3++] : null;
  }

  console.log('\n── Step 2: Reconstruyendo reviews ──');

  const jan2025 = new Date('2025-01-15').getTime();
  const dec2025 = new Date('2025-12-20').getTime();
  const jan2026 = new Date('2026-01-05').getTime();
  const feb2026 = new Date('2026-02-25').getTime();

  const products = await prisma.product.findMany({ where: { isActive: true } });
  let totalInserted = 0, totalBlank = 0;

  for (const p of products) {
    const rule = TARGETS.find(t => p.sales >= t.minSales) || TARGETS[TARGETS.length - 1];
    const count = rule.targetReviews;
    const targetRating = p.rating >= 4.5 ? p.rating : 4.8;
    const ratings = generateRatings(targetRating, count);

    for (let i = 0; i < count; i++) {
      const comment = nextText(ratings[i]);
      if (comment === null) totalBlank++;
      const date = i < Math.floor(count * 0.7)
        ? randomDateBetween(jan2025, dec2025)
        : randomDateBetween(jan2026, feb2026);
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Review" (id, "productId", rating, comment, "userName", "createdAt", "userId")
         VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
        createId(), p.id, ratings[i], comment, pick(NAMES), date
      );
      totalInserted++;
    }

    const result = await recalc(p.id);
    console.log(`  ${p.name.slice(0, 42).padEnd(42)} | ${count} reviews | avg: ${result.avg}`);
  }

  console.log(`\n  Total insertados : ${totalInserted}`);
  console.log(`  Sin texto (blank): ${totalBlank} (${Math.round(totalBlank/totalInserted*100)}%)`);
  console.log(`  Con texto único  : ${totalInserted - totalBlank}`);
  console.log('\n✅ Done!');
  await prisma.$disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
