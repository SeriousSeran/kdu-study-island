import * as idbKeyval from "idb-keyval";

export const DEFAULT_SYNC_ENDPOINT = "https://kdu-sync.seran-dulnath-s-m.workers.dev";
export const IDB_STORE = idbKeyval.createStore("kdu-finals-rpg", "keyval");

export const KEYS = {
  settings: "kdu_v2_settings",
  profile: "kdu_v2_profile",
  attempts: "kdu_v2_attempts",
  notes: "kdu_v2_notes",
  seqAnswers: "kdu_v2_seq",
  cases: "kdu_v2_cases",
  log: "kdu_v2_log",
  weakConcepts: "kdu_v2_weak_concepts",
  focus: "kdu_v2_focus",
};

export const DEFAULT_PROFILE = {
  xp: 0,
  streak: 0,
  lastDay: null,
  total: 0,
  mcqDone: 0,
  seqDone: 0,
  gold: 0,
  sanity: 100,
  hearts: 5,
  badges: [],
  customVideos: [],
};

export const DEFAULT_SETTINGS = {
  // ── Existing keys (do NOT rename or remove) ──────────────────────────────
  name: "Seran",
  subject: "All",
  intake: "All",
  dailyGoal: 60,
  examDate: "2026-06-14",
  syncEndpoint: DEFAULT_SYNC_ENDPOINT,
  passphrase: "",

  // ── Speech-to-text provider ───────────────────────────────────────────────
  sttProvider: "cloudflare",               // "groq" | "cloudflare"
  cloudflareSttEndpoint: "https://soft-sea-d7c0.seran-dulnath-s-m.workers.dev/transcribe",
  groqSttEnabled: true,                    // fallback when CF fails
  saveAudio: false,                        // never store audio by default
  maxAudioSeconds: 120,

  // ── AI routing ────────────────────────────────────────────────────────────
  aiRoute: "direct",                       // "direct" | "cloudflare-worker" | "ai-gateway"
  cloudflareApiWorkerUrl: "https://kdu-api-worker.seran-dulnath-s-m.workers.dev",              // e.g. https://kdu-api.workers.dev
  aiGatewayUrl: "",
  modelName: "moonshot-v1-8k",
  kimiOnlyWhenNeeded: true,
  maxAiCallsPerDay: 80,                     // 80 calls per day

  // ── Cloud feature flags (all off by default — free tier safe) ────────────
  ragEnabled: false,
  sourceGroundingEnabled: false,
  vectorizeEnabled: false,
  r2StorageEnabled: false,
  d1CloudProgressEnabled: false,

  // ── YouTube support ───────────────────────────────────────────────────────
  youtubeSuggestionsEnabled: false,
  youtubeApiKeyConfigured: false,
  useYouTubeApiSearch: false,
  trustedVideoShelfEnabled: true,
  youtubeSearchCacheDays: 14,

  // ── Focus Clinic ─────────────────────────────────────────────────────────
  focusClinicEnabled: true,
};

export async function hydrateKey(key, fallback) {
  const stored = await idbKeyval.get(key, IDB_STORE);
  if (stored !== undefined) return stored;
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) {
      const legacy = JSON.parse(raw);
      await idbKeyval.set(key, legacy, IDB_STORE);
      return legacy;
    }
  } catch {
    // legacy localStorage is best-effort only
  }
  return fallback;
}

export async function loadSaveState() {
  const DEFAULT_FOCUS_STATE = {
    sessions: {},
    settings: {
      defaultFocusMinutes: 25,
      defaultShortBreakMinutes: 5,
      defaultLongBreakMinutes: 20,
      longBreakEvery: 4,
      strictMode: false,
      soundEnabled: false,
      breakMode: "breathing",
      visualTheme: "clinical-garden",
    }
  };

  const [settings, profile, attempts, notes, seqAnswers, cases, log, weakConcepts, focus] = await Promise.all([
    hydrateKey(KEYS.settings, DEFAULT_SETTINGS),
    hydrateKey(KEYS.profile, DEFAULT_PROFILE),
    hydrateKey(KEYS.attempts, {}),
    hydrateKey(KEYS.notes, {}),
    hydrateKey(KEYS.seqAnswers, {}),
    hydrateKey(KEYS.cases, {}),
    hydrateKey(KEYS.log, []),
    hydrateKey(KEYS.weakConcepts, {}),
    hydrateKey(KEYS.focus, DEFAULT_FOCUS_STATE),
  ]);
  return {
    settings: { ...DEFAULT_SETTINGS, ...(settings || {}) },
    profile: { ...DEFAULT_PROFILE, ...(profile || {}) },
    attempts: attempts || {},
    notes: notes || {},
    seqAnswers: seqAnswers || {},
    cases: cases || {},
    log: Array.isArray(log) ? log : [],
    weakConcepts: weakConcepts || {},
    focus: {
      sessions: { ...(DEFAULT_FOCUS_STATE.sessions), ...((focus && focus.sessions) || {}) },
      settings: { ...(DEFAULT_FOCUS_STATE.settings), ...((focus && focus.settings) || {}) },
    },
  };
}

export function saveKey(name, value) {
  return idbKeyval.set(KEYS[name], value, IDB_STORE);
}

export function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}
