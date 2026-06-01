/**
 * Cloudflare Workers AI — Speech-to-Text Worker
 *
 * Endpoint:  POST /transcribe
 * Input:     FormData with field "file" (audio blob, filename "answer.webm")
 * Output:    { text: string, provider: "cloudflare-workers-ai" }
 *
 * Bindings required (set in wrangler.toml or Cloudflare dashboard):
 *   AI  — Workers AI binding
 *
 * Security:
 *   - No API key needed in browser (Workers AI is billed to the account)
 *   - CORS enabled for all origins (restrict if you want stricter security)
 *   - Audio is NOT stored — it is converted and immediately transcribed
 *   - Empty audio is rejected with 400
 *   - Very large audio (>25 MB) is rejected with 413
 */

const MAX_AUDIO_BYTES = 25 * 1024 * 1024; // 25 MB
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    // Route: POST /transcribe
    if (request.method === "POST" && url.pathname === "/transcribe") {
      return handleTranscribe(request, env);
    }

    // Health check
    if (request.method === "GET" && url.pathname === "/health") {
      return jsonResponse({ status: "ok", provider: "cloudflare-workers-ai" });
    }

    return jsonError("Not found", 404);
  },
};

async function handleTranscribe(request, env) {
  // Parse multipart FormData
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError("Invalid FormData. Send audio as multipart/form-data with field 'file'.", 400);
  }

  const fileField = formData.get("file");
  if (!fileField) {
    return jsonError("Missing 'file' field in FormData.", 400);
  }

  // Read the audio bytes
  let audioBytes;
  try {
    const arrayBuffer = await fileField.arrayBuffer();
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      return jsonError("Audio file is empty.", 400);
    }
    if (arrayBuffer.byteLength > MAX_AUDIO_BYTES) {
      return jsonError(`Audio too large (${arrayBuffer.byteLength} bytes). Maximum is 25 MB.`, 413);
    }
    audioBytes = Array.from(new Uint8Array(arrayBuffer));
  } catch (err) {
    return jsonError(`Could not read audio data: ${err.message}`, 400);
  }

  // Run Workers AI Whisper
  let result;
  try {
    result = await env.AI.run("@cf/openai/whisper", { audio: audioBytes });
  } catch (err) {
    return jsonError(`Workers AI transcription failed: ${err.message}`, 502);
  }

  // Normalise the Whisper response
  // Workers AI Whisper returns: { text, word_count, words, vtt }
  const text = result?.text || "";
  if (!text.trim()) {
    return jsonError("Transcription returned empty text. Please speak clearly and try again.", 422);
  }

  // Return ONLY the text — do NOT return raw audio bytes
  return jsonResponse(
    { text, provider: "cloudflare-workers-ai" },
    200
  );
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function jsonError(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
