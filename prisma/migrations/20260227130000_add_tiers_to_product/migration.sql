-- AlterTable: add tiers JSONB column to Product (empty array default)
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "tiers" JSONB NOT NULL DEFAULT '[]';
