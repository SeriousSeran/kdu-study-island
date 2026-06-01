/**
 * Tests for src/data/normalizer.js
 * Run: node --test tests/normalizer.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { normalize, normalizeBatch } from "../src/data/normalizer.js";

describe("normalize — basic MCQ", () => {
  it("infers kind=mcq from options object", () => {
    const raw = { id: "q1", options: { A: "text A", B: "text B" }, answer: "A", stem: "What is X?" };
    const item = normalize(raw);
    assert.equal(item.kind, "mcq");
    assert.equal(item.id, "q1");
    assert.equal(item.stem, "What is X?");
    assert.equal(item.answer, "A");
    assert.deepEqual(item.subquestions, []);
  });

  it("sets confidence=1 for scored answered keys", () => {
    const raw = { id: "q2", kind: "MCQ", source: "answered", answer: "B", options: { B: "something" }, stem: "Q" };
    const item = normalize(raw);
    assert.equal(item.confidence, 1);
  });

  it("sets confidence=0 when no answer key", () => {
    const raw = { id: "q3", kind: "MCQ", stem: "Q" };
    const item = normalize(raw);
    assert.equal(item.confidence, 0);
  });
});

describe("normalize — subquestions / subs compatibility", () => {
  it("uses subquestions when present", () => {
    const raw = {
      id: "seq1", kind: "SEQ", stem: "Describe hypertension",
      subquestions: [{ label: "A", prompt: "Pathophysiology", marks: 5 }],
    };
    const item = normalize(raw);
    assert.equal(item.kind, "seq");
    assert.equal(item.subquestions.length, 1);
    assert.equal(item.subquestions[0].label, "A");
    assert.equal(item.subquestions[0].prompt, "Pathophysiology");
    assert.equal(item.subquestions[0].marks, 5);
  });

  it("falls back to legacy subs when subquestions absent", () => {
    const raw = {
      id: "seq2", kind: "SEQ", stem: "Describe heart failure",
      subs: [{ label: "B", prompt: "Management", marks: 3 }],
    };
    const item = normalize(raw);
    assert.equal(item.subquestions.length, 1);
    assert.equal(item.subquestions[0].label, "B");
    assert.equal(item.subquestions[0].marks, 3);
  });

  it("prefers subquestions over subs when both present", () => {
    const raw = {
      id: "seq3", kind: "SEQ", stem: "Q",
      subquestions: [{ label: "A", prompt: "New", marks: 4 }],
      subs: [{ label: "B", prompt: "Old", marks: 2 }],
    };
    const item = normalize(raw);
    assert.equal(item.subquestions[0].label, "A");
    assert.equal(item.subquestions[0].prompt, "New");
  });

  it("coerces string-array subs into {label, prompt, marks}", () => {
    const raw = { id: "seq4", kind: "SEQ", stem: "Q", subs: ["Define X", "Describe Y"] };
    const item = normalize(raw);
    assert.equal(item.subquestions.length, 2);
    assert.equal(item.subquestions[0].prompt, "Define X");
    assert.equal(item.subquestions[1].label, "B");
  });
});

describe("normalize — case and RAG", () => {
  it("infers kind=case from text without options", () => {
    const raw = { id: "c1", text: "Patient presents with...", title: "HF case" };
    const item = normalize(raw);
    assert.equal(item.kind, "case");
  });

  it("uses title as stem for case", () => {
    const raw = { id: "c2", kind: "case", title: "Pneumonia long case", text: "..." };
    const item = normalize(raw);
    assert.equal(item.stem, "Pneumonia long case");
  });
});

describe("normalizeBatch", () => {
  it("normalizes an array and skips nulls", () => {
    const items = [
      { id: "q1", kind: "MCQ", stem: "Q1", options: { A: "opt" }, answer: "A" },
      null,
      { id: "q2", kind: "SEQ", stem: "Q2", subs: [{ label: "A", prompt: "P", marks: 2 }] },
    ];
    const result = normalizeBatch(items);
    assert.equal(result.length, 2);
    assert.equal(result[0].id, "q1");
    assert.equal(result[1].subquestions.length, 1);
  });
});
