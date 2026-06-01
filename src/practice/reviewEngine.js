/**
 * Review Engine
 *
 * Unified post-attempt loop for MCQ, SEQ, and live cases.
 *
 * For every wrong MCQ, weak SEQ, or failed case it creates:
 *  1. A WeakConceptRecord describing WHY the item was missed.
 *  2. An SRS entry (delegated to srs.js — schema unchanged).
 *  3. Graph update payloads ready for applyGraphUpdates().
 *
 * This module does NOT write to IndexedDB directly — it returns plain objects
 * that App.jsx merges into the existing state setters. The storage schema
 * (kdu_v2_*) is never modified.
 */

import { srsUpdate, srsQualityFromResult, srsQualityFromPercent } from "./srs.js";
import { applyGraphUpdates, EDGE_TYPES, NODE_TYPES, nodeId } from "../graph/d3Model.js";

/** @typedef {Object} WeakConceptRecord
 * @property {string} id           Same as the question/case id.
 * @property {string} kind         "MCQ" | "SEQ" | "case"
 * @property {string} subject
 * @property {string} stem         Short question stem or case title.
 * @property {string} weakReason   Why the student got it wrong (from AI or heuristic).
 * @property {string} recallQ      Suggested future recall question.
 * @property {string[]} linkedTopics
 * @property {Object[]} graphUpdates  Ready for applyGraphUpdates().
 * @property {Object} srs          Updated SRS state.
 * @property {number} createdAt
 */

/**
 * Process an MCQ attempt result.
 *
 * @param {import('../data/normalizer.js').LearningItem} item
 * @param {{correct:boolean, percent:number, wrongLines:string[], skippedLines:string[]}} result
 * @param {Object} [prevSrs]   Existing SRS state for this item.
 * @param {Object} [aiJson]    Parsed AI response (may be null if offline).
 * @param {{nodes:Object[], links:Object[]}} [d3Graph]  Current D3 graph state.
 * @returns {{weakConcept: WeakConceptRecord|null, srs: Object, d3Graph: Object}}
 */
export function processMcqResult(item, result, prevSrs = {}, aiJson = null, d3Graph = { nodes: [], links: [] }) {
  const quality = srsQualityFromResult(result);
  const srs = srsUpdate(prevSrs, quality);

  // Only create a weak concept record for wrong/skipped answers
  if (result.correct === true) {
    return { weakConcept: null, srs, d3Graph };
  }

  const weakReason = aiJson?.mistakePattern ?? _heuristicMcqReason(result);
  const linkedTopics = aiJson?.linkedTopics ?? [];
  const graphUpdates = _buildMcqGraphUpdates(item, result, aiJson);

  const weakConcept = _makeWeakConcept({
    id: item.id,
    kind: "MCQ",
    subject: item.subject,
    stem: item.stem,
    weakReason,
    recallQ: aiJson?.nextVivaQuestion ?? `Re-examine: ${item.stem.slice(0, 80)}`,
    linkedTopics,
    graphUpdates,
    srs,
  });

  const updatedGraph = applyGraphUpdates(graphUpdates, d3Graph);
  return { weakConcept, srs, d3Graph: updatedGraph };
}

/**
 * Process a SEQ/CQ result.
 *
 * @param {import('../data/normalizer.js').LearningItem} item
 * @param {number|null} percent       0-100 or null (self-mark pending).
 * @param {Object} [prevSrs]
 * @param {Object} [aiJson]
 * @param {{nodes:Object[], links:Object[]}} [d3Graph]
 * @returns {{weakConcept: WeakConceptRecord|null, srs: Object, d3Graph: Object}}
 */
export function processSeqResult(item, percent, prevSrs = {}, aiJson = null, d3Graph = { nodes: [], links: [] }) {
  const quality = srsQualityFromPercent(percent);
  const srs = srsUpdate(prevSrs, quality);

  const isWeak = percent == null || percent < 70;
  if (!isWeak) {
    return { weakConcept: null, srs, d3Graph };
  }

  const weakReason = aiJson?.mistakePattern ?? `Scored ${percent ?? "?"}% — below 70% threshold.`;
  const linkedTopics = aiJson?.linkedTopics ?? [];
  const graphUpdates = aiJson?.graphUpdates ?? _buildSeqGraphUpdates(item);

  const weakConcept = _makeWeakConcept({
    id: item.id,
    kind: "SEQ",
    subject: item.subject,
    stem: item.stem,
    weakReason,
    recallQ: aiJson?.nextVivaQuestion ?? `Viva: ${item.stem.slice(0, 80)}`,
    linkedTopics,
    graphUpdates,
    srs,
  });

  const updatedGraph = applyGraphUpdates(graphUpdates, d3Graph);
  return { weakConcept, srs, d3Graph: updatedGraph };
}

