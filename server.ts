// Must run before any local import — ES module imports evaluate in listed
// order, and src/lib/auth.ts reads process.env.DATABASE_URL at import time
// to build its Postgres pool. Importing it before env vars are loaded meant
// it silently fell back to pg's localhost default.
import "dotenv/config";

// ── Fix VPS (undici/global fetch ETIMEDOUT — IPv6) → node:https family 4 ──
// Google OAuth token exchange & panggilan Gemini/Claude/OpenAI gagal tanpa ini.
import { request as httpsRequest } from "node:https";
import { request as httpRequest } from "node:http";
import crypto from "node:crypto";

function fetchViaNode(url: any, init: any = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(String(url));
    const isHttps = u.protocol === "https:";
    const mod = isHttps ? httpsRequest : httpRequest;
    let headers: Record<string, string> = {};
    if (init.headers instanceof Headers) headers = Object.fromEntries(init.headers.entries());
    else if (init.headers) headers = { ...init.headers };
    const body = init.body != null ? Buffer.from(String(init.body)) : null;
    if (body && !headers["content-length"]) headers["content-length"] = String(body.length);
    const req = mod(
      {
        hostname: u.hostname,
        port: u.port || (isHttps ? 443 : 80),
        path: u.pathname + u.search,
        method: init.method || (body ? "POST" : "GET"),
        headers,
        family: 4,
        timeout: 30000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString();
          resolve({
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            status: res.statusCode,
            statusText: res.statusMessage || "",
            headers: new Headers(res.headers as any),
            url: String(url),
            async json() { return JSON.parse(text); },
            async text() { return text; },
          });
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}
// ponytail: aktif hanya di VPS ini (undici ETIMEDOUT IPv6); dev lokal tak terpengaruh
if (process.env.FORCE_IPV4_FETCH === "1") globalThis.fetch = fetchViaNode as any;

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth, isGoogleAuthConfigured } from "./src/lib/auth";
import { pool, ensureAppTables } from "./src/lib/db";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Better Auth handles its own body parsing — must be mounted before
// express.json() or it will hang trying to read an already-consumed stream.
// Wrapped so a DB outage rejects this one request instead of crashing the
// whole process (Express 4 doesn't catch async handler rejections itself).
const authHandler = toNodeHandler(auth);
app.all("/api/auth/*", async (req, res) => {
  try {
    await authHandler(req, res);
  } catch (err) {
    console.error("[better-auth] request failed:", err);
    if (!res.headersSent) {
      res.status(503).json({ error: "Auth service unavailable" });
    }
  }
});

// Default 100kb is too small for a saved PRD payload — a fully generated
// document (54-chapter markdown + SQL + ERD + task list) for a product
// with many entities easily exceeds it, so /api/prds would silently fail
// to save with a 413 for anyone whose product has a non-trivial data model.
app.use(express.json({ limit: '5mb' }));

// Tells the client whether Google sign-in has real credentials configured,
// so the UI can disable the button instead of letting it fail at click time.
app.get("/api/auth-status", (req, res) => {
  res.json({ googleEnabled: isGoogleAuthConfigured });
});

// API health endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Public homepage stats — real counts, no decorative/fake numbers.
app.get("/api/stats", async (req, res) => {
  try {
    const [usersResult, generatorsResult, reviewsResult] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM "user"`),
      pool.query(`SELECT COUNT(DISTINCT user_id)::int AS count FROM prd_generations`),
      pool.query(`SELECT COUNT(*)::int AS count, COALESCE(AVG(rating), 0)::float AS average FROM reviews`),
    ]);
    res.json({
      totalUsers: usersResult.rows[0].count,
      totalGenerated: generatorsResult.rows[0].count,
      reviewCount: reviewsResult.rows[0].count,
      averageRating: Math.round(reviewsResult.rows[0].average * 10) / 10,
    });
  } catch (error) {
    console.error("[stats] Failed to load stats:", error);
    res.status(503).json({ error: "Statistik sedang tidak tersedia." });
  }
});

// Records that the current logged-in user generated + downloaded a PRD.
app.post("/api/prd-generations", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk mencatat generate PRD." });
    }
    await pool.query(`INSERT INTO prd_generations (user_id) VALUES ($1)`, [session.user.id]);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("[prd-generations] Failed to record generation:", error);
    res.status(503).json({ error: "Gagal mencatat generate PRD." });
  }
});

// Submits a 1-5 star rating from the current logged-in user.
app.post("/api/reviews", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk mengirim ulasan." });
    }
    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating harus berupa bilangan 1-5." });
    }
    await pool.query(`INSERT INTO reviews (user_id, rating) VALUES ($1, $2)`, [session.user.id, rating]);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("[reviews] Failed to record review:", error);
    res.status(503).json({ error: "Gagal mengirim ulasan." });
  }
});

// Free plan gets exactly one lifetime PRD before the paywall kicks in; any
// row in user_plans (however it got there) is treated as unlimited, since
// there's no billing-cycle tracking yet to enforce Starter's monthly cap.
const FREE_PLAN_LIFETIME_LIMIT = 1;

async function getBillingStatus(userId: string) {
  const [planResult, countResult] = await Promise.all([
    pool.query(`SELECT plan FROM user_plans WHERE user_id = $1`, [userId]),
    pool.query(`SELECT COUNT(*)::int AS count FROM prd_documents WHERE user_id = $1`, [userId]),
  ]);
  const plan = planResult.rows[0]?.plan || 'free';
  const prdCount = countResult.rows[0].count;
  const freeLimitReached = plan === 'free' && prdCount >= FREE_PLAN_LIFETIME_LIMIT;
  return { plan, prdCount, freeLimit: FREE_PLAN_LIFETIME_LIMIT, freeLimitReached };
}

// Current plan + usage, so the client can gate "Buat Dokumen PRD" and show
// the right badge/limit messaging without guessing.
app.get("/api/billing/status", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk melihat status paket." });
    }
    res.json(await getBillingStatus(session.user.id));
  } catch (error) {
    console.error("[billing] Failed to load status:", error);
    res.status(503).json({ error: "Gagal memuat status paket." });
  }
});

// Real purchase-intent signal from the pricing page — there's no live
// checkout yet, so a plan button records this instead of pretending to charge.
app.post("/api/upgrade-interest", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk memilih paket." });
    }
    const { plan, billingCycle, promoCode } = req.body || {};
    const allowedPlans = ['starter', 'pro', 'pro_tahunan'];
    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({ error: "Paket tidak dikenali." });
    }
    const cleanPromoCode = typeof promoCode === 'string' && promoCode.trim()
      ? promoCode.trim().slice(0, 40)
      : null;
    await pool.query(
      `INSERT INTO upgrade_interest (user_id, plan, billing_cycle, promo_code) VALUES ($1, $2, $3, $4)`,
      [session.user.id, plan, String(billingCycle || '1_bulan').slice(0, 20), cleanPromoCode]
    );
    res.status(201).json({ success: true });
  } catch (error) {
    console.error("[upgrade-interest] Failed to record interest:", error);
    res.status(503).json({ error: "Gagal mencatat minat upgrade." });
  }
});

// Server-side source of truth for what each plan actually costs — the
// client sends only the plan id, never the amount, so a tampered request
// can't buy Pro for the price of Starter.
const PLAN_PRICES_MONTHLY: Record<string, number> = {
  starter: 50000,
  pro_tahunan: 99000,
  pro: 149000,
};
const PLAN_LABELS: Record<string, string> = {
  starter: "Starter",
  pro_tahunan: "Pro Tahunan",
  pro: "Pro",
};

// Who gets access to /api/admin/* — backed by the admin_users table (see
// src/lib/db.ts), not an env var, so it's editable from the Admin & Akses
// module without a server restart.
async function isAdminEmail(email: string | undefined | null): Promise<boolean> {
  if (!email) return false;
  const result = await pool.query(`SELECT 1 FROM admin_users WHERE LOWER(email) = LOWER($1)`, [email]);
  return result.rows.length > 0;
}

// Looks up a promo code and returns the discounted amount, or an error
// message if the code doesn't apply. Never trusts the client's own math.
async function applyPromoCode(code: string, plan: string, amount: number): Promise<{ amount: number } | { error: string }> {
  const result = await pool.query(
    `SELECT discount_type, discount_value, applies_to_plan, max_redemptions, redeemed_count
     FROM promo_codes
     WHERE UPPER(code) = UPPER($1) AND active = true
       AND (expires_at IS NULL OR expires_at > now())`,
    [code]
  );
  const promo = result.rows[0];
  if (!promo) {
    return { error: "Kode promo tidak valid atau sudah kadaluwarsa." };
  }
  if (promo.applies_to_plan && promo.applies_to_plan !== plan) {
    return { error: "Kode promo tidak berlaku untuk paket ini." };
  }
  if (promo.max_redemptions != null && promo.redeemed_count >= promo.max_redemptions) {
    return { error: "Kode promo sudah mencapai batas penggunaan." };
  }
  const discounted = promo.discount_type === "percent"
    ? amount - Math.round((amount * promo.discount_value) / 100)
    : amount - promo.discount_value;
  return { amount: Math.max(0, discounted) };
}

// Creates a Pakasir payment link scoped to this one checkout attempt and
// records it as 'pending' — the webhook below is what actually flips it to
// 'paid' and upgrades the user's plan.
app.post("/api/checkout/pakasir", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk checkout." });
    }
    if (!process.env.PAKASIR_API_KEY || !process.env.PAKASIR_SLUG) {
      return res.status(503).json({ error: "Pembayaran belum dikonfigurasi. Coba lagi nanti." });
    }
    const { plan, billingCycle, promoCode } = req.body || {};
    if (!Object.prototype.hasOwnProperty.call(PLAN_PRICES_MONTHLY, plan)) {
      return res.status(400).json({ error: "Paket tidak dikenali." });
    }
    const cycle = billingCycle === "3_bulan" ? "3_bulan" : "1_bulan";
    let amount = PLAN_PRICES_MONTHLY[plan] * (cycle === "3_bulan" ? 3 : 1);
    const cleanPromoCode = typeof promoCode === "string" && promoCode.trim()
      ? promoCode.trim().slice(0, 40)
      : null;

    if (cleanPromoCode) {
      const promoResult = await applyPromoCode(cleanPromoCode, plan, amount);
      if ("error" in promoResult) {
        return res.status(400).json({ error: promoResult.error });
      }
      amount = promoResult.amount;
    }

    const pakasirBase = process.env.PAKASIR_API_BASE || "https://app.pakasir.com/api/v2";
    const slug = process.env.PAKASIR_SLUG;
    const appUrl = process.env.APP_URL || `http://localhost:${PORT}`;

    const insertResult = await pool.query(
      `INSERT INTO payment_transactions (user_id, plan, billing_cycle, amount, promo_code, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING id`,
      [session.user.id, plan, cycle, amount, cleanPromoCode]
    );
    const txnId = insertResult.rows[0].id;
    const orderId = `txn-${txnId}`;

    const pakasirRes = await fetch(`${pakasirBase}/create-transaction/${slug}/${orderId}`, {
      method: "POST",
      headers: {
        "X-Api-Key": process.env.PAKASIR_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ method: "payment_link", amount }),
    });
    if (!pakasirRes.ok) {
      const errBody = await pakasirRes.json().catch(() => ({}));
      console.error("[checkout] Pakasir create-transaction failed:", pakasirRes.status, errBody);
      return res.status(503).json({ error: "Gagal membuat link pembayaran. Coba lagi." });
    }
    const pakasirData = await pakasirRes.json();
    const paymentLink = pakasirData?.payment_link;
    const pakasirTxnId = pakasirData?.txn_id;
    if (!paymentLink || !pakasirTxnId) {
      console.error("[checkout] Unexpected Pakasir response shape:", pakasirData);
      return res.status(503).json({ error: "Gagal membuat link pembayaran. Coba lagi." });
    }

    await pool.query(
      `UPDATE payment_transactions SET pakasir_order_id = $1, pakasir_txn_id = $2 WHERE id = $3`,
      [orderId, pakasirTxnId, txnId]
    );
    const returnUrl = `${appUrl}/?checkout=${txnId}`;
    const link = `${paymentLink}?redirect=${encodeURIComponent(returnUrl)}`;
    res.status(201).json({ link, txnId });
  } catch (error) {
    console.error("[checkout] Failed to create Pakasir checkout:", error);
    res.status(503).json({ error: "Gagal memulai pembayaran." });
  }
});

