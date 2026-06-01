/**
 * Tests for src/ai/transcribe.js
 * Run: node --test tests/transcribe.test.mjs
 *
 * Note: These tests mock fetch() to avoid real network calls.
 */
import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";

// We need to mock fetch before importing the module.
// In Node 18+, we can override globalThis.fetch.

let transcribeAudio, transcribeWithGroq, transcribeWithCloudflare;

// Store original fetch
const originalFetch = globalThis.fetch;

before(async () => {
  // Import after setting up context
  const mod = await import("../src/ai/transcribe.js");
  transcribeAudio = mod.transcribeAudio;
  transcribeWithGroq = mod.transcribeWithGroq;
  transcribeWithCloudflare = mod.transcribeWithCloudflare;
});

after(() => {
  globalThis.fetch = originalFetch;
});

// Helper to create a fake audio blob
function makeBlob(size = 1024) {
  return new Blob([new Uint8Array(size)], { type: "audio/webm" });
}

// Helper to mock fetch with a JSON response
function mockFetch(responseBody, status = 200) {
  globalThis.fetch = async () => ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => responseBody,
    text: async () => JSON.stringify(responseBody),
  });
}

describe("transcribeAudio — provider selection", () => {
  it("uses Groq when sttProvider is 'groq' (default)", async () => {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({ text: "hello from groq" }) };
    };
    const result = await transcribeAudio(makeBlob(), { sttProvider: "groq" });
    assert.equal(result, "hello from groq");
    assert.ok(calls[0].includes("groq"), `Expected Groq URL, got ${calls[0]}`);
  });

  it("uses Cloudflare when sttProvider is 'cloudflare'", async () => {
    const calls = [];
    globalThis.fetch = async (url, opts) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({ text: "hello from cloudflare", provider: "cloudflare-workers-ai" }) };
    };
    const result = await transcribeAudio(makeBlob(), { sttProvider: "cloudflare", cloudflareSttEndpoint: "https://fake.worker.dev/transcribe" });
    assert.equal(result, "hello from cloudflare");
    assert.ok(calls[0].includes("fake.worker.dev"), `Expected CF URL, got ${calls[0]}`);
  });

  it("falls back to Groq when Cloudflare fails and groqSttEnabled=true", async () => {
    let callCount = 0;
    globalThis.fetch = async (url) => {
      callCount++;
      if (url.includes("fake.worker.dev")) {
        return { ok: false, status: 502, json: async () => ({ error: "CF down" }), text: async () => "CF down" };
      }
      // Groq fallback
      return { ok: true, status: 200, json: async () => ({ text: "groq fallback text" }) };
    };
    const result = await transcribeAudio(makeBlob(), {
      sttProvider: "cloudflare",
      cloudflareSttEndpoint: "https://fake.worker.dev/transcribe",
      groqSttEnabled: true,
    });
    assert.equal(result, "groq fallback text");
    assert.equal(callCount, 2, "Should have tried CF then Groq");
  });

  it("throws if Cloudflare fails and groqSttEnabled=false", async () => {
    globalThis.fetch = async (url) => ({
      ok: false, status: 502, text: async () => "CF down", json: async () => ({ error: "CF down" }),
    });
    await assert.rejects(
      () => transcribeAudio(makeBlob(), { sttProvider: "cloudflare", cloudflareSttEndpoint: "https://fake.worker.dev/transcribe", groqSttEnabled: false }),
      { message: /error 502/i }
    );
  });
});

describe("transcribeAudio — input validation", () => {
  it("throws on null blob", async () => {
    await assert.rejects(
      () => transcribeAudio(null, {}),
      { message: /no audio/i }
    );
  });

  it("throws on zero-size blob", async () => {
    await assert.rejects(
      () => transcribeAudio(new Blob([], { type: "audio/webm" }), {}),
      { message: /no audio/i }
    );
  });
});

describe("transcribeWithCloudflare — response normalisation", () => {
  it("normalises {text} response", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ text: "normalised text", provider: "cloudflare-workers-ai" }) });
    const text = await transcribeWithCloudflare(makeBlob(), "https://fake.worker.dev/transcribe");
    assert.equal(text, "normalised text");
  });

  it("also accepts {transcript} field for compatibility", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ transcript: "alt field text" }) });
    const text = await transcribeWithCloudflare(makeBlob(), "https://fake.worker.dev/transcribe");
    assert.equal(text, "alt field text");
  });

  it("throws on empty transcript", async () => {
    globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ text: "   " }) });
    await assert.rejects(
      () => transcribeWithCloudflare(makeBlob(), "https://fake.worker.dev/transcribe"),
      { message: /empty transcript/i }
    );
  });
});
