import test from "node:test";
import assert from "node:assert/strict";
import {
  activeWeakConceptCount,
  clearWeakConceptRecord,
  dueWeakConcepts,
  normalizeWeakConcept,
  processMcqResult,
} from "../src/practice/reviewEngine.js";

test("processMcqResult creates weak concepts with status, due, and source linkage", () => {
  const item = { id: "q-1", kind: "MCQ", subject: "Medicine", stem: "Atrial fibrillation anticoagulation", tags: ["AF"] };
  const { weakConcept, srs } = processMcqResult(item, { correct: false, percent: 20, wrongLines: ["A"], skippedLines: [] }, {}, null, { nodes: [], links: [] });

  assert.equal(weakConcept.id, "q-1");
  assert.equal(weakConcept.sourceItemId, "q-1");
  assert.equal(weakConcept.status, "active");
  assert.equal(weakConcept.clearedAt, null);
  assert.equal(weakConcept.due, srs.due);
});

test("normalizeWeakConcept upgrades legacy weak records without status fields", () => {
  const now = 10_000;
  const legacy = {
    id: "legacy-1",
    subject: "Surgery",
    weakness: "Missed appendicitis red flags",
    recallQuestion: "What are danger signs?",
  };
  const normalized = normalizeWeakConcept(legacy, { id: "legacy-1", kind: "MCQ", stem: "Appendicitis stem" }, now);

  assert.equal(normalized.status, "active");
  assert.equal(normalized.sourceItemId, "legacy-1");
  assert.equal(normalized.kind, "MCQ");
  assert.equal(normalized.stem, "Appendicitis stem");
  assert.equal(normalized.weakReason, "Missed appendicitis red flags");
  assert.equal(normalized.due, now);
});

test("danger zone count excludes cleared concepts", () => {
  const weakConcepts = {
    active: { id: "active", status: "active", due: 100 },
    cleared: { id: "cleared", status: "cleared", due: 100, clearedAt: 200 },
    legacy: { id: "legacy", weakness: "old schema still active" },
  };

  assert.equal(activeWeakConceptCount(weakConcepts, {}, 500), 2);
  assert.deepEqual(dueWeakConcepts(weakConcepts, {}, 500).map(item => item.id), ["active", "legacy"]);
});

test("clearWeakConceptRecord preserves record details while marking it cleared", () => {
  const cleared = clearWeakConceptRecord({ id: "q-2", sourceItemId: "q-2", subject: "Paeds", weakness: "Neonatal jaundice" }, 1234);

  assert.equal(cleared.status, "cleared");
  assert.equal(cleared.clearedAt, 1234);
  assert.equal(cleared.lastReviewedAt, 1234);
  assert.equal(cleared.sourceItemId, "q-2");
  assert.equal(cleared.weakReason, "Neonatal jaundice");
});
