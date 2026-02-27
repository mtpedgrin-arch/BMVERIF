CREATE TABLE IF NOT EXISTS "Settings" (
  "key"   TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "Settings_pkey" PRIMARY KEY ("key")
);

-- Seed default wallet addresses (won't overwrite if already set)
INSERT INTO "Settings" ("key", "value") VALUES
  ('wallet_trc20', 'TN3W4T6ATGBY9yGGxSUxxsLSzKWp1Aqbnk'),
  ('wallet_bep20', '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')
ON CONFLICT DO NOTHING;
