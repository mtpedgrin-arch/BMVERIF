const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "productId" TEXT`);
  console.log('Done: productId column added to OrderItem');
  await prisma.$disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
