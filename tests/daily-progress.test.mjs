import test from "node:test";
import assert from "node:assert/strict";
import { getDailyProgress, incrementDailyProgress } from "../src/storage/dailyProgress.js";
import { mergeBlob } from "../src/storage/sync.js";

test("daily progress defaults are backward-compatible for legacy profiles", () => {
  const legacyProfile = { mcqDone: 40, seqDone: 3, dailyProgress: {} };

  assert.equal(legacyProfile.mcqDone, 40);
  assert.equal(legacyProfile.seqDone, 3);
  assert.deepEqual(getDailyProgress(legacyProfile, "2026-06-01"), { mcqDone: 0, seqDone: 0 });
});

test("daily progress is date-scoped so yesterday does not complete today", () => {
  const profile = {
    mcqDone: 25,
    seqDone: 2,
    dailyProgress: {
      "2026-05-31": { mcqDone: 20, seqDone: 1 },
    },
  };

  assert.deepEqual(getDailyProgress(profile, "2026-06-01"), { mcqDone: 0, seqDone: 0 });
});

test("incrementDailyProgress updates today's bucket without resetting lifetime counters", () => {
  const afterMcq = incrementDailyProgress({ mcqDone: 8, seqDone: 1 }, "mcqDone", "2026-06-01");
  const afterSeq = incrementDailyProgress(afterMcq, "seqDone", "2026-06-01");

  assert.equal(afterSeq.mcqDone, 8);
  assert.equal(afterSeq.seqDone, 1);
  assert.deepEqual(getDailyProgress(afterSeq, "2026-06-01"), { mcqDone: 1, seqDone: 1 });
});

test("sync merge preserves the highest per-day progress buckets", () => {
  const merged = mergeBlob({
    v: 1,
    profile: {
      mcqDone: 20,
      dailyProgress: {
        "2026-05-31": { mcqDone: 20, seqDone: 1 },
        "2026-06-01": { mcqDone: 7, seqDone: 0 },
      },
    },
    attempts: {},
    notes: {},
    seqAnswers: {},
    cases: {},
    log: [],
  }, {
    profile: {
      mcqDone: 24,
      dailyProgress: {
        "2026-06-01": { mcqDone: 3, seqDone: 1 },
      },
    },
    attempts: {},
    notes: {},
    seqAnswers: {},
    cases: {},
    log: [],
  });

  assert.equal(merged.profile.mcqDone, 24);
  assert.deepEqual(merged.profile.dailyProgress["2026-05-31"], { mcqDone: 20, seqDone: 1 });
  assert.deepEqual(merged.profile.dailyProgress["2026-06-01"], { mcqDone: 7, seqDone: 1 });
});