// Pakasir doesn't sign webhooks cryptographically — it sends a shared secret
// (from the project dashboard, not one we invent) in the X-Secret header.
// Not session-gated like every other route in this file.
app.post("/api/webhooks/pakasir", async (req, res) => {
  try {
    const expectedSecret = process.env.PAKASIR_WEBHOOK_SECRET || "";
    const providedSecret = String(req.header("X-Secret") || "");
    const expectedBuf = Buffer.from(expectedSecret);
    const providedBuf = Buffer.from(providedSecret);
    const secretValid =
      expectedSecret.length > 0 &&
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf);
    if (!secretValid) {
      console.warn("[pakasir-webhook] Rejected request with invalid X-Secret");
      return res.status(401).json({ error: "Invalid secret" });
    }

    console.log("[pakasir-webhook] Payload:", JSON.stringify(req.body));
    const { order_id, amount, status } = req.body || {};
    if (!order_id) {
      return res.status(200).json({ received: true, note: "no order_id in payload" });
    }

    const txnResult = await pool.query(
      `SELECT id, user_id, plan, amount, status, pakasir_txn_id, promo_code FROM payment_transactions WHERE pakasir_order_id = $1`,
      [order_id]
    );
    const txn = txnResult.rows[0];
    if (!txn) {
      console.warn("[pakasir-webhook] No matching transaction for order_id:", order_id);
      return res.status(200).json({ received: true, note: "no matching transaction" });
    }
    if (txn.status === "paid") {
      return res.status(200).json({ received: true, note: "already processed" });
    }
    // Pakasir's own docs recommend treating the webhook as an untrusted
    // notification and cross-checking amount + confirming via their
    // authenticated status endpoint before trusting it.
    if (Number(amount) !== txn.amount) {
      console.warn("[pakasir-webhook] Amount mismatch for order_id:", order_id, amount, txn.amount);
      return res.status(200).json({ received: true, note: "amount mismatch" });
    }
    if (String(status || "").toLowerCase() !== "completed") {
      return res.status(200).json({ received: true, note: `status '${status}' not treated as paid` });
    }

    const pakasirBase = process.env.PAKASIR_API_BASE || "https://app.pakasir.com/api/v2";
    const slug = process.env.PAKASIR_SLUG;
    const confirmRes = await fetch(`${pakasirBase}/transaction-status/${slug}/${txn.pakasir_txn_id}`, {
      headers: { "X-Api-Key": process.env.PAKASIR_API_KEY || "" },
    }).catch(() => null);
    const confirmData = confirmRes && confirmRes.ok ? await confirmRes.json().catch(() => null) : null;
    if (!confirmData || confirmData.status !== "completed") {
      console.warn("[pakasir-webhook] Status endpoint did not confirm payment for order_id:", order_id, confirmData);
      return res.status(200).json({ received: true, note: "not confirmed by status endpoint" });
    }

    await pool.query(
      `UPDATE payment_transactions SET status = 'paid', paid_at = now() WHERE id = $1`,
      [txn.id]
    );
    await pool.query(
      `INSERT INTO user_plans (user_id, plan, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (user_id) DO UPDATE SET plan = excluded.plan, updated_at = now()`,
      [txn.user_id, txn.plan]
    );
    if (txn.promo_code) {
      await pool.query(
        `UPDATE promo_codes SET redeemed_count = redeemed_count + 1 WHERE UPPER(code) = UPPER($1)`,
        [txn.promo_code]
      );
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[pakasir-webhook] Failed to process webhook:", error);
    res.status(500).json({ error: "Failed to process webhook" });
  }
});

