import { betterAuth } from 'better-auth';
import { pool } from './db';

// Server-only Better Auth instance. Never import this from client code —
// it holds a Postgres pool and secrets. The React app talks to it over
// HTTP via `src/lib/auth-client.ts`.

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

export const isGoogleAuthConfigured = Boolean(googleClientId && googleClientSecret);

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || process.env.APP_URL,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
      // We don't implement an email-verification flow, so every
      // password-signup account has emailVerified:false. Better Auth's
      // default (true) would then refuse to link a Google sign-in to an
      // existing email/password account of the same address — the user
      // would land back on the homepage with no session and no visible
      // error, since the failure happens mid-redirect, not in a request
      // our own error handling ever sees.
      requireLocalEmailVerified: false,
    },
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
