import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/authOptions";
import { prisma } from "../../../../lib/prisma";

// POST /api/admin/run-migration — apply schema migrations (admin only)
export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetToken" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "resetTokenExpiry" TIMESTAMP(3)`);

    // BlogPost table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BlogPost" (
        "id"          TEXT         NOT NULL,
        "title"       TEXT         NOT NULL,
        "slug"        TEXT         NOT NULL,
        "excerpt"     TEXT,
        "content"     TEXT         NOT NULL DEFAULT '',
        "published"   BOOLEAN      NOT NULL DEFAULT false,
        "publishedAt" TIMESTAMP(3),
        "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BlogPost_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(
      `CREATE UNIQUE INDEX IF NOT EXISTS "BlogPost_slug_key" ON "BlogPost"("slug")`
    );
    await prisma.$executeRawUnsafe(`ALTER TABLE "BlogPost" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT`);

    // ChatMessage: isBot column
    await prisma.$executeRawUnsafe(`ALTER TABLE "ChatMessage" ADD COLUMN IF NOT EXISTS "isBot" BOOLEAN NOT NULL DEFAULT false`);

    // BotKnowledge table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BotKnowledge" (
        "id"        TEXT         NOT NULL,
        "topic"     TEXT         NOT NULL,
        "content"   TEXT         NOT NULL,
        "active"    BOOLEAN      NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "BotKnowledge_pkey" PRIMARY KEY ("id")
      )
    `);

    // Order: fbp y fbc para Meta CAPI matching
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fbp" TEXT`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "fbc" TEXT`);

    // Wallet: walletBalance en User + tabla WalletTopup
    await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "walletBalance" DOUBLE PRECISION NOT NULL DEFAULT 0`);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "WalletTopup" (
        "id"           TEXT             NOT NULL,
        "userEmail"    TEXT             NOT NULL,
        "userName"     TEXT             NOT NULL,
        "amount"       DOUBLE PRECISION NOT NULL,
        "uniqueAmount" DOUBLE PRECISION,
        "status"       TEXT             NOT NULL DEFAULT 'pending',
        "txHash"       TEXT,
        "expiresAt"    TIMESTAMP(3),
        "createdAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt"    TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "WalletTopup_pkey" PRIMARY KEY ("id")
      )
    `);

    return NextResponse.json({ ok: true, message: "Migrations applied successfully" });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