// Frontend polls this right after the Pakasir redirect back, since the
// webhook above can land a few seconds after the browser returns.
app.get("/api/checkout/pakasir/status/:id", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk." });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const result = await pool.query(
      `SELECT status FROM payment_transactions WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Transaksi tidak ditemukan." });
    }
    res.json({ status: result.rows[0].status });
  } catch (error) {
    console.error("[checkout] Failed to load transaction status:", error);
    res.status(503).json({ error: "Gagal memuat status transaksi." });
  }
});

// Lets the client know whether to show the Admin nav link, without ever
// exposing the admin_users list itself.
app.get("/api/admin/check", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    res.json({ isAdmin: !!session && (await isAdminEmail(session.user.email)) });
  } catch (error) {
    console.error("[admin] Failed check:", error);
    res.json({ isAdmin: false });
  }
});

async function requireAdmin(req: any, res: any): Promise<{ userId: string; email: string } | null> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
  if (!session || !(await isAdminEmail(session.user.email))) {
    res.status(403).json({ error: "Akses ditolak." });
    return null;
  }
  return { userId: session.user.id, email: session.user.email };
}

// Records an admin-panel mutation for accountability. Best-effort — a
// logging failure should never block the action itself.
async function logAdminAction(actorEmail: string, action: string, resource: string) {
  try {
    await pool.query(
      `INSERT INTO audit_log (actor_email, action, resource) VALUES ($1, $2, $3)`,
      [actorEmail, action, resource]
    );
  } catch (error) {
    console.error("[admin] Failed to write audit log:", error);
  }
}

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows: Record<string, unknown>[], columns: string[]): string {
  const header = columns.join(",");
  const body = rows.map((row) => columns.map((c) => csvEscape(row[c])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}

// Business stats for the owner: signups, plan breakdown, revenue, and the
// leads/payments to follow up on manually.
app.get("/api/admin/stats", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;

    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const [
      totalUsersResult,
      planBreakdownResult,
      totalPrdResult,
      revenueResult,
      revenueByDayResult,
      recentInterestResult,
      recentPaymentsResult,
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM "user"`),
      pool.query(`SELECT plan, COUNT(*)::int AS count FROM user_plans GROUP BY plan`),
      pool.query(`SELECT COUNT(*)::int AS count FROM prd_documents`),
      pool.query(`SELECT COALESCE(SUM(amount), 0)::int AS total FROM payment_transactions WHERE status = 'paid'`),
      pool.query(
        `SELECT to_char(date_trunc('day', paid_at), 'YYYY-MM-DD') AS day, SUM(amount)::int AS total
         FROM payment_transactions
         WHERE status = 'paid' AND paid_at > now() - ($1 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [days]
      ),
      pool.query(
        `SELECT ui.plan, ui.billing_cycle, ui.promo_code, ui.created_at, u.email
         FROM upgrade_interest ui JOIN "user" u ON u.id = ui.user_id
         ORDER BY ui.created_at DESC LIMIT 50`
      ),
      pool.query(
        `SELECT pt.plan, pt.billing_cycle, pt.amount, pt.status, pt.promo_code, pt.created_at, pt.paid_at, u.email
         FROM payment_transactions pt JOIN "user" u ON u.id = pt.user_id
         ORDER BY pt.created_at DESC LIMIT 50`
      ),
    ]);

    const paidUsers = planBreakdownResult.rows.reduce((sum, r) => sum + r.count, 0);
    const planBreakdown = planBreakdownResult.rows.reduce(
      (acc, r) => ({ ...acc, [r.plan]: r.count }),
      {} as Record<string, number>
    );
    planBreakdown.free = totalUsersResult.rows[0].count - paidUsers;

    res.json({
      totalUsers: totalUsersResult.rows[0].count,
      planBreakdown,
      totalPrd: totalPrdResult.rows[0].count,
      totalRevenue: revenueResult.rows[0].total,
      revenueByDay: revenueByDayResult.rows,
      recentInterest: recentInterestResult.rows,
      recentPayments: recentPaymentsResult.rows,
    });
  } catch (error) {
    console.error("[admin] Failed to load stats:", error);
    res.status(503).json({ error: "Gagal memuat statistik." });
  }
});

// Real user list (email, plan, join date) — backs the Users/Subscriptions
// modules. Subscriptions is just this filtered client-side (plan != free).
app.get("/api/admin/users", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(
      `SELECT u.id, u.email, u."createdAt" AS created_at, COALESCE(up.plan, 'free') AS plan
       FROM "user" u LEFT JOIN user_plans up ON up.user_id = u.id
       ORDER BY u."createdAt" DESC LIMIT 200`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error("[admin] Failed to list users:", error);
    res.status(503).json({ error: "Gagal memuat daftar user." });
  }
});

app.get("/api/admin/admins", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM admin_users ORDER BY created_at ASC`);
    res.json({ admins: result.rows });
  } catch (error) {
    console.error("[admin] Failed to list admins:", error);
    res.status(503).json({ error: "Gagal memuat daftar admin." });
  }
});

