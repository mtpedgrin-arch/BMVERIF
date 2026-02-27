const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const COMMENTS = [
  "Excelente producto, muy recomendado",
  "Muy buena calidad, entrega rápida",
  "Todo perfecto, tal como se describe",
  "Rápido y confiable, sin problemas",
  "Excelente servicio, volvería a comprar",
  "Muy buena cuenta, funcionó de inmediato",
  "Llegó rápido y funcionó perfecto",
  "Recomiendo 100%, muy satisfecho",
  "Muy buena relación calidad-precio",
  "Sin inconvenientes, todo como se prometió",
  "Excelente, entrega inmediata",
  "Muy profesional, producto de calidad",
  "Funciona perfecto, totalmente recomendado",
  "Compra segura y rápida",
  "Buenísimo, justo lo que necesitaba",
];

const NAMES = [
  "A***n", "M***a", "C***s", "J***e", "R***o",
  "L***a", "D***d", "S***n", "P***o", "F***a",
  "G***l", "K***a", "N***s", "T***r", "B***o",
  "V***a", "H***n", "E***a", "W***n", "I***a",
  "Q***t", "X***o", "Y***a", "Z***n", "U***s",
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate N integer ratings (1-5) that average to target
function generateRatings(target, count) {
  const total = Math.round(target * count);
  const base = Math.floor(target);
  const ratings = Array(count).fill(base);
  let sum = base * count;
  let i = 0;
  while (sum < total && i < count) {
    if (ratings[i] < 5) { ratings[i]++; sum++; }
    i++;
  }
  // Shuffle
  for (let j = ratings.length - 1; j > 0; j--) {
    const k = Math.floor(Math.random() * (j + 1));
    [ratings[j], ratings[k]] = [ratings[k], ratings[j]];
  }
  return ratings;
}

// Random date in the past N days
function randomDate(daysBack) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  d.setHours(Math.floor(Math.random() * 20) + 6);
  return d;
}

function createId() {
  return "r" + Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

async function run() {
  const products = await prisma.product.findMany({ where: { reviews: { gt: 0 } } });

  for (const p of products) {
    const existing = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM "Review" WHERE "productId" = $1`, p.id
    );
    const existingCount = parseInt(existing[0].cnt);
    const needed = p.reviews - existingCount;

    console.log(`${p.name.slice(0, 40)} | rating: ${p.rating} | field: ${p.reviews} | DB: ${existingCount} | to create: ${Math.max(0, needed)}`);

    if (needed <= 0) continue;

    const ratings = generateRatings(p.rating, needed);

    for (let i = 0; i < needed; i++) {
      const id = createId() + i;
      const date = randomDate(120); // up to 120 days ago
      await prisma.$executeRawUnsafe(
        `INSERT INTO "Review" (id, "productId", rating, comment, "userName", "createdAt", "userId")
         VALUES ($1, $2, $3, $4, $5, $6, NULL)`,
        id, p.id, ratings[i], pick(COMMENTS), pick(NAMES), date
      );
    }

    // Recalculate product rating from all reviews
    const allReviews = await prisma.$queryRawUnsafe(
      `SELECT rating FROM "Review" WHERE "productId" = $1`, p.id
    );
    const count = allReviews.length;
    const avg = count > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    await prisma.product.update({
      where: { id: p.id },
      data: { rating: Math.round(avg * 100) / 100, reviews: count },
    });

    console.log(`  -> Created ${needed} reviews. New avg: ${(avg).toFixed(2)} (${count} total)`);
  }

  await prisma.$disconnect();
  console.log('\nDone!');
}

run().catch(e => { console.error(e); process.exit(1); });
