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
    const amount = PLAN_PRICES_MONTHLY[plan] * (cycle === "3_bulan" ? 3 : 1);
    const cleanPromoCode = typeof promoCode === "string" && promoCode.trim()
      ? promoCode.trim().slice(0, 40)
      : null;

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
      `SELECT id, user_id, plan, amount, status, pakasir_txn_id FROM payment_transactions WHERE pakasir_order_id = $1`,
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