app.post("/api/admin/admins", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { email, password } = req.body || {};
    const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: "Email tidak valid." });
    }

    const existingUser = await pool.query(`SELECT id FROM "user" WHERE LOWER(email) = LOWER($1)`, [cleanEmail]);
    let accountCreated = false;
    if (!existingUser.rows[0]) {
      if (!password || String(password).length < 6) {
        return res.status(400).json({ error: "Akun untuk email ini belum ada — isi password (minimal 6 karakter) untuk membuat akunnya sekaligus." });
      }
      try {
        await auth.api.signUpEmail({ body: { name: cleanEmail.split("@")[0], email: cleanEmail, password: String(password) } });
        accountCreated = true;
      } catch (signUpError: any) {
        console.error("[admin] Failed to create account for new admin:", signUpError);
        return res.status(503).json({ error: "Gagal membuat akun baru untuk email ini." });
      }
    }

    const result = await pool.query(
      `INSERT INTO admin_users (email, added_by) VALUES ($1, $2) RETURNING *`,
      [cleanEmail, admin.email]
    );
    await logAdminAction(admin.email, accountCreated ? "ADD_ADMIN_NEW_ACCOUNT" : "ADD_ADMIN", cleanEmail);
    res.status(201).json({ admin: result.rows[0], accountCreated });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Email ini sudah jadi admin." });
    }
    console.error("[admin] Failed to add admin:", error);
    res.status(503).json({ error: "Gagal menambahkan admin." });
  }
});

app.delete("/api/admin/admins/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const target = await pool.query(`SELECT email FROM admin_users WHERE id = $1`, [id]);
    if (!target.rows[0]) {
      return res.status(404).json({ error: "Admin tidak ditemukan." });
    }
    if (target.rows[0].email.toLowerCase() === admin.email.toLowerCase()) {
      return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri. Minta admin lain untuk menghapusnya." });
    }
    const countResult = await pool.query(`SELECT COUNT(*)::int AS count FROM admin_users`);
    if (countResult.rows[0].count <= 1) {
      return res.status(400).json({ error: "Tidak bisa menghapus admin terakhir." });
    }
    await pool.query(`DELETE FROM admin_users WHERE id = $1`, [id]);
    await logAdminAction(admin.email, "REMOVE_ADMIN", target.rows[0].email);
    res.status(204).end();
  } catch (error) {
    console.error("[admin] Failed to remove admin:", error);
    res.status(503).json({ error: "Gagal menghapus admin." });
  }
});

app.get("/api/admin/promo-codes", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM promo_codes ORDER BY created_at DESC`);
    res.json({ promoCodes: result.rows });
  } catch (error) {
    console.error("[admin] Failed to list promo codes:", error);
    res.status(503).json({ error: "Gagal memuat kode promo." });
  }
});

app.post("/api/admin/promo-codes", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { code, discountType, discountValue, appliesToPlan, maxRedemptions, expiresAt } = req.body || {};
    const cleanCode = typeof code === "string" ? code.trim().toUpperCase().slice(0, 40) : "";
    if (!cleanCode) {
      return res.status(400).json({ error: "Kode wajib diisi." });
    }
    if (discountType !== "percent" && discountType !== "fixed") {
      return res.status(400).json({ error: "Tipe diskon tidak dikenali." });
    }
    const value = Number(discountValue);
    if (!Number.isInteger(value) || value <= 0 || (discountType === "percent" && value > 100)) {
      return res.status(400).json({ error: "Nilai diskon tidak valid." });
    }
    if (appliesToPlan && !Object.prototype.hasOwnProperty.call(PLAN_PRICES_MONTHLY, appliesToPlan)) {
      return res.status(400).json({ error: "Paket tidak dikenali." });
    }
    const result = await pool.query(
      `INSERT INTO promo_codes (code, discount_type, discount_value, applies_to_plan, max_redemptions, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        cleanCode,
        discountType,
        value,
        appliesToPlan || null,
        maxRedemptions ? Number(maxRedemptions) : null,
        expiresAt || null,
      ]
    );
    await logAdminAction(admin.email, "CREATE_PROMO", cleanCode);
    res.status(201).json({ promoCode: result.rows[0] });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ error: "Kode promo ini sudah ada." });
    }
    console.error("[admin] Failed to create promo code:", error);
    res.status(503).json({ error: "Gagal membuat kode promo." });
  }
});

