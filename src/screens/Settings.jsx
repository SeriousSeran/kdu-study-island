import React from "react";

/**
 * Settings & Sync screen.
 *
 * Sections:
 *  1. Profile + Cloudflare sync (existing)
 *  2. Speech-to-text provider (new)
 *  3. AI routing (new)
 *  4. Cloud features (new, all gated with off defaults)
 *  5. Local backup (existing)
 */
export default function Settings({ settings, setSettings, syncStatus, onSync, onExport, onImport }) {
  const set = (key, value) => setSettings(s => ({ ...s, [key]: value }));

  return (
    <main className="screen">
      <header className="screen-head">
        <div><p className="eyebrow">Progress</p><h1>Settings &amp; Sync</h1></div>
        <span className={`sync ${syncStatus}`}>{syncStatus}</span>
      </header>

      {/* ── 1. Profile + Cloudflare Sync ──────────────────────────────── */}
      <section className="card form">
        <h3 className="settings-section-title">Profile &amp; Sync</h3>
        <label>Name
          <input value={settings.name || ""} onChange={e => set("name", e.target.value)} />
        </label>
        <label>Daily goal (MCQs)
          <input type="number" value={settings.dailyGoal || 60} onChange={e => set("dailyGoal", Number(e.target.value))} />
        </label>
        <label>Exam date
          <input type="date" value={settings.examDate || "2026-06-14"} onChange={e => set("examDate", e.target.value)} />
        </label>
        <label>Cloudflare sync endpoint
          <input value={settings.syncEndpoint || ""} onChange={e => set("syncEndpoint", e.target.value)} placeholder="https://kdu-sync.workers.dev" />
        </label>
        <label>Passphrase
          <input type="password" value={settings.passphrase || ""} onChange={e => set("passphrase", e.target.value)} />
        </label>
        <button className="primary full" onClick={onSync}>Sync now</button>
      </section>

      {/* ── 2. Speech-to-Text ─────────────────────────────────────────── */}
      <section className="card form">
        <h3 className="settings-section-title">Speech-to-Text</h3>
        <p className="helper-text settings-note">
          Audio is transcribed by the selected provider. Audio is <b>not stored</b> by default.
          Only the text transcript is used for AI marking.
        </p>
        <label>Provider
          <select value={settings.sttProvider || "groq"} onChange={e => set("sttProvider", e.target.value)}>
            <option value="groq">Groq Whisper (default)</option>
            <option value="cloudflare">Cloudflare Workers AI</option>
          </select>
        </label>
        {settings.sttProvider === "cloudflare" && (
          <label>Cloudflare STT endpoint
            <input
              value={settings.cloudflareSttEndpoint || ""}
              onChange={e => set("cloudflareSttEndpoint", e.target.value)}
              placeholder="https://your-worker.workers.dev/transcribe"
            />
          </label>
        )}
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.groqSttEnabled !== false}
            onChange={e => set("groqSttEnabled", e.target.checked)}
          />
          Fallback to Groq if Cloudflare fails
        </label>
        <label>Max recording length (seconds)
          <input type="number" value={settings.maxAudioSeconds || 120} onChange={e => set("maxAudioSeconds", Number(e.target.value))} />
        </label>
      </section>

      {/* ── 3. AI Routing ─────────────────────────────────────────────── */}
      <section className="card form">
        <h3 className="settings-section-title">AI Routing</h3>
        <p className="helper-text settings-note">
          API keys are never exposed in the browser. They are injected server-side by the proxy or Worker.
        </p>
        <label>AI route
          <select value={settings.aiRoute || "direct"} onChange={e => set("aiRoute", e.target.value)}>
            <option value="direct">Direct (Vite proxy — dev only)</option>
            <option value="cloudflare-worker">Cloudflare API Worker</option>
            <option value="ai-gateway">Cloudflare AI Gateway</option>
          </select>
        </label>
        {settings.aiRoute === "cloudflare-worker" && (
          <label>Cloudflare API Worker URL
            <input
              value={settings.cloudflareApiWorkerUrl || ""}
              onChange={e => set("cloudflareApiWorkerUrl", e.target.value)}
              placeholder="https://kdu-api.your-subdomain.workers.dev"
            />
          </label>
        )}
        {settings.aiRoute === "ai-gateway" && (
          <label>AI Gateway URL
            <input
              value={settings.aiGatewayUrl || ""}
              onChange={e => set("aiGatewayUrl", e.target.value)}
              placeholder="https://gateway.ai.cloudflare.com/v1/..."
            />
          </label>
        )}
        <label>Model name
          <input value={settings.modelName || "moonshot-v1-8k"} onChange={e => set("modelName", e.target.value)} />
        </label>
        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={settings.kimiOnlyWhenNeeded !== false}
            onChange={e => set("kimiOnlyWhenNeeded", e.target.checked)}
          />
          Only call AI when needed (token saving)
        </label>
        <label>Max AI calls per day (0 = unlimited)
          <input type="number" value={settings.maxAiCallsPerDay || 0} onChange={e => set("maxAiCallsPerDay", Number(e.target.value))} />
        </label>
      </section>

      {/* ── 4. Cloud Features (off by default — free-tier safe) ──────── */}
      <section className="card form">
        <h3 className="settings-section-title">Cloud Features</h3>
        <p className="helper-text settings-note">
          All cloud features are <b>off by default</b>. Enable only when your Worker is configured.
          The app works fully offline without any of these.
        </p>
        <label className="settings-toggle">
          <input type="checkbox" checked={!!settings.ragEnabled} onChange={e => set("ragEnabled", e.target.checked)} />
          RAG / semantic context retrieval (Vectorize)
        </label>
        <label className="settings-toggle">
          <input type="checkbox" checked={!!settings.vectorizeEnabled} onChange={e => set("vectorizeEnabled", e.target.checked)} />
          Vectorize (requires Cloudflare paid plan)
        </label>
        <label className="settings-toggle">
          <input type="checkbox" checked={!!settings.r2StorageEnabled} onChange={e => set("r2StorageEnabled", e.target.checked)} />
          R2 file storage (requires R2 bucket configured)
        </label>
        <label className="settings-toggle">
          <input type="checkbox" checked={!!settings.d1CloudProgressEnabled} onChange={e => set("d1CloudProgressEnabled", e.target.checked)} />
          D1 cloud progress (structured DB, requires D1 binding)
        </label>
      </section>

      {/* ── 5. Local Backup ───────────────────────────────────────────── */}
      <section className="card form">
        <h3 className="settings-section-title">Local Backup</h3>
        <p>Export a JSON copy before switching devices, clearing browser data, or testing a new deployment.</p>
        <div className="button-row">
          <button className="tonal" onClick={onExport}>Export progress</button>
          <label className="import-button">
            Import progress
            <input type="file" accept="application/json,.json" onChange={e => onImport(e.target.files?.[0])} />
          </label>
        </div>
        <p className="helper-text">Backups keep study progress and settings, but <b>never export the passphrase</b>.</p>
      </section>
    </main>
  );
}
