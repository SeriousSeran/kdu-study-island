/**
 * Tool-Call Planner
 *
 * Decides whether a visual tool (diagram, video, flashcards, pathway, guideline)
 * would help a student with a specific learning item, based on tags and subject.
 *
 * This is intentionally lightweight — it does NOT make network calls.
 * It returns a list of suggested tools that the UI can show as action buttons.
 * The user chooses whether to invoke them.
 */

/** All available tool identifiers. */
export const TOOLS = {
  IMAGE: "create_learning_image",
  D3_GRAPH: "create_d3_graph",
  VIDEO: "retrieve_learning_video",
  FLASHCARDS: "generate_flashcards",
  CASE_PATHWAY: "generate_case_pathway",
  GUIDELINE: "retrieve_guideline",
};

/**
 * Tag/subject → tool suggestion rules.
 * Each rule: {match: string[], tool, reason, queryTemplate}
 * match is checked against lowercased tags + subject.
 */
const RULES = [
  {
    match: ["neuro", "neurology", "brain", "spinal", "cord", "cerebellum", "brainstem", "peripheral nerve", "nmj"],
    tool: TOOLS.D3_GRAPH,
    reason: "Neuroanatomy pathway benefits from a visual localization diagram.",
    queryTemplate: stem => `Neuroanatomy pathway diagram: ${stem.slice(0, 80)}`,
  },
  {
    match: ["ecg", "arrhythmia", "heart block", "afib", "vt", "svt", "qrs", "qt interval"],
    tool: TOOLS.IMAGE,
    reason: "ECG pattern recognition is strongly visual.",
    queryTemplate: stem => `ECG diagram: ${stem.slice(0, 80)}`,
  },
  {
    match: ["radiology", "x-ray", "xray", "ct", "mri", "ultrasound", "imaging", "chest x-ray"],
    tool: TOOLS.IMAGE,
    reason: "Radiology findings require visual pattern learning.",
    queryTemplate: stem => `Radiology image: ${stem.slice(0, 80)}`,
  },
  {
    match: ["obstetric", "partograph", "bishop score", "labour", "delivery", "fetal"],
    tool: TOOLS.IMAGE,
    reason: "Obstetric diagrams clarify partograph, mechanisms of labour.",
    queryTemplate: stem => `Obstetric diagram: ${stem.slice(0, 80)}`,
  },
  {
    match: ["emergency", "shock", "resuscitation", "abcde", "anaphylaxis", "sepsis", "code", "arrest"],
    tool: TOOLS.CASE_PATHWAY,
    reason: "Emergency algorithms are best learned as a step-by-step pathway.",
    queryTemplate: stem => `Emergency algorithm: ${stem.slice(0, 80)}`,
  },
  {
    match: ["anatomy", "surgical anatomy", "surface anatomy", "landmarks"],
    tool: TOOLS.IMAGE,
    reason: "Surgical anatomy benefits from annotated diagrams.",
    queryTemplate: stem => `Surgical anatomy: ${stem.slice(0, 80)}`,
  },
  {
    match: ["psychiatry", "mse", "mental state", "risk", "schizophrenia", "bipolar", "depression"],
    tool: TOOLS.CASE_PATHWAY,
    reason: "Psychiatry interview and risk assessment follow a structured checklist.",
    queryTemplate: stem => `Psychiatry risk/MSE checklist: ${stem.slice(0, 80)}`,
  },
  {
    match: ["pathway", "mechanism", "cascade", "coagulation", "complement", "signalling"],
    tool: TOOLS.D3_GRAPH,
    reason: "Mechanism/pathway maps make complex cascades easier to revise.",
    queryTemplate: stem => `Mechanism map: ${stem.slice(0, 80)}`,
  },
  {
    match: ["guideline", "protocol", "nice", "who", "bhf", "aha", "esc", "rcp"],
    tool: TOOLS.GUIDELINE,
    reason: "Guideline reference helps verify safe management steps.",
    queryTemplate: stem => `Clinical guideline: ${stem.slice(0, 80)}`,
  },
];

/**
 * Return tool suggestions for a LearningItem (or any object with .tags, .subject, .stem).
 * @param {Object} item   Normalized LearningItem (or any object with tags/subject/stem).
 * @returns {Array<{tool:string, reason:string, query:string}>}
 */
export function suggestTools(item) {
  if (!item) return [];

  const haystack = [
    ...(Array.isArray(item.tags) ? item.tags : []),
    item.subject ?? "",
  ]
    .join(" ")
    .toLowerCase();

  const stem = String(item.stem ?? "");
  const suggestions = [];
  const seenTools = new Set();

  for (const rule of RULES) {
    if (seenTools.has(rule.tool)) continue;
    if (rule.match.some(kw => haystack.includes(kw))) {
      suggestions.push({
        tool: rule.tool,
        reason: rule.reason,
        query: rule.queryTemplate(stem),
      });
      seenTools.add(rule.tool);
    }
  }

  // Always offer flashcard generation for weak items
  if (!seenTools.has(TOOLS.FLASHCARDS)) {
    suggestions.push({
      tool: TOOLS.FLASHCARDS,
      reason: "Flashcards accelerate recall for this concept.",
      query: `Flashcards: ${stem.slice(0, 80)}`,
    });
  }

  return suggestions;
}