app.patch("/api/admin/promo-codes/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const { active } = req.body || {};
    const result = await pool.query(
      `UPDATE promo_codes SET active = $1 WHERE id = $2 RETURNING *`,
      [!!active, id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Kode promo tidak ditemukan." });
    }
    await logAdminAction(admin.email, active ? "ACTIVATE_PROMO" : "DEACTIVATE_PROMO", result.rows[0].code);
    res.json({ promoCode: result.rows[0] });
  } catch (error) {
    console.error("[admin] Failed to update promo code:", error);
    res.status(503).json({ error: "Gagal memperbarui kode promo." });
  }
});

app.delete("/api/admin/promo-codes/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const existing = await pool.query(`SELECT code FROM promo_codes WHERE id = $1`, [id]);
    await pool.query(`DELETE FROM promo_codes WHERE id = $1`, [id]);
    if (existing.rows[0]) {
      await logAdminAction(admin.email, "DELETE_PROMO", existing.rows[0].code);
    }
    res.status(204).end();
  } catch (error) {
    console.error("[admin] Failed to delete promo code:", error);
    res.status(503).json({ error: "Gagal menghapus kode promo." });
  }
});

// Daily PRD generations and signups — same date_trunc pattern as
// revenueByDay in /api/admin/stats.
app.get("/api/admin/analytics", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    const [prdByDayResult, signupsByDayResult] = await Promise.all([
      pool.query(
        `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM prd_documents WHERE created_at > now() - ($1 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [days]
      ),
      pool.query(
        `SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
         FROM "user" WHERE "createdAt" > now() - ($1 || ' days')::interval
         GROUP BY 1 ORDER BY 1`,
        [days]
      ),
    ]);
    res.json({ prdByDay: prdByDayResult.rows, signupsByDay: signupsByDayResult.rows });
  } catch (error) {
    console.error("[admin] Failed to load analytics:", error);
    res.status(503).json({ error: "Gagal memuat analitik." });
  }
});

// CSV report exports — direct download, no intermediate JSON.
app.get("/api/admin/reports/revenue.csv", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(
      `SELECT u.email, pt.plan, pt.billing_cycle, pt.amount, pt.status, pt.promo_code, pt.created_at, pt.paid_at
       FROM payment_transactions pt JOIN "user" u ON u.id = pt.user_id ORDER BY pt.created_at DESC`
    );
    const csv = toCsv(result.rows, ["email", "plan", "billing_cycle", "amount", "status", "promo_code", "created_at", "paid_at"]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=revenue-report.csv");
    res.send(csv);
  } catch (error) {
    console.error("[admin] Failed to export revenue report:", error);
    res.status(503).json({ error: "Gagal membuat laporan." });
  }
});

app.get("/api/admin/reports/users.csv", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(
      `SELECT u.email, COALESCE(up.plan, 'free') AS plan, u."createdAt" AS created_at
       FROM "user" u LEFT JOIN user_plans up ON up.user_id = u.id ORDER BY u."createdAt" DESC`
    );
    const csv = toCsv(result.rows, ["email", "plan", "created_at"]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=user-growth-report.csv");
    res.send(csv);
  } catch (error) {
    console.error("[admin] Failed to export user report:", error);
    res.status(503).json({ error: "Gagal membuat laporan." });
  }
});

app.get("/api/admin/reports/prd-usage.csv", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(
      `SELECT u.email, COUNT(pd.id)::int AS prd_count
       FROM "user" u JOIN prd_documents pd ON pd.user_id = u.id
       GROUP BY u.email ORDER BY prd_count DESC`
    );
    const csv = toCsv(result.rows, ["email", "prd_count"]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=prd-usage-report.csv");
    res.send(csv);
  } catch (error) {
    console.error("[admin] Failed to export PRD usage report:", error);
    res.status(503).json({ error: "Gagal membuat laporan." });
  }
});

app.get("/api/admin/reports/promo-performance.csv", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM promo_codes ORDER BY redeemed_count DESC`);
    const csv = toCsv(result.rows, ["code", "discount_type", "discount_value", "applies_to_plan", "redeemed_count", "max_redemptions", "active", "created_at"]);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", "attachment; filename=promo-performance-report.csv");
    res.send(csv);
  } catch (error) {
    console.error("[admin] Failed to export promo report:", error);
    res.status(503).json({ error: "Gagal membuat laporan." });
  }
});

app.get("/api/admin/audit-logs", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100`);
    res.json({ logs: result.rows });
  } catch (error) {
    console.error("[admin] Failed to load audit logs:", error);
    res.status(503).json({ error: "Gagal memuat audit log." });
  }
});

app.get("/api/admin/settings", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM app_settings WHERE id = 1`);
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error("[admin] Failed to load settings:", error);
    res.status(503).json({ error: "Gagal memuat pengaturan." });
  }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { platformName, supportEmail } = req.body || {};
    if (!platformName || !supportEmail) {
      return res.status(400).json({ error: "Nama platform dan email support wajib diisi." });
    }
    const result = await pool.query(
      `UPDATE app_settings SET platform_name = $1, support_email = $2, updated_at = now() WHERE id = 1 RETURNING *`,
      [String(platformName).slice(0, 200), String(supportEmail).slice(0, 200)]
    );
    await logAdminAction(admin.email, "UPDATE_SETTINGS", "app_settings");
    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error("[admin] Failed to update settings:", error);
    res.status(503).json({ error: "Gagal menyimpan pengaturan." });
  }
});

