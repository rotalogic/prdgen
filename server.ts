// Must run before any local import — ES module imports evaluate in listed
// order, and src/lib/auth.ts reads process.env.DATABASE_URL at import time
// to build its Postgres pool. Importing it before env vars are loaded meant
// it silently fell back to pg's localhost default.
import "dotenv/config";

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { toNodeHandler, fromNodeHeaders } from "better-auth/node";
import { auth, isGoogleAuthConfigured } from "./src/lib/auth";
import { pool, ensureAppTables } from "./src/lib/db";

const app = express();
const PORT = 3000;

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

app.use(express.json());

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
