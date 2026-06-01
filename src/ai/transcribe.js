/**
 * Provider-aware audio transcription.
 *
 * Priority:
 *   1. Cloudflare Workers AI if settings.sttProvider === "cloudflare"
 *   2. Groq Whisper via Vite proxy (existing path)
 *   3. Return null + error so caller can prompt manual typing
 *
 * Rules:
 *   - Audio is NEVER stored by default (saveAudio flag controls this).
 *   - Only the transcript TEXT is sent downstream to Kimi.
 *   - Raw audio byte arrays are never forwarded to Kimi.
 *   - If maxAudioSeconds is set and blob is likely too large, warn but still try.
 *
 * This module contains no API keys. Keys are injected server-side:
 *   - Groq key → Vite dev proxy / Cloudflare Worker /api/groq
 *   - Cloudflare Workers AI → accessed through the STT Worker URL
 */

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB hard cap (Groq limit)
const DEFAULT_CF_STT_ENDPOINT = "https://soft-sea-d7c0.seran-dulnath-s-m.workers.dev/transcribe";

/**
 * Transcribe audio using Groq Whisper via the Vite/Worker proxy.
 * @param {Blob} blob
 * @returns {Promise<string>} transcript text
 */
export async function transcribeWithGroq(blob) {
  if (!blob?.size) throw new Error("Empty audio blob.");
  if (blob.size > MAX_AUDIO_BYTES) throw new Error("Audio too large for Groq (>25 MB).");

  const form = new FormData();
  form.append("file", blob, "answer.webm");
  form.append("model", "whisper-large-v3-turbo");

  const res = await fetch("/api/groq/openai/v1/audio/transcriptions", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error(`Groq STT error ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  const text = data.text || "";
  if (!text.trim()) throw new Error("Groq returned an empty transcript.");
  return text;
}

/**
 * Transcribe audio using the Cloudflare Workers AI STT Worker.
 * @param {Blob} blob
 * @param {string} [endpointOverride]
 * @returns {Promise<string>} transcript text
 */
export async function transcribeWithCloudflare(blob, endpointOverride = "") {
  if (!blob?.size) throw new Error("Empty audio blob.");
  if (blob.size > MAX_AUDIO_BYTES) throw new Error("Audio too large (>25 MB).");

  const endpoint = (endpointOverride || DEFAULT_CF_STT_ENDPOINT).replace(/\/$/, "");
  const form = new FormData();
  form.append("file", blob, "answer.webm");

  const res = await fetch(endpoint, { method: "POST", body: form });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Cloudflare STT error ${res.status}: ${body.slice(0, 180)}`);
  }

  const data = await res.json();
  // Normalise response — Worker returns { text, provider }
  const text = data.text || data.transcript || "";
  if (!text.trim()) throw new Error("Cloudflare STT returned an empty transcript.");
  return text;
}

/**
 * Unified transcription entry point.
 *
 * @param {Blob} blob
 * @param {Object} [settings]  App settings (from saveStore DEFAULT_SETTINGS)
 * @returns {Promise<string>}
 * @throws if both providers fail
 */
export async function transcribeAudio(blob, settings = {}) {
  const provider = settings.sttProvider || "groq";
  const cfEndpoint = settings.cloudflareSttEndpoint || "";
  const groqEnabled = settings.groqSttEnabled !== false; // default true

  if (!blob?.size) throw new Error("No audio recorded. Please try again.");

  if (provider === "cloudflare") {
    try {
      return await transcribeWithCloudflare(blob, cfEndpoint);
    } catch (cfErr) {
      // Cloudflare failed — fall back to Groq if enabled
      if (groqEnabled) {
        console.warn("[STT] Cloudflare failed, falling back to Groq:", cfErr.message);
        return await transcribeWithGroq(blob);
      }
      throw cfErr;
    }
  }

  // Default: Groq
  return await transcribeWithGroq(blob);
}