// Lightweight, honest health checks — no live Pakasir call here (that's
// what Finance's on-demand reconcile is for), just what's cheap to know.
app.get("/api/admin/integrations", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const start = Date.now();
    await pool.query(`SELECT 1`);
    const dbLatencyMs = Date.now() - start;

    res.json({
      integrations: [
        { name: "Database", status: "online", detail: `${dbLatencyMs}ms` },
        {
          name: "Pakasir",
          status: process.env.PAKASIR_API_KEY && process.env.PAKASIR_SLUG ? "configured" : "not_configured",
          detail: process.env.PAKASIR_SLUG || "-",
        },
        { name: "Better Auth", status: "online", detail: "-" },
      ],
    });
  } catch (error) {
    console.error("[admin] Failed to check integrations:", error);
    res.status(503).json({ error: "Gagal memeriksa status integrasi." });
  }
});

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// On-demand reconciliation against Pakasir's own transaction-status API.
// Deliberately sequential with a ~4s gap per Pakasir's documented rate
// limit — this is slow by design, not a bug.
app.post("/api/admin/finance/reconcile", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    if (!process.env.PAKASIR_API_KEY || !process.env.PAKASIR_SLUG) {
      return res.status(503).json({ error: "Pakasir belum dikonfigurasi." });
    }
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 15);
    const pakasirBase = process.env.PAKASIR_API_BASE || "https://app.pakasir.com/api/v2";
    const slug = process.env.PAKASIR_SLUG;

    const txnResult = await pool.query(
      `SELECT id, pakasir_order_id, pakasir_txn_id, amount FROM payment_transactions
       WHERE status = 'paid' AND pakasir_txn_id IS NOT NULL
       ORDER BY paid_at DESC LIMIT $1`,
      [limit]
    );

    const results = [];
    for (let i = 0; i < txnResult.rows.length; i++) {
      const txn = txnResult.rows[i];
      try {
        const pakasirRes = await fetch(`${pakasirBase}/transaction-status/${slug}/${txn.pakasir_txn_id}`, {
          headers: { "X-Api-Key": process.env.PAKASIR_API_KEY as string },
        });
        const pakasirData = pakasirRes.ok ? await pakasirRes.json() : null;
        results.push({
          orderId: txn.pakasir_order_id,
          recordedAmount: txn.amount,
          pakasirAmount: pakasirData?.amount ?? null,
          pakasirStatus: pakasirData?.status ?? "unknown",
          match: pakasirData ? Number(pakasirData.amount) === txn.amount : false,
        });
      } catch {
        results.push({ orderId: txn.pakasir_order_id, recordedAmount: txn.amount, pakasirAmount: null, pakasirStatus: "error", match: false });
      }
      if (i < txnResult.rows.length - 1) await sleep(4100);
    }
    res.json({ results });
  } catch (error) {
    console.error("[admin] Failed to reconcile finance:", error);
    res.status(503).json({ error: "Gagal menjalankan rekonsiliasi." });
  }
});

app.get("/api/admin/content", async (req, res) => {
  try {
    if (!(await requireAdmin(req, res))) return;
    const result = await pool.query(`SELECT * FROM admin_content_items ORDER BY created_at DESC`);
    res.json({ items: result.rows });
  } catch (error) {
    console.error("[admin] Failed to list content:", error);
    res.status(503).json({ error: "Gagal memuat daftar konten." });
  }
});

app.post("/api/admin/content", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const { title, type } = req.body || {};
    const cleanTitle = typeof title === "string" ? title.trim().slice(0, 200) : "";
    if (!cleanTitle || !type) {
      return res.status(400).json({ error: "Judul dan tipe wajib diisi." });
    }
    const result = await pool.query(
      `INSERT INTO admin_content_items (title, type, created_by) VALUES ($1, $2, $3) RETURNING *`,
      [cleanTitle, String(type).slice(0, 50), admin.email]
    );
    await logAdminAction(admin.email, "CREATE_CONTENT", cleanTitle);
    res.status(201).json({ item: result.rows[0] });
  } catch (error) {
    console.error("[admin] Failed to create content:", error);
    res.status(503).json({ error: "Gagal membuat konten." });
  }
});

app.patch("/api/admin/content/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const { status } = req.body || {};
    if (status !== "draft" && status !== "published") {
      return res.status(400).json({ error: "Status tidak dikenali." });
    }
    const result = await pool.query(
      `UPDATE admin_content_items SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );
    if (!result.rows[0]) {
      return res.status(404).json({ error: "Konten tidak ditemukan." });
    }
    await logAdminAction(admin.email, "UPDATE_CONTENT_STATUS", result.rows[0].title);
    res.json({ item: result.rows[0] });
  } catch (error) {
    console.error("[admin] Failed to update content:", error);
    res.status(503).json({ error: "Gagal memperbarui konten." });
  }
});

app.delete("/api/admin/content/:id", async (req, res) => {
  try {
    const admin = await requireAdmin(req, res);
    if (!admin) return;
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID tidak valid." });
    }
    const existing = await pool.query(`SELECT title FROM admin_content_items WHERE id = $1`, [id]);
    await pool.query(`DELETE FROM admin_content_items WHERE id = $1`, [id]);
    if (existing.rows[0]) {
      await logAdminAction(admin.email, "DELETE_CONTENT", existing.rows[0].title);
    }
    res.status(204).end();
  } catch (error) {
    console.error("[admin] Failed to delete content:", error);
    res.status(503).json({ error: "Gagal menghapus konten." });
  }
});

// Saves a fully generated PRD (all artifacts) to the current user's account
// so it stays reachable after they log back in later.
app.post("/api/prds", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk menyimpan PRD." });
    }
    const { title, productType, payload } = req.body || {};
    if (!title || typeof title !== 'string' || !payload || typeof payload !== 'object') {
      return res.status(400).json({ error: "Data PRD tidak lengkap." });
    }

    const billing = await getBillingStatus(session.user.id);
    if (billing.freeLimitReached) {
      return res.status(403).json({
        error: "Jatah percobaan gratis sudah habis. Upgrade paket untuk membuat PRD lagi.",
        code: "FREE_LIMIT_REACHED",
      });
    }

    const result = await pool.query(
      `INSERT INTO prd_documents (user_id, title, product_type, payload) VALUES ($1, $2, $3, $4) RETURNING id, created_at`,
      [session.user.id, title.slice(0, 200), String(productType || '').slice(0, 100), JSON.stringify(payload)]
    );
    res.status(201).json({ id: result.rows[0].id, createdAt: result.rows[0].created_at });
  } catch (error) {
    console.error("[prds] Failed to save PRD:", error);
    res.status(503).json({ error: "Gagal menyimpan PRD." });
  }
});

// Lists the current user's saved PRDs (summary only — no payload).
app.get("/api/prds", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk melihat riwayat PRD." });
    }
    const result = await pool.query(
      `SELECT id, title, product_type AS "productType", created_at AS "createdAt"
       FROM prd_documents WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [session.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("[prds] Failed to list PRDs:", error);
    res.status(503).json({ error: "Gagal memuat riwayat PRD." });
  }
});

