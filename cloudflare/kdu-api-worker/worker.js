/**
 * KDU API Worker — unified backend for AI calls, RAG, and graph updates.
 *
 * This Worker proxies AI calls so API keys NEVER reach the browser.
 * All Cloudflare features beyond AI are behind runtime checks (feature flags).
 *
 * Endpoints:
 *   POST /api/transcribe         — Workers AI Whisper STT
 *   POST /api/ai/mcq-explain     — Kimi MCQ explanation
 *   POST /api/ai/seq-mark        — Kimi SEQ marking
 *   POST /api/ai/case-chat       — Kimi live case patient/examiner
 *   POST /api/rag/search         — RAG search (placeholder if Vectorize disabled)
 *   POST /api/graph/update       — Graph update merge (placeholder if D1 disabled)
 *   GET  /health                 — Health check
 *
 * Required secrets (set via wrangler secret put):
 *   MOONSHOT_API_KEY
 *   GROQ_API_KEY  (optional, if Groq fallback needed)
 *
 * Optional bindings (enable in wrangler.toml when ready):
 *   AI         — Workers AI (for STT and embeddings)
 *   VECTORIZE  — Vectorize index (for RAG)
 *   DB         — D1 database (for cloud progress)
 *   KV         — KV namespace (for caching/config)
 *   R2         — R2 bucket (for file storage)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
const MOONSHOT_API = "https://api.moonshot.ai/v1/chat/completions";

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === "/health" && request.method === "GET") {
        return json({ status: "ok", features: { ai: !!env.AI, vectorize: !!env.VECTORIZE, d1: !!env.DB, kv: !!env.KV, r2: !!env.R2 } });
      }

      if (path === "/api/transcribe" && request.method === "POST") {
        return handleTranscribe(request, env);
      }

      if (path === "/api/ai/mcq-explain" && request.method === "POST") {
        return handleAiCall(request, env, "mcq-explain");
      }

      if (path === "/api/ai/seq-mark" && request.method === "POST") {
        return handleAiCall(request, env, "seq-mark");
      }

      if (path === "/api/ai/case-chat" && request.method === "POST") {
        return handleAiCall(request, env, "case-chat");
      }

      if (path === "/api/rag/search" && request.method === "POST") {
        return handleRagSearch(request, env);
      }

      if (path === "/api/graph/update" && request.method === "POST") {
        return handleGraphUpdate(request, env);
      }

      return jsonError("Not found", 404);
    } catch (err) {
      console.error("[KDU API Worker]", err);
      return jsonError(`Internal error: ${err.message}`, 500);
    }
  },
};

// ─── STT ─────────────────────────────────────────────────────────────────────

async function handleTranscribe(request, env) {
  if (!env.AI) return jsonError("Workers AI binding not configured.", 503);

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid FormData.", 400);
  }

  const fileField = formData.get("file");
  if (!fileField) return jsonError("Missing 'file' field.", 400);

  const buf = await fileField.arrayBuffer();
  if (!buf.byteLength) return jsonError("Empty audio.", 400);
  if (buf.byteLength > MAX_AUDIO_BYTES) return jsonError("Audio too large (>25 MB).", 413);

  const result = await env.AI.run("@cf/openai/whisper", { audio: Array.from(new Uint8Array(buf)) });
  const text = result?.text || "";
  if (!text.trim()) return jsonError("Empty transcript.", 422);

  return json({ text, provider: "cloudflare-workers-ai" });
}

// ─── AI Calls (proxy to Kimi/Moonshot — key injected server-side) ────────────

async function handleAiCall(request, env, _mode) {
  if (!env.MOONSHOT_API_KEY) return jsonError("MOONSHOT_API_KEY not configured.", 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const { messages, maxTokens = 1200, temperature = 0.3, model } = body;
  if (!Array.isArray(messages) || !messages.length) {
    return jsonError("messages array required.", 400);
  }

  const targetModel = model || env.DEFAULT_MODEL || "moonshot-v1-8k";

  const upstream = await fetch(MOONSHOT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MOONSHOT_API_KEY}`,
    },
    body: JSON.stringify({ model: targetModel, messages, temperature, max_tokens: maxTokens }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return jsonError(`Upstream AI error ${upstream.status}: ${errText.slice(0, 200)}`, upstream.status);
  }

  const data = await upstream.json();
  const text = data.choices?.[0]?.message?.content || "";
  return json({ text, model: targetModel });
}

// ─── RAG Search (placeholder when Vectorize not enabled) ─────────────────────

async function handleRagSearch(request, env) {
  if (!env.VECTORIZE) {
    // Return empty — frontend should handle gracefully
    return json({ results: [], provider: "disabled", note: "Vectorize not configured." });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  const { query, topK = 5 } = body;
  if (!query) return jsonError("query required.", 400);

  // Generate embedding via Workers AI
  if (!env.AI) return jsonError("AI binding required for embeddings.", 503);
  const embResult = await env.AI.run("@cf/baai/bge-small-en-v1.5", { text: [query] });
  const vector = embResult?.data?.[0];
  if (!vector) return jsonError("Could not generate embedding.", 500);

  const matches = await env.VECTORIZE.query(vector, { topK, returnMetadata: true });
  const results = (matches.matches || []).map(m => ({
    id: m.id,
    score: m.score,
    ...m.metadata,
  }));

  return json({ results, provider: "vectorize" });
}

// ─── Graph Update (placeholder when D1 not enabled) ──────────────────────────

async function handleGraphUpdate(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON.", 400);
  }

  const { graphUpdates = [] } = body;

  if (!env.DB) {
    // Return the same updates back — frontend merges locally
    return json({ applied: graphUpdates, provider: "local-passthrough", note: "D1 not configured; apply locally." });
  }

  // D1 implementation placeholder — to be implemented when D1 is configured
  return json({ applied: graphUpdates, provider: "d1-stub" });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
