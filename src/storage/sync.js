export const SAVE_VERSION = 1;

export function buildSaveBlob(state, now = Date.now()) {
  return {
    v: SAVE_VERSION,
    updatedAt: now,
    profile: state.profile,
    attempts: state.attempts,
    notes: state.notes,
    seqAnswers: state.seqAnswers,
    cases: state.cases,
    log: state.log,
  };
}

function newerMerge(a = {}, b = {}, tsKey) {
  const out = { ...a };
  for (const [id, rec] of Object.entries(b || {})) {
    const cur = out[id];
    if (!cur || String(rec?.[tsKey] || "") > String(cur?.[tsKey] || "")) out[id] = rec;
  }
  return out;
}

function mergeProfiles(a = {}, b = {}) {
  const maxN = (x, y) => Math.max(Number(x) || 0, Number(y) || 0);
  return {
    ...a,
    ...b,
    xp: maxN(a.xp, b.xp),
    total: maxN(a.total, b.total),
    gold: maxN(a.gold, b.gold),
    mcqDone: maxN(a.mcqDone, b.mcqDone),
    seqDone: maxN(a.seqDone, b.seqDone),
    streak: maxN(a.streak, b.streak),
    lastDay: [a.lastDay, b.lastDay].filter(Boolean).sort().pop() || null,
    badges: Array.from(new Set([...(a.badges || []), ...(b.badges || [])])),
  };
}

export function mergeBlob(remote, local) {
  if (!remote || !remote.v) return local;
  const logMap = {};
  [...(local.log || []), ...(remote.log || [])].forEach(entry => {
    logMap[`${entry.at}:${entry.id}`] = entry;
  });
  const log = Object.values(logMap).sort((a, b) => a.at - b.at).slice(-2000);
  return {
    profile: mergeProfiles(local.profile, remote.profile),
    attempts: newerMerge(local.attempts, remote.attempts, "lastAt"),
    notes: newerMerge(local.notes, remote.notes, "updatedAt"),
    seqAnswers: newerMerge(local.seqAnswers, remote.seqAnswers, "updatedAt"),
    cases: newerMerge(local.cases, remote.cases, "at"),
    log,
  };
}

export async function hashKey(passphrase) {
  const msg = `kdu:${passphrase || ""}`;
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  return simpleHash(msg);
}

function simpleHash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}
