const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const products = await prisma.product.findMany({ where: { reviews: { gt: 0 } } });
  for (const p of products) {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as cnt FROM "Review" WHERE "productId" = $1`, p.id
    );
    const actual = parseInt(rows[0].cnt);
    const ok = actual === p.reviews ? '✓' : '✗ MISMATCH';
    console.log(`${ok} | ${p.name.slice(0,45).padEnd(45)} | rating: ${String(p.rating).padEnd(5)} | field: ${p.reviews} | actual: ${actual}`);
  }
  await prisma.$disconnect();
}
run().catch(console.error);