/**
 * Process a case encounter result.
 *
 * @param {Object} casePack    {id, title, subject}
 * @param {string} feedback    AI examiner feedback text.
 * @param {Object} [aiJson]    Parsed structured feedback (may be null).
 * @param {{nodes:Object[], links:Object[]}} [d3Graph]
 * @returns {{weakConcept: WeakConceptRecord|null, d3Graph: Object}}
 */
export function processCaseResult(casePack, feedback, aiJson = null, d3Graph = { nodes: [], links: [] }) {
  // Cases don't use SRS — each encounter is inherently a new case
  const isWeak = !feedback || /poor|fail|unsafe|missed|incomplete/i.test(feedback);
  if (!isWeak) {
    return { weakConcept: null, d3Graph };
  }

  const graphUpdates = aiJson?.graphUpdates ?? [
    { source: casePack.subject ?? "case", target: nodeId(casePack.title ?? "case"), edge: EDGE_TYPES.WEAK_IN, weight: 1 },
  ];

  const weakConcept = _makeWeakConcept({
    id: casePack.id,
    kind: "case",
    subject: casePack.subject,
    stem: casePack.title ?? casePack.id,
    weakReason: aiJson?.mistakePattern ?? "Case performance below threshold.",
    recallQ: aiJson?.nextVivaQuestion ?? `Viva: Present and manage this case — ${casePack.title}.`,
    linkedTopics: aiJson?.linkedTopics ?? [],
    graphUpdates,
    srs: null, // cases don't use SRS
  });

  const updatedGraph = applyGraphUpdates(graphUpdates, d3Graph);
  return { weakConcept, d3Graph: updatedGraph };
}

// ─── Internal helpers ────────────────────────────────────────────────────────

function _makeWeakConcept({ id, kind, subject, stem, weakReason, recallQ, linkedTopics, graphUpdates, srs }) {
  return {
    id,
    kind,
    subject,
    stem,
    weakReason,
    recallQ,
    linkedTopics,
    graphUpdates,
    srs,
    createdAt: Date.now(),
  };
}

function _heuristicMcqReason(result) {
  if (result.wrongLines?.length) return `Got ${result.wrongLines.join(", ")} wrong — likely a True/False confusion.`;
  if (result.skippedLines?.length) return `Skipped ${result.skippedLines.join(", ")} — gaps in knowledge.`;
  return "Incorrect answer selected — review the mechanism.";
}

function _buildMcqGraphUpdates(item, result, aiJson) {
  if (aiJson?.graphUpdates?.length) return aiJson.graphUpdates;
  const updates = [];
  // Mark the question topic as a weak concept
  if (item.tags?.length) {
    for (const tag of item.tags.slice(0, 3)) {
      updates.push({ source: tag, target: item.subject, edge: EDGE_TYPES.WEAK_IN, weight: 1 });
    }
  } else {
    updates.push({ source: item.stem.slice(0, 40), target: item.subject, edge: EDGE_TYPES.WEAK_IN, weight: 1 });
  }
  // Wrong lines → confused_with edges
  for (const letter of result.wrongLines ?? []) {
    const option = item.options?.[letter];
    if (option) {
      updates.push({ source: item.stem.slice(0, 40), target: option.slice(0, 40), edge: EDGE_TYPES.CONFUSED_WITH, weight: 1 });
    }
  }
  return updates;
}

function _buildSeqGraphUpdates(item) {
  const updates = [];
  if (item.tags?.length) {
    for (const tag of item.tags.slice(0, 3)) {
      updates.push({ source: tag, target: item.subject, edge: EDGE_TYPES.WEAK_IN, weight: 1 });
    }
  } else {
    updates.push({ source: item.stem.slice(0, 40), target: item.subject, edge: EDGE_TYPES.WEAK_IN, weight: 1 });
  }
  return updates;
}
