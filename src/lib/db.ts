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
  `);
}
