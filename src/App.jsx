import React from "react";
import { buildPapersFromGlobals } from "./data/banks.js";
import ErrorBoundary from "./ErrorBoundary.jsx";
import { buildKnowledgeGraph } from "./graph/knowledgeGraph.js";
import { backupFileName, buildPortableBackup, parsePortableBackup } from "./storage/backup.js";
import { buildSaveBlob, hashKey, mergeBlob } from "./storage/sync.js";
import { DEFAULT_PROFILE, DEFAULT_SETTINGS, loadSaveState, saveKey } from "./storage/saveStore.js";
import { dueItems } from "./practice/srs.js";
import Dashboard from "./screens/Dashboard.jsx";
import Papers from "./screens/Papers.jsx";
import McqPractice from "./screens/McqPractice.jsx";
import SeqPractice from "./screens/SeqPractice.jsx";
import Cases from "./screens/Cases.jsx";
import Review from "./screens/Review.jsx";
import Settings from "./screens/Settings.jsx";
import TopicAtlas from "./screens/TopicAtlas.jsx";
import FocusClinic from "./screens/FocusClinic.jsx";
import { IslandNavIcon } from "./components/IslandNavIcons.jsx";

// The graph renderer is visually rich — only load it when its tab is opened.
const Graph = React.lazy(() => import("./screens/Graph.jsx"));

const TABS = [
  { id: "home", label: "Today", icon: "sunrise" },
  { id: "papers", label: "Papers", icon: "papers" },
  { id: "cases", label: "Cases", icon: "cases" },
  { id: "atlas", label: "Atlas", icon: "atlas" },
  { id: "focus", label: "Forest", icon: "forest" },
  { id: "graph", label: "Graph", icon: "graph" },
  { id: "review", label: "Review", icon: "review" },
  { id: "settings", label: "Sync", icon: "sync" },
];

function firstMcqPaper(papers) {
  return papers.find(p => p.kind === "MCQ" && p.questions?.length) || null;
}

