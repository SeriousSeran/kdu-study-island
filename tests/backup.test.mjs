import test from "node:test";
import assert from "node:assert/strict";
import { backupFileName, buildPortableBackup, parsePortableBackup } from "../src/storage/backup.js";

test("portable backup keeps kdu_v2 save data but omits passphrase", () => {
  const backup = buildPortableBackup({
    settings: { name: "Seran", passphrase: "secret", syncEndpoint: "https://worker.example" },
    profile: { xp: 12 },
    attempts: { q1: { id: "q1", lastAt: 10 } },
    notes: {},
    seqAnswers: {},
    cases: {},
    log: [],
  }, 1234);
  assert.equal(backup.kind, "kdu-study-backup");
  assert.equal(backup.schema, "kdu_v2");
  assert.equal(backup.data.v, 1);
  assert.equal(backup.settings.name, "Seran");
  assert.equal("passphrase" in backup.settings, false);
});

test("parsePortableBackup accepts wrapped backups and raw save blobs", () => {
  const wrapped = parsePortableBackup(JSON.stringify({
    settings: { dailyGoal: 80 },
    data: { v: 1, profile: { xp: 5 }, attempts: {}, notes: {}, seqAnswers: {}, cases: {}, log: [] },
  }));
  assert.equal(wrapped.settings.dailyGoal, 80);
  assert.equal(wrapped.data.profile.xp, 5);

  const raw = parsePortableBackup({ v: 1, profile: {}, attempts: {}, notes: {}, seqAnswers: {}, cases: {}, log: [] });
  assert.deepEqual(raw.settings, {});
});

test("backup file names are JSON and filesystem friendly", () => {
  assert.match(backupFileName(new Date("2026-06-01T01:02:03.004Z")), /^kdu-study-backup-2026-06-01T01-02-03-004Z\.json$/);
});
