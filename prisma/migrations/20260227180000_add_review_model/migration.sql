CREATE TABLE IF NOT EXISTS "Review" (
  "id"        TEXT NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "rating"    INTEGER NOT NULL,
  "comment"   TEXT,
  "userName"  TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId"    TEXT,
  CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