export default function App() {
  const papers = React.useMemo(() => buildPapersFromGlobals(window), []);
  const caseBank = React.useMemo(() => window.KDU_CASE_BANK || [], []);
  const ragChunks = React.useMemo(() => window.KDU_RAG_INDEX || [], []);
  const [tab, setTab] = React.useState("home");
  const [activePaper, setActivePaper] = React.useState(null);
  const [settings, setSettings] = React.useState(DEFAULT_SETTINGS);
  const [profile, setProfile] = React.useState(DEFAULT_PROFILE);
  const [attempts, setAttempts] = React.useState({});
  const [notes, setNotes] = React.useState({});
  const [seqAnswers, setSeqAnswers] = React.useState({});
  const [cases, setCases] = React.useState({});
  const [log, setLog] = React.useState([]);
  const [weakConcepts, setWeakConcepts] = React.useState({});
  const [focus, setFocus] = React.useState({ sessions: {}, settings: {} });
  const [ready, setReady] = React.useState(false);
  const [syncStatus, setSyncStatus] = React.useState("off");
  // D3 semantic graph — in-memory only, rebuilt from AI responses each session.
  // Not persisted to IndexedDB (no schema change).
  const [d3Graph, setD3Graph] = React.useState({ nodes: [], links: [] });

  React.useEffect(() => {
    let cancelled = false;
    loadSaveState().then(state => {
      if (cancelled) return;
      setSettings(state.settings);
      setProfile(state.profile);
      setAttempts(state.attempts);
      setNotes(state.notes);
      setSeqAnswers(state.seqAnswers);
      setCases(state.cases);
      setLog(state.log);
      setWeakConcepts(state.weakConcepts);
      setFocus(state.focus);
      setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => { if (ready) saveKey("settings", settings); }, [ready, settings]);
  React.useEffect(() => { if (ready) saveKey("profile", profile); }, [ready, profile]);
  React.useEffect(() => { if (ready) saveKey("attempts", attempts); }, [ready, attempts]);
  React.useEffect(() => { if (ready) saveKey("notes", notes); }, [ready, notes]);
  React.useEffect(() => { if (ready) saveKey("seqAnswers", seqAnswers); }, [ready, seqAnswers]);
  React.useEffect(() => { if (ready) saveKey("cases", cases); }, [ready, cases]);
  React.useEffect(() => { if (ready) saveKey("log", log); }, [ready, log]);
  React.useEffect(() => { if (ready) saveKey("weakConcepts", weakConcepts); }, [ready, weakConcepts]);
  React.useEffect(() => { if (ready) saveKey("focus", focus); }, [ready, focus]);

  const graph = React.useMemo(() => buildKnowledgeGraph({ papers, attempts, notes, cases, ragChunks }), [papers, attempts, notes, cases, ragChunks]);

  const addWeakConcept = React.useCallback((wc) => {
    if (!wc) return;
    setWeakConcepts(prev => {
      const existing = prev[wc.id];
      const count = (existing?.count || 0) + 1;
      return {
        ...prev,
        [wc.id]: {
          id: wc.id,
          sourceItemId: wc.id,
          kind: wc.kind,
          subject: wc.subject,
          topic: wc.linkedTopics?.[0] || wc.subject || "General",
          weakness: wc.weakReason,
          mistakePattern: wc.weakReason,
          recallQuestion: wc.recallQ,
          answer: "",
          linkedTopics: wc.linkedTopics || [],
          graphUpdates: wc.graphUpdates || [],
          due: wc.srs?.due || (Date.now() + 86400000),
          createdAt: existing?.createdAt || Date.now(),
          updatedAt: Date.now(),
          count,
        }
      };
    });
  }, []);

  const [focusPresetData, setFocusPresetData] = React.useState(null);

  const handleStartFocus = (taskKind, subject, topic) => {
    setFocusPresetData({ taskKind, subject, topic });
    setTab("focus");
  };

  const handleFocusLog = (session) => {
    setProfile(prev => ({
      ...prev,
      xp: (prev.xp || 0) + (session.plannedMinutes * 2),
    }));
  };

  const startPaper = paper => {
    if (!paper) return;
    setActivePaper(paper);
    setTab(paper.kind === "SEQ" ? "seq" : "mcq");
  };

  const continuePractice = () => startPaper(activePaper || firstMcqPaper(papers));

  // Map every MCQ question id back to its full question object so the Review
  // tab can re-quiz due/weak items instead of just listing them.
  const mcqLookup = React.useMemo(() => {
    const map = new Map();
    for (const paper of papers) {
      if (paper.kind !== "MCQ") continue;
      for (const question of paper.questions || []) map.set(question.id, question);
    }
    return map;
  }, [papers]);

  const startDrill = () => {
    const candidates = [...dueItems(attempts), ...Object.values(attempts).filter(a => a.weak)];
    const seen = new Set();
    const drillQuestions = [];
    for (const item of candidates) {
      if (item.kind !== "MCQ" || seen.has(item.id) || !mcqLookup.has(item.id)) continue;
      seen.add(item.id);
      drillQuestions.push(mcqLookup.get(item.id));
    }
    if (!drillQuestions.length) { continuePractice(); return; }
    startPaper({ id: "srs-drill", kind: "MCQ", subject: "Mix", intake: "drill", title: `SRS Drill · ${drillQuestions.length} due`, questions: drillQuestions });
  };

  const recordAttempt = (question, paper, result, srs) => {
    const now = Date.now();
    setAttempts(prev => ({
      ...prev,
      [question.id]: {
        id: question.id,
        paperId: paper.id,
        subject: question.subject || paper.subject,
        intake: question.intake || paper.intake,
        kind: "MCQ",
        stem: question.stem,
        tags: question.tags || [],
        weak: result.correct !== true,
        lastAt: now,
        tries: (prev[question.id]?.tries || 0) + 1,
        best: Math.max(prev[question.id]?.best || 0, result.percent || 0),
        lastPercent: result.percent,
        correct: result.correct,
        needsReview: false,
        wrongLines: result.wrongLines || [],
        skippedLines: result.skippedLines || [],
        srs,
      },
    }));
    setProfile(prev => ({ ...prev, total: (prev.total || 0) + 1, mcqDone: (prev.mcqDone || 0) + 1, xp: (prev.xp || 0) + (result.correct ? 12 : 4) }));
    setLog(prev => [...prev, { id: question.id, kind: "MCQ", subject: paper.subject, correct: result.correct, percent: result.percent, at: now }].slice(-2000));
  };

  const recordSeq = (question, paper, percent, srs) => {
    const now = Date.now();
    setAttempts(prev => ({
      ...prev,
      [question.id]: {
        id: question.id,
        paperId: paper.id,
        subject: question.subject || paper.subject,
        intake: question.intake || paper.intake,
        kind: "SEQ",
        stem: question.stem,
        weak: percent == null || percent < 70,
        lastAt: now,
        tries: (prev[question.id]?.tries || 0) + 1,
        best: Math.max(prev[question.id]?.best || 0, percent || 0),
        lastPercent: percent,
        correct: percent != null ? percent >= 60 : null,
        needsReview: percent == null,
        srs,
      },
    }));
    setProfile(prev => ({ ...prev, seqDone: (prev.seqDone || 0) + 1, xp: (prev.xp || 0) + 8 }));
  };

  const doSync = async () => {
    if (!settings.syncEndpoint || !settings.passphrase) {
      setSyncStatus("off");
      return;
    }
    setSyncStatus("syncing");
    try {
      const key = await hashKey(settings.passphrase);
      const local = { profile, attempts, notes, seqAnswers, cases, log };
      const endpoint = settings.syncEndpoint.replace(/\/$/, "");
      const loadRes = await fetch(`${endpoint}/load?key=${encodeURIComponent(key)}`);
      const remote = loadRes.ok ? await loadRes.json() : null;
      const merged = mergeBlob(remote, local);
      setProfile(merged.profile || profile);
      setAttempts(merged.attempts || attempts);
      setNotes(merged.notes || notes);
      setSeqAnswers(merged.seqAnswers || seqAnswers);
      setCases(merged.cases || cases);
      setLog(merged.log || log);
      await fetch(`${endpoint}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, data: buildSaveBlob(merged) }),
      });
      setSyncStatus("ok");
    } catch {
      setSyncStatus("offline");
    }
  };

  const exportBackup = () => {
    const backup = buildPortableBackup({ settings, profile, attempts, notes, seqAnswers, cases, log });
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = backupFileName();
    link.click();
    URL.revokeObjectURL(url);
    setSyncStatus("exported");
  };

  const importBackup = async file => {
    if (!file) return;
    setSyncStatus("importing");
    try {
      const imported = parsePortableBackup(await file.text());
      const local = { profile, attempts, notes, seqAnswers, cases, log };
      const merged = mergeBlob(imported.data, local);
      setSettings(prev => ({ ...prev, ...(imported.settings || {}), passphrase: prev.passphrase || "" }));
      setProfile(merged.profile || profile);
      setAttempts(merged.attempts || attempts);
      setNotes(merged.notes || notes);
      setSeqAnswers(merged.seqAnswers || seqAnswers);
      setCases(merged.cases || cases);
      setLog(merged.log || log);
      setSyncStatus("imported");
    } catch {
      setSyncStatus("offline");
    }
  };

  if (!ready) {
    return <main className="app"><section className="surface"><h1>Loading KDU Study</h1><p>Reading existing progress...</p></section></main>;
  }

  const screen = {
    home: <Dashboard papers={papers} caseBank={caseBank} profile={profile} attempts={attempts} settings={settings} onPractice={continuePractice} onTab={setTab} weakConcepts={weakConcepts} focus={focus} />,
    papers: <Papers papers={papers} attempts={attempts} settings={settings} setSettings={setSettings} onStartPaper={startPaper} />,
    mcq: <McqPractice paper={activePaper?.kind === "MCQ" ? activePaper : firstMcqPaper(papers)} attempts={attempts} notes={notes} setNotes={setNotes} recordAttempt={recordAttempt} onPickPaper={() => setTab("papers")} d3Graph={d3Graph} setD3Graph={setD3Graph} onDrill={startDrill} addWeakConcept={addWeakConcept} profile={profile} setProfile={setProfile} settings={settings} />,
    seq: <SeqPractice papers={papers} seqAnswers={seqAnswers} setSeqAnswers={setSeqAnswers} recordSeq={recordSeq} d3Graph={d3Graph} setD3Graph={setD3Graph} onDrill={startDrill} settings={settings} addWeakConcept={addWeakConcept} profile={profile} setProfile={setProfile} />,
    cases: <Cases caseBank={caseBank} cases={cases} setCases={setCases} d3Graph={d3Graph} setD3Graph={setD3Graph} settings={settings} addWeakConcept={addWeakConcept} profile={profile} setProfile={setProfile} />,
    atlas: <TopicAtlas attempts={attempts} onDrill={startDrill} onTab={setTab} onStartFocus={handleStartFocus} />,
    focus: <FocusClinic focus={focus} setFocus={setFocus} onTab={setTab} onLogOutput={handleFocusLog} presetData={focusPresetData} setPresetData={setFocusPresetData} papers={papers} attempts={attempts} recordAttempt={recordAttempt} />,
    graph: <Graph graph={graph} />,
    review: <Review attempts={attempts} onDrill={startDrill} weakConcepts={weakConcepts} />,
    settings: <Settings settings={settings} setSettings={setSettings} syncStatus={syncStatus} onSync={doSync} onExport={exportBackup} onImport={importBackup} />,
  }[tab];

  return (
    <main className="app">
      <ErrorBoundary resetKey={tab}>
        <React.Suspense fallback={<section className="card empty"><p>Loading…</p></section>}>
          {screen}
        </React.Suspense>
      </ErrorBoundary>
      <nav className="bottom-nav">
        {TABS.map(({ id, label, icon }) => (
          <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)} aria-label={label}>
            <IslandNavIcon name={icon} />
            <span className="bottom-nav-label">{label}</span>
          </button>
        ))}
      </nav>
    </main>
  );
}
