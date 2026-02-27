-- AlterTable: add cost column to Product (default 0 for existing rows)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DOUBLE PRECISION NOT NULL DEFAULT 0;
