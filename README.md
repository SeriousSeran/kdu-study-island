# KDU Study

Clean mobile-first KDU finals trainer for MCQs, SEQs/CQs, live cases, review, and a local knowledge graph.

This is the non-RPG study app. It intentionally preserves the existing KDU save schema so progress can be reused.

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
