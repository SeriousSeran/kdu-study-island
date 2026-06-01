/**
 * RAG Client — frontend adapter for semantic context retrieval.
 *
 * When ragEnabled=false (default), returns empty results immediately.
 * When ragEnabled=true, calls the KDU API Worker /api/rag/search endpoint.
 *
 * The Worker handles Vectorize. The frontend never talks to Vectorize directly.
 *
 * Usage:
 *   const context = await searchRag(item.stem, settings);
 *   // context = [{ id, score, subject, text, title }] or []
 *
 * The context array is passed into prompt builders as retrieved context.
 * Keep context compact — do not dump full case sheets into prompts.
 */

/**
 * @param {string} query           Search query (question stem, topic, or weakness).
 * @param {Object} settings        App settings.
 * @param {number} [topK=5]        Number of results to retrieve.
 * @returns {Promise<Array>}       Array of matching chunks, or [] if disabled/error.
 */
export async function searchRag(query, settings = {}, topK = 5) {
  // Feature flag: disabled by default
  if (!settings.ragEnabled) return [];
  if (!settings.vectorizeEnabled) return [];

  const workerUrl = (settings.cloudflareApiWorkerUrl || "").replace(/\/$/, "");
  if (!workerUrl) return [];

  try {
    const res = await fetch(`${workerUrl}/api/rag/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, topK }),
    });

    if (!res.ok) {
      console.warn("[RAG] Search failed:", res.status);
      return [];
    }

    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch (err) {
    console.warn("[RAG] Network error:", err.message);
    return [];
  }
}

/**
 * Format RAG results into a compact context string for prompt injection.
 * Keep it short — only include relevant snippets, not full documents.
 *
 * @param {Array} results   From searchRag()
 * @param {number} [maxChars=600]
 * @returns {string}
 */
export function formatRagContext(results = [], maxChars = 600) {
  if (!results.length) return "";
  const snippets = results
    .filter(r => r.text || r.title)
    .map(r => `[${r.title || r.id}] ${(r.text || "").slice(0, 150).trim()}`)
    .join("\n");
  return snippets.slice(0, maxChars);
}
