/**
 * AI Response Parser
 *
 * The KDU-Tutor prompt asks Kimi to return a specific JSON shape.
 * This module attempts to parse the response and validates the required keys.
 * If parsing fails (plain text, partial JSON, network error text) it falls back
 * to {ok: false, plain: text} so the UI can render it as-is.
 */

/** All keys the structured JSON response must contain to be considered valid. */
const REQUIRED_KEYS = [
  "verdict",
  "mistakePattern",
  "mechanism",
  "mustKnow",
  "missedPoints",
  "examTraps",
  "memoryHook",
  "linkedTopics",
  "graphUpdates",
  "flashcards",
  "toolCallsSuggested",
];

/**
 * @typedef {Object} ParsedOk
 * @property {true} ok
 * @property {AiResponse} json
 *
 * @typedef {Object} ParsedFallback
 * @property {false} ok
 * @property {string} plain
 *
 * @typedef {ParsedOk|ParsedFallback} ParseResult
 */

/**
 * Parse an AI text response into either a validated JSON object or a plain-text fallback.
 * @param {string} text  Raw text from the model.
 * @returns {ParseResult}
 */
export function parseAiResponse(text) {
  if (!text || typeof text !== "string") return { ok: false, plain: "" };

  // Strip common markdown code fences the model sometimes adds
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");

  try {
    const json = JSON.parse(cleaned);
    if (json && typeof json === "object" && REQUIRED_KEYS.every(k => k in json)) {
      // Ensure array fields are arrays even if model skipped them
      return { ok: true, json: _coerceResponse(json) };
    }
    // Partial JSON — useful as plain text
    return { ok: false, plain: text };
  } catch {
    return { ok: false, plain: text };
  }
}

/**
 * Coerce array/string fields to the expected types so UI can safely map() them.
 * @param {Object} j  Parsed but potentially malformed JSON.
 * @returns {AiResponse}
 */
function _coerceResponse(j) {
  const arr = v => (Array.isArray(v) ? v : v ? [v] : []);
  return {
    verdict: String(j.verdict ?? ""),
    mistakePattern: String(j.mistakePattern ?? ""),
    mechanism: String(j.mechanism ?? ""),
    mustKnow: arr(j.mustKnow),
    missedPoints: arr(j.missedPoints),
    examTraps: arr(j.examTraps),
    memoryHook: String(j.memoryHook ?? ""),
    linkedTopics: arr(j.linkedTopics),
    nextVivaQuestion: j.nextVivaQuestion ? String(j.nextVivaQuestion) : null,
    flashcards: arr(j.flashcards).map(f => ({
      front: String(f?.front ?? ""),
      back: String(f?.back ?? ""),
    })),
    graphUpdates: arr(j.graphUpdates).map(u => ({
      source: String(u?.source ?? ""),
      target: String(u?.target ?? ""),
      edge: String(u?.edge ?? "appears_in"),
      weight: Number(u?.weight ?? 1),
    })),
    toolCallsSuggested: arr(j.toolCallsSuggested).map(t => ({
      tool: String(t?.tool ?? ""),
      reason: String(t?.reason ?? ""),
      query: String(t?.query ?? ""),
    })),
  };
}