// Fetches one saved PRD's full artifact payload — scoped to the owner so no
// user can open another account's document by guessing an id.
app.get("/api/prds/:id", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      return res.status(401).json({ error: "Harus masuk untuk membuka PRD." });
    }
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: "ID PRD tidak valid." });
    }
    const result = await pool.query(
      `SELECT payload FROM prd_documents WHERE id = $1 AND user_id = $2`,
      [id, session.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "PRD tidak ditemukan." });
    }
    res.json(result.rows[0].payload);
  } catch (error) {
    console.error("[prds] Failed to fetch PRD:", error);
    res.status(503).json({ error: "Gagal memuat PRD." });
  }
});

// Server-side AI generation endpoint supporting Gemini, OpenAI, Claude, and Custom OpenAI-compatible APIs
app.post("/api/ai/generate-prd", async (req, res) => {
  try {
    const { prompt, currentData, customApiKey, aiConfig } = req.body;

    const provider = aiConfig?.provider || 'gemini';
    const apiKey = (aiConfig?.apiKey && typeof aiConfig.apiKey === 'string' && aiConfig.apiKey.trim())
      ? aiConfig.apiKey.trim()
      : (customApiKey && typeof customApiKey === 'string' && customApiKey.trim())
        ? customApiKey.trim()
        : (provider === 'gemini' ? process.env.GEMINI_API_KEY : '');

    const systemInstruction = `Kamu adalah Chief Technology Officer (CTO) & Senior Product Manager di RotaLogic.
Tugasmu adalah menganalisis ide produk perangkat lunak atau jawaban wawancara dari pengguna, lalu menghasilkan output PRD yang sangat tajam, terstruktur, realistis, dan siap dicoding oleh tim engineer.
Berikan saran spesifik untuk masalah, target pengguna, fitur utama, entitas database beserta field-field pentingnya, serta potensi risiko teknis.`;

    const userPrompt = `Analisis ide produk berikut dan buatkan rekomendasi spesifikasi PRD matang dalam bahasa Indonesia:
Ide / Masukan Pengguna: "${prompt || currentData?.q1_problem || 'Website / Web App modern'}"
Jenis Produk: ${currentData?.productType || 'Website / Web App'}
Frontend: ${currentData?.frontend || 'Next.js (React)'}
Database: ${currentData?.database || 'PostgreSQL'}

Berikan respons terstruktur meliputi:
1. Ringkasan Masalah & Nilai Unik Produk
2. Fitur MVP Kunci (Prioritas P0 & P1)
3. Rekomendasi Skema Database (Tabel dan Field penting)
4. Potensi Risiko Teknis & Mitigasi`;

    let generatedText = '';

    if (provider === 'gemini') {
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          isFallback: true,
          message: "Kunci API Gemini tidak dikonfigurasi. Menggunakan mesin generator lokal."
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const modelName = aiConfig?.model || "gemini-3.8-flash";
      const response = await ai.models.generateContent({
        model: modelName,
        contents: userPrompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        }
      });
      generatedText = response.text || '';
    } else if (provider === 'openai') {
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          isFallback: true,
          message: "Kunci API OpenAI belum diisi. Menggunakan mesin generator lokal."
        });
      }

      const modelName = aiConfig?.model || "gpt-5.6-terra";
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `OpenAI API error (${openAiRes.status})`);
      }

      const data = await openAiRes.json();
      generatedText = data.choices?.[0]?.message?.content || '';
    } else if (provider === 'claude') {
      if (!apiKey) {
        return res.status(200).json({
          success: false,
          isFallback: true,
          message: "Kunci API Claude belum diisi. Menggunakan mesin generator lokal."
        });
      }

      const modelName = aiConfig?.model || "claude-sonnet-5";
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 4096,
          system: systemInstruction,
          messages: [
            { role: "user", content: userPrompt }
          ],
        }),
      });

      if (!claudeRes.ok) {
        const errJson = await claudeRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Claude API error (${claudeRes.status})`);
      }

      const data = await claudeRes.json();
      generatedText = data.content?.[0]?.text || '';
    } else if (provider === 'custom') {
      let baseUrl = (aiConfig?.customBaseUrl || '').trim();
      if (!baseUrl) {
        return res.status(200).json({
          success: false,
          isFallback: true,
          message: "Base URL custom belum diisi."
        });
      }

      // Normalize baseUrl: remove trailing slash and ensure /chat/completions endpoint
      baseUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') 
        ? baseUrl 
        : `${baseUrl}/chat/completions`;

      const customModel = aiConfig?.customModel || "default";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (apiKey) {
        headers["Authorization"] = `Bearer ${apiKey}`;
      }

      const customRes = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: customModel,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!customRes.ok) {
        const errJson = await customRes.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Custom API error (${customRes.status})`);
      }

      const data = await customRes.json();
      generatedText = data.choices?.[0]?.message?.content || data.response || '';
    }

    return res.status(200).json({
      success: true,
      aiFeedback: generatedText,
      isFallback: false
    });
  } catch (error: any) {
    console.warn("[generate-prd] Generation failed, using structured template fallback:", error?.message || "Unknown error");
    return res.status(200).json({
      success: false,
      isFallback: true,
      error: error?.message || "Internal generation error"
    });
  }
});

