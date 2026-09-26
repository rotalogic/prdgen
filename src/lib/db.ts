import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// Server-only. Shared Postgres pool for both Better Auth (see lib/auth.ts)
// and our own app tables below — same database, one pool.
const databaseUrl = process.env.DATABASE_URL || '';
const isLocalDatabase = /localhost|127\.0\.0\.1/.test(databaseUrl);

// Full certificate verification (Postgres "verify-full" equivalent) against
// Supabase's CA — not just opportunistic TLS. rejectUnauthorized:false would
// accept any certificate, including an attacker's, silently.
const supabaseCaPath = path.join(process.cwd(), 'certs', 'supabase-ca.crt');
const supabaseCa = isLocalDatabase ? undefined : fs.readFileSync(supabaseCaPath, 'utf8');

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: true, ca: supabaseCa },
});

// Idempotent — safe to call on every server start. Better Auth owns
// user/session/account/verification; these two are ours.
export async function ensureAppTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS prd_generations (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS prd_documents (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      product_type TEXT NOT NULL,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_prd_documents_user_id ON prd_documents(user_id);

    -- One row per user once they're on a paid plan; absence of a row means
    -- 'free'. Written by the Pakasir webhook once a payment_transactions row
    -- is marked paid (or manually, for support-granted upgrades).
    CREATE TABLE IF NOT EXISTS user_plans (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      plan TEXT NOT NULL DEFAULT 'free',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Legacy purchase-intent log from before Pakasir checkout existed. No
    -- longer written to, kept only for historical rows.
    CREATE TABLE IF NOT EXISTS upgrade_interest (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      promo_code TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    ALTER TABLE upgrade_interest ADD COLUMN IF NOT EXISTS promo_code TEXT;

    -- One row per Pakasir checkout attempt. Created 'pending' when a payment
    -- link is generated, flipped to 'paid' by the webhook once Pakasir
    -- confirms payment — that's what actually upgrades user_plans.
    CREATE TABLE IF NOT EXISTS payment_transactions (
      id SERIAL PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      plan TEXT NOT NULL,
      billing_cycle TEXT NOT NULL,
      amount INTEGER NOT NULL,
      promo_code TEXT,
      pakasir_order_id TEXT,
      pakasir_txn_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      paid_at TIMESTAMPTZ
    );
    ALTER TABLE payment_transactions DROP COLUMN IF EXISTS mayar_link_id;
    ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS pakasir_order_id TEXT;
    ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS pakasir_txn_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON payment_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_transactions_pakasir_order_id ON payment_transactions(pakasir_order_id);
    DROP INDEX IF EXISTS idx_payment_transactions_mayar_link_id;

    -- Real discount codes, checked and applied server-side at checkout
    -- (server.ts /api/checkout/pakasir) — unlike payment_transactions.promo_code,
    -- which is just a record of what the customer typed.
    CREATE TABLE IF NOT EXISTS promo_codes (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      discount_type TEXT NOT NULL,
      discount_value INTEGER NOT NULL,
      applies_to_plan TEXT,
      max_redemptions INTEGER,
      redeemed_count INTEGER NOT NULL DEFAULT 0,
      active BOOLEAN NOT NULL DEFAULT true,
      expires_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}
