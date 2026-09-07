import { Pool } from 'pg';

// Server-only. Shared Postgres pool for both Better Auth (see lib/auth.ts)
// and our own app tables below — same database, one pool.
const databaseUrl = process.env.DATABASE_URL || '';
const isLocalDatabase = /localhost|127\.0\.0\.1/.test(databaseUrl);

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
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
  `);
}
