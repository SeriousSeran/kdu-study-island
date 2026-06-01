import { buildSaveBlob } from "./sync.js";

export const BACKUP_KIND = "kdu-study-backup";

export function buildPortableBackup(state, now = Date.now()) {
  const { settings = {}, ...saveState } = state || {};
  const { passphrase, ...safeSettings } = settings || {};
  return {
    kind: BACKUP_KIND,
    schema: "kdu_v2",
    exportedAt: now,
    settings: safeSettings,
    data: buildSaveBlob(saveState, now),
  };
}

export function backupFileName(now = new Date()) {
  const stamp = now.toISOString().replace(/[:.]/g, "-");
  return `kdu-study-backup-${stamp}.json`;
}

export function parsePortableBackup(text) {
  const parsed = typeof text === "string" ? JSON.parse(text) : text;
  if (!parsed || typeof parsed !== "object") throw new Error("Backup file is empty.");
  const data = parsed.data || parsed;
  if (!data || data.v == null) throw new Error("This is not a KDU save backup.");
  return {
    settings: parsed.settings || {},
    data,
  };
}
