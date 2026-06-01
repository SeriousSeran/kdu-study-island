import test from "node:test";
import assert from "node:assert/strict";
import { scoreQuestion, emptyAnswer, answerKeyText } from "../src/practice/scoring.js";

test("MR scoring gives +1 correct, -1 wrong, 0 skipped and floors percent at zero", () => {
  const q = { type: "mr", answer: { A: true, B: false, C: true, D: false, E: true } };
  const result = scoreQuestion(q, { mr: { A: true, B: true, D: false } });
  assert.equal(result.score, 1);
  assert.equal(result.maxScore, 5);
  assert.equal(result.percent, 20);
  assert.equal(result.correct, false);
  assert.deepEqual(result.wrongLines, ["B"]);
  assert.deepEqual(result.skippedLines, ["C", "E"]);
});

test("MR scoring keeps negative raw score but displays zero percent", () => {
  const q = { type: "mr", answer: { A: true, B: false } };
  const result = scoreQuestion(q, { mr: { A: false, B: true } });
  assert.equal(result.score, -2);
  assert.equal(result.maxScore, 2);
  assert.equal(result.percent, 0);
  assert.deepEqual(result.wrongLines, ["A", "B"]);
});

test("SBR scoring marks exact option only", () => {
  const q = { type: "sbr", answer: "C", options: { C: "Correct choice" } };
  assert.equal(scoreQuestion(q, { selected: "C" }).correct, true);
  assert.equal(scoreQuestion(q, { selected: "A" }).correct, false);
  assert.equal(answerKeyText(q), "C. Correct choice");
});

test("empty answer returns MR map for MR and selected null for SBR", () => {
  assert.deepEqual(emptyAnswer({ type: "mr" }), { mr: {} });
  assert.deepEqual(emptyAnswer({ type: "sbr" }), { selected: null });
});
