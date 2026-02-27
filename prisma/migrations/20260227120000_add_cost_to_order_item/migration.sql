-- AlterTable: add cost column to OrderItem (default 0 for existing rows)
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;
