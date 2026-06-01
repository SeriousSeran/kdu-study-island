# KDU Finals Island

KDU Finals Island is a mobile-first finals study app with a tropical survival-island shell. It keeps the serious KDU MBBS finals workflow—MCQs, SEQs/CQs, live cases, review, sync, and local knowledge graph—inside a calm, premium island interface built for daily exam survival.

The product direction is exam-focused first and game-flavoured second: daily tasks feel like survival missions, weak topics become Danger Zones, SRS reviews return like threats to clear, MCQs act as supplies, written/case work helps build the island, and the Study Forest shows steady progress.

## What It Does

- KDU MCQ practice with SBR and multiple-response true/false/skip marking.
- MR scoring uses KDU-style `+1` correct, `-1` wrong, `0` skipped.
- Spoken SEQ/CQ answer capture through Groq Whisper proxy, with editable transcript and AI marking hook.
- Live OSCE-style cases where the AI can act as patient and examiner.
- Review queue from weak items and SRS due dates.
- Local Obsidian-like knowledge graph from question stems, tags, notes, mistakes, cases, and RAG chunks.
- Offline-first IndexedDB persistence.
- Cloudflare Worker sync with the existing save blob/passphrase contract.
- Manual JSON export/import for a second progress safety net.

## Product Direction

KDU Finals Island should feel like a serious final exam survival island rather than a generic RPG. The interface can be playful and beautiful, but every feature must protect exam usefulness, legibility, and fast study flow.

Visual and UX goals:

- Tropical pixel-art island aesthetic with original assets only.
- Ocean blue/teal backgrounds, lush green forest accents, warm parchment cards, sand/beige panels, coral/red Danger Zones, and purple SRS cues.
- Rounded, mobile-first cards with chunky but readable headings.
- Study screens that remain accessible, text-friendly, and quick to use on a phone.
- Game-feel used for motivation, rewards, and context—not to hide or complicate medical study content.

## Architecture

- **React** handles study screens, forms, lists, MCQs, SEQs/CQs, cases, SRS, settings, sync, and other text-heavy flows.
- **KAPLAY** is reserved for lightweight living island scenes, hero panels, forest growth moments, reward animations, and small game-feel interactions.
- **IndexedDB/offline-first data** remains the default persistence model so progress is available locally and can continue to sync/export safely.

## Phase 1 Scope

Phase 1 is a safe KDU Finals Island shell, not a full RPG. It should deliver:

1. A Vite + React + KAPLAY scaffold that remains easy to maintain.
2. A KDU Finals Island home screen shell that establishes the tropical survival-island direction.
3. A dashboard that preserves the current study structure:
   - Exam countdown.
   - Continue Learning.
   - Today's Survival Tasks.
   - 20 Daily MCQs.
   - 1 Clinical SEQ or Case.
   - Weak Review Clearance / Danger Zones.
   - Study Forest card.
   - Practice Bank stats.
   - Written Prep stats.
   - Live OSCE stats.
   - SRS Scheduler stats.
   - Clinical Topic Atlas.
   - Bottom nav: Today, Papers, Cases, Atlas, Forest, Graph, Review, Sync.
4. A small starter asset system using SVG or CSS pixel-art placeholders before heavier art pipelines.
5. No loss of existing progress, banks, sync behavior, or storage migration path.

## Progress Compatibility

The app deliberately uses the existing IndexedDB database and keys:

- Database/store: `kdu-finals-rpg` / `keyval`
- `kdu_v2_settings`
- `kdu_v2_profile`
- `kdu_v2_attempts`
- `kdu_v2_notes`
- `kdu_v2_seq`
- `kdu_v2_cases`
- `kdu_v2_log`

Existing `kdu_v2_*` save keys remain protected. Do not rename, delete, overwrite, or casually change their schema without an explicit migration plan, import/export safety, and a rollback path.

If this app runs on the same browser origin as the old app, local progress can appear automatically. If it runs on a new origin, use the same Cloudflare sync endpoint and passphrase in Settings.

Settings also includes a local backup panel. Export creates a `kdu-study-backup-*.json` file containing the same KDU v2 progress records plus non-secret settings. Import merges that file with the browser's existing progress. The sync passphrase is never written into the backup file.

## Local Development

Install dependencies:

```powershell
npm install
```

Run the app:

```powershell
npm run dev
```

Open:

```text
http://localhost:4175
```

In this Codex workspace, dependency installation may be blocked. The local fallback scripts use the parent workspace's installed Vite:

```powershell
npm.cmd run build:local
```

## Environment

Create `.env` from `.env.example`:

```text
MOONSHOT_API_KEY=...
GROQ_API_KEY=...
```

The browser never receives these keys. Vite proxies inject them server-side:

- `/api/moonshot/*`
- `/api/groq/*`

## Verification

```powershell
npm run test
npm run build
```

Local fallback in this workspace:

```powershell
node --test tests\*.test.mjs
npm.cmd run build:local
```

Runtime smoke:

```powershell
node scripts/smoke-server.mjs
```

## Deployment

Any static host that supports Vite output can serve this app.

Build command:

```text
npm run build
```

Publish directory:

```text
dist
```

Cloudflare Pages settings:

```text
Framework preset: Vite
Build command: npm run build
Build output directory: dist
Node.js version: 22.12.0
```

The repo includes both `.nvmrc` and `.node-version` so Cloudflare Pages does not fall back to an older Node runtime that cannot run the current Vite toolchain.

Required environment variables:

```text
MOONSHOT_API_KEY
GROQ_API_KEY
```

## Production Notes

- Service worker registers only in production builds.
- `public/sw.js` caches the app shell and data banks for offline reload.
- `force-graph` is not required in the first slice because package installation was restricted; `src/graph/GraphView.jsx` provides a dependency-free graph view.
- The app is a PWA/web app. A native Android wrapper can be added later if needed.
