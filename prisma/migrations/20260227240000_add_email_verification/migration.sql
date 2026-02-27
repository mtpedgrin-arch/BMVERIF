-- Default TRUE so existing users are treated as already verified
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifyTokenExpiry" TIMESTAMP(3);
