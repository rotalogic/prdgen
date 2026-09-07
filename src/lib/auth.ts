import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

// Server-only Better Auth instance. Never import this from client code —
// it holds a Postgres pool and secrets. The React app talks to it over
// HTTP via `src/lib/auth-client.ts`.

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret);

const databaseUrl = process.env.DATABASE_URL || '';
const isLocalDatabase = /localhost|127\.0\.0\.1/.test(databaseUrl);

export const auth = betterAuth({
  database: new Pool({
    connectionString: databaseUrl,
    // Hosted Postgres (Supabase, Neon, etc.) requires TLS; local dev doesn't.
    ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  socialProviders: isGoogleAuthConfigured
    ? {
        google: {
          clientId: googleClientId as string,
          clientSecret: googleClientSecret as string,
        },
      }
    : undefined,
});
