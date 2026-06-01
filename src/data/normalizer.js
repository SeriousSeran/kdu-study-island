/**
 * Content Normalizer — converts any raw bank entry into a canonical LearningItem.
 *
 * Handles:
 *  - MCQ (scored/ocr banks): options, answer, expl
 *  - SEQ/CQ: stem + subs (legacy) or subquestions (new)
 *  - Case packs: text blob
 *  - RAG chunks: title + text
 *
 * The normalized shape is consumed by prompt builders and the review engine.
 * Raw bank data is NEVER mutated.
 */

/** @typedef {Object} LearningItem
 * @property {string} id
 * @property {"mcq"|"seq"|"case"|"rag"} kind
 * @property {string} subject
 * @property {string} intake
 * @property {string} stem
 * @property {Record<string,string>} options
 * @property {string|Record<string,boolean>|null} answer
 * @property {Array<{label:string,prompt:string,marks:number}>} subquestions
 * @property {string} explanation
 * @property {string[]} tags
 * @property {string} source
 * @property {number} confidence   1 = trusted key, 0.5 = ocr unverified, 0 = no key
 * @property {boolean} needsReview
 * @property {string[]} linkedTopics
 */

/**
 * Normalize a single item from any bank into a LearningItem.
 * @param {Object} raw  Raw question/case/chunk object.
 * @returns {LearningItem}
 */
export function normalize(raw) {
  if (!raw) return null;

  const kind = _inferKind(raw);

  // subquestions: support both legacy `subs` and newer `subquestions`
  const subquestions = _coerceSubs(raw.subquestions ?? raw.subs ?? []);

  // confidence: 1 for scored keys, 0.5 for ocr-unverified, 0 for no key
  const confidence =
    raw.confidence !== undefined
      ? Number(raw.confidence)
      : raw.source === "answered" && raw.answer != null
        ? 1
        : raw.answer != null
          ? 0.5
          : 0;

  return {
    id: String(raw.id ?? raw.n ?? ""),
    kind,
    subject: raw.subject ?? "",
    intake: raw.intake ?? "",
    stem: raw.stem ?? raw.title ?? raw.text?.slice(0, 200) ?? "",
    options: raw.options ?? {},
    answer: raw.answer ?? null,
    subquestions,
    explanation: raw.expl ?? raw.explanation ?? "",
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    source: raw.source ?? "",
    confidence,
    needsReview: Boolean(raw.needsReview),
    linkedTopics: Array.isArray(raw.linkedTopics) ? raw.linkedTopics : [],
  };
}

/**
 * Normalize an array of raw items.
 * @param {Object[]} items
 * @returns {LearningItem[]}
 */
export function normalizeBatch(items = []) {
  return items.map(normalize).filter(Boolean);
}

// ─── internal helpers ────────────────────────────────────────────────────────

function _inferKind(raw) {
  const k = String(raw.kind ?? "").toLowerCase();
  if (k === "mcq") return "mcq";
  if (k === "seq" || k === "cq") return "seq";
  if (k === "case") return "case";
  if (k === "rag") return "rag";
  // heuristic fallbacks
  if (raw.options && typeof raw.options === "object" && !Array.isArray(raw.options)) return "mcq";
  if (raw.subs || raw.subquestions) return "seq";
  if (raw.text && !raw.options) return "case";
  return "mcq";
}

/**
 * Coerce sub-parts into a consistent shape.
 * Accepts: [{label, prompt, marks}] or [{label, text, marks}] or string[]
 */
function _coerceSubs(subs) {
  if (!Array.isArray(subs)) return [];
  return subs.map((s, i) => {
    if (typeof s === "string") return { label: String.fromCharCode(97 + i).toUpperCase(), prompt: s, marks: 0 };
    return {
      label: s.label ?? s.part ?? String.fromCharCode(97 + i).toUpperCase(),
      prompt: s.prompt ?? s.text ?? s.question ?? "",
      marks: Number(s.marks ?? s.mark ?? 0),
    };
  });
}
