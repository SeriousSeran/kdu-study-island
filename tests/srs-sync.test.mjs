import test from "node:test";
import assert from "node:assert/strict";
import { dueItems, srsQualityFromPercent, srsQualityFromResult, srsUpdate } from "../src/practice/srs.js";
import { buildSaveBlob, mergeBlob } from "../src/storage/sync.js";

test("SRS moves again answers into early review and increments lapses", () => {
  const srs = srsUpdate({ box: 4, reps: 2, lapses: 1 }, "again", 1000);
  assert.equal(srs.box, 1);
  assert.equal(srs.reps, 3);
  assert.equal(srs.lapses, 2);
  assert.equal(srs.due, 1000 + 86400000);
});

test("SRS quality maps SEQ percent and MCQ result", () => {
  assert.equal(srsQualityFromPercent(95), "easy");
  assert.equal(srsQualityFromPercent(70), "good");
  assert.equal(srsQualityFromPercent(30), "again");
  assert.equal(srsQualityFromResult({ correct: true }), "good");
  assert.equal(srsQualityFromResult({ correct: false }), "again");
});

test("dueItems sorts due records by due timestamp", () => {
  const attempts = {
    b: { id: "b", srs: { due: 200 } },
    a: { id: "a", srs: { due: 100 } },
    c: { id: "c", srs: { due: 999 } },
  };
  assert.deepEqual(dueItems(attempts, 250).map(x => x.id), ["a", "b"]);
});

test("mergeBlob preserves max profile counters and newer record maps", () => {
  const local = {
    profile: { xp: 10, total: 4, badges: ["a"] },
    attempts: { q1: { id: "q1", lastAt: 10, best: 50 } },
    notes: {},
    seqAnswers: {},
    cases: {},
    log: [{ id: "q1", at: 10 }],
  };
  const remote = {
    v: 1,
    profile: { xp: 7, total: 9, badges: ["b"] },
    attempts: { q1: { id: "q1", lastAt: 20, best: 80 } },
    notes: {},
    seqAnswers: {},
    cases: {},
    log: [{ id: "q2", at: 20 }],
  };
  const merged = mergeBlob(remote, local);
  assert.equal(merged.profile.xp, 10);
  assert.equal(merged.profile.total, 9);
  assert.deepEqual(merged.profile.badges.sort(), ["a", "b"]);
  assert.equal(merged.attempts.q1.best, 80);
  assert.equal(merged.log.length, 2);
});

test("buildSaveBlob keeps device secrets out of the payload", () => {
  const blob = buildSaveBlob({ profile: {}, attempts: {}, notes: {}, seqAnswers: {}, cases: {}, log: [], passphrase: "secret" }, 1000);
  assert.equal(blob.v, 1);
  assert.equal(blob.updatedAt, 1000);
  assert.equal("passphrase" in blob, false);
});
