-- CreateTable
CREATE TABLE IF NOT EXISTS "SavedCart" (
    "id" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCart_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "SavedCart_userEmail_key" ON "SavedCart"("userEmail");