// Endpoint to verify / test a user's API key and provider connection
app.post("/api/ai/verify-key", async (req, res) => {
  try {
    const { apiKey, provider = 'gemini', model, customBaseUrl, customModel } = req.body;
    const cleanKey = typeof apiKey === 'string' ? apiKey.trim() : '';

    if (provider === 'gemini') {
      const keyToTest = cleanKey || process.env.GEMINI_API_KEY;

      if (!keyToTest) {
        return res.status(200).json({ 
          success: false, 
          error: "Kunci API tidak ditemukan. Silakan masukkan kunci API Gemini Anda." 
        });
      }

      if (keyToTest.length < 20) {
        return res.status(200).json({
          success: false,
          error: "Format kunci API Gemini tidak valid. Kunci Google AI Studio biasanya diawali dengan 'AIzaSy' dan terdiri dari 39 karakter."
        });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: keyToTest,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      const modelToUse = model || "gemini-3.8-flash";
      const testResponse = await ai.models.generateContent({
        model: modelToUse,
        contents: "Tes koneksi. Balas dengan: OK",
      });

      if (testResponse && testResponse.text) {
        return res.status(200).json({
          success: true,
          message: `Koneksi Google Gemini (${modelToUse}) berhasil! Kunci API valid dan siap digunakan.`
        });
      }

      return res.status(200).json({
        success: false,
        error: "Kunci API diterima namun respons model Gemini kosong."
      });
    }

    if (provider === 'openai') {
      if (!cleanKey) {
        return res.status(200).json({
          success: false,
          error: "Kunci API OpenAI belum diisi. Masukkan kunci API yang diawali dengan 'sk-'."
        });
      }

      if (!cleanKey.startsWith("sk-") || cleanKey.length < 20) {
        return res.status(200).json({
          success: false,
          error: "Format kunci API OpenAI tidak valid. Kunci biasanya diawali dengan 'sk-'."
        });
      }

      const modelToUse = model || "gpt-5.6-terra";
      const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${cleanKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      if (!openAiRes.ok) {
        const errJson = await openAiRes.json().catch(() => ({}));
        const rawMsg = errJson?.error?.message || `Status HTTP ${openAiRes.status}`;
        let friendly = `Gagal verifikasi OpenAI: ${rawMsg}`;
        if (openAiRes.status === 401) {
          friendly = "Kunci API OpenAI tidak valid. Periksa kembali kunci di dashboard OpenAI.";
        } else if (openAiRes.status === 429) {
          friendly = "Kuota OpenAI habis atau batas panggilan tercapai (Insufficient Quota / Rate Limit).";
        }
        return res.status(200).json({ success: false, error: friendly });
      }

      return res.status(200).json({
        success: true,
        message: `Koneksi OpenAI (${modelToUse}) berhasil! Kunci API valid.`
      });
    }

    if (provider === 'claude') {
      if (!cleanKey) {
        return res.status(200).json({
          success: false,
          error: "Kunci API Anthropic Claude belum diisi. Masukkan kunci API yang diawali dengan 'sk-ant-'."
        });
      }

      if (!cleanKey.startsWith("sk-ant") && cleanKey.length < 20) {
        return res.status(200).json({
          success: false,
          error: "Format kunci API Claude tidak valid. Kunci biasanya diawali dengan 'sk-ant-'."
        });
      }

      const modelToUse = model || "claude-sonnet-5";
      const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cleanKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: modelToUse,
          max_tokens: 5,
          messages: [{ role: "user", content: "ping" }],
        }),
      });

      if (!claudeRes.ok) {
        const errJson = await claudeRes.json().catch(() => ({}));
        const rawMsg = errJson?.error?.message || `Status HTTP ${claudeRes.status}`;
        let friendly = `Gagal verifikasi Claude: ${rawMsg}`;
        if (claudeRes.status === 401) {
          friendly = "Kunci API Anthropic Claude tidak valid. Periksa kembali di console.anthropic.com.";
        } else if (claudeRes.status === 429) {
          friendly = "Batas laju atau kuota Claude tercapai (Rate limit exceeded).";
        }
        return res.status(200).json({ success: false, error: friendly });
      }

      return res.status(200).json({
        success: true,
        message: `Koneksi Anthropic Claude (${modelToUse}) berhasil! Kunci API valid.`
      });
    }

    if (provider === 'custom') {
      let baseUrl = (customBaseUrl || '').trim();
      if (!baseUrl) {
        return res.status(200).json({
          success: false,
          error: "Base URL custom belum diisi. Contoh: https://api.deepseek.com/v1"
        });
      }

      baseUrl = baseUrl.replace(/\/+$/, '');
      const endpoint = baseUrl.endsWith('/chat/completions') 
        ? baseUrl 
        : `${baseUrl}/chat/completions`;

      const targetModel = customModel || "default";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (cleanKey) {
        headers["Authorization"] = `Bearer ${cleanKey}`;
      }

      const customRes = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: targetModel,
          messages: [{ role: "user", content: "ping" }],
          max_tokens: 5,
        }),
      });

      if (!customRes.ok) {
        const errJson = await customRes.json().catch(() => ({}));
        const rawMsg = errJson?.error?.message || `Status HTTP ${customRes.status}`;
        return res.status(200).json({
          success: false,
          error: `Gagal verifikasi Custom Endpoint: ${rawMsg}`
        });
      }

      return res.status(200).json({
        success: true,
        message: `Koneksi ke Endpoint Custom (${targetModel}) berhasil terhubung!`
      });
    }

    return res.status(200).json({
      success: false,
      error: `Provider "${provider}" tidak didukung.`
    });
  } catch (error: any) {
    const errorDetails = String(error?.message || error || "");
    let readableError = "Verifikasi kunci gagal. Pastikan format dan jaringan valid.";
    
    if (errorDetails.includes("RESOURCE_EXHAUSTED") || errorDetails.includes("quota")) {
      readableError = "Kuota Kunci API habis atau batas laju tercapai.";
    } else if (errorDetails.includes("PERMISSION_DENIED")) {
      readableError = "Kunci API tidak memiliki izin akses untuk model ini.";
    } else if (errorDetails.includes("API_KEY_INVALID") || errorDetails.includes("API key not valid")) {
      readableError = "Kunci API tidak valid atau belum diaktifkan.";
    } else if (errorDetails.includes("ECONNREFUSED") || errorDetails.includes("fetch failed")) {
      readableError = "Tidak dapat terhubung ke endpoint API. Periksa URL atau koneksi jaringan Anda.";
    } else {
      readableError = `Kesalahan: ${errorDetails.slice(0, 160)}`;
    }

    console.warn(`[verify-key] Key verification error: ${readableError}`);
    return res.status(200).json({
      success: false,
      error: readableError
    });
  }
});

async function startServer() {
  try {
    await ensureAppTables();
  } catch (error) {
    console.error("[db] Failed to ensure app tables exist:", error);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PRD Generator server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
