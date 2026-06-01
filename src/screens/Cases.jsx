import React from "react";
import { kimiChat } from "../ai/client.js";
import { buildCasePatientPrompt, buildCaseExaminerPrompt } from "../ai/prompts.js";
import { parseAiResponse } from "../ai/parseResponse.js";
import { processCaseResult } from "../practice/reviewEngine.js";
import { useVoiceRecorder } from "../ai/useVoiceRecorder.js";
import AiFeedbackCard from "../components/AiFeedbackCard.jsx";
import WeakConceptCard from "../components/WeakConceptCard.jsx";
import VideoShelf from "../components/resources/VideoShelf.jsx";

// Pull just the presenting complaint out of the hidden case sheet so the list
// tells you what the case is about without spoiling the marking scheme.
function presentingComplaint(text = "") {
  const m = text.match(/P\s*\/\s*C[\s\-:*]+([^\n*]+)/i);
  if (m) return m[1].trim().replace(/\s+/g, " ").slice(0, 80);
  const firstLine = text.split("\n").map(s => s.trim()).find(s => s && !/^hx$/i.test(s));
  return (firstLine || "Clinical case").replace(/^[\*\-\s]+/, "").slice(0, 80);
}

const STEPS = [
  { n: 1, label: "Ask", hint: "History mode: ask the AI patient H/P/C, PMH, drugs, allergies, family/social and review questions." },
  { n: 2, label: "Examine", hint: "Examination mode: tell the examiner exactly what you want to examine and receive findings." },
  { n: 3, label: "DDx chart", hint: "For each differential, write what supports or excludes it." },
  { n: 4, label: "Ix + Mx", hint: "Add investigations and management per differential." },
  { n: 5, label: "Grade", hint: "Submit the transcript and chart for examiner marking." },
];

const CASE_MODES = {
  history: {
    title: "History mode",
    eyebrow: "Ask the patient",
    helper: "Type exactly what you would ask the patient. The AI answers as the patient only.",
    placeholder: "e.g. When did the symptoms start? Any associated fever, vomiting, weight loss, chest pain or SOB?",
    button: "Ask patient",
  },
  exam: {
    title: "Examination mode",
    eyebrow: "Ask the examiner",
    helper: "Type the examination you would perform. The AI gives relevant positive and negative findings like an examiner.",
    placeholder: "e.g. I would examine hydration, pulse, BP, JVP, abdomen and look for pallor or oedema.",
    button: "Request examination findings",
  },
};

const DDX_FIELDS = [
  ["diagnosis", "Differential"],
  ["questions", "Questions to ask"],
  ["examination", "Examination to request"],
  ["investigations", "Investigations"],
  ["management", "Management"],
];

function makeDdxRow(index = 0) {
  return {
    id: `ddx-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    diagnosis: "",
    questions: "",
    examination: "",
    investigations: "",
    management: "",
  };
}

function initialDdxRows() {
  return [0, 1, 2].map(makeDdxRow);
}

export default function Cases({ caseBank, cases, setCases, d3Graph, setD3Graph, settings, addWeakConcept, profile, setProfile }) {
  const [active, setActive] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [caseMode, setCaseMode] = React.useState("history");
  const [text, setText] = React.useState("");
  const [plan, setPlan] = React.useState("");
  const [ddxRows, setDdxRows] = React.useState(() => initialDdxRows());
  const [ai, setAi] = React.useState({ status: "idle", result: null, error: "" });
  const [weakConcept, setWeakConcept] = React.useState(null);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [grading, setGrading] = React.useState(false);
  const { recording, voiceError, toggleRecording } = useVoiceRecorder(spoken => {
    setText(prev => `${prev}${prev ? " " : ""}${spoken}`);
  }, settings);

  const list = caseBank
    .filter(c => !search || `${c.subject} ${c.title} ${c.text}`.toLowerCase().includes(search.toLowerCase()))
    .slice(0, 120);

  const start = casePack => {
    setActive(casePack);
    setMessages([{ role: "patient", content: `Hello doctor. I've come in with ${presentingComplaint(casePack.text)}. Please take my history.` }]);
    setCaseMode("history");
    setPlan("");
    setDdxRows(initialDdxRows());
    setAi({ status: "idle", result: null, error: "" });
    setWeakConcept(null);
    setText("");
  };

  const transcriptText = () => messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const updateDdxRow = (id, field, value) => {
    setDdxRows(prev => prev.map(row => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const addDdxRow = () => setDdxRows(prev => [...prev, makeDdxRow(prev.length)]);

  const removeDdxRow = id => {
    setDdxRows(prev => (prev.length <= 1 ? prev : prev.filter(row => row.id !== id)));
  };

  const useTemplate = (mode, template) => {
    setCaseMode(mode);
    setText(template);
  };

  const buildStructuredPlan = () => {
    const presentation = active ? presentingComplaint(active.text) : "Clinical presentation";
    const filledRows = ddxRows.filter(row => DDX_FIELDS.some(([field]) => row[field]?.trim()));
    const chartText = filledRows.length
      ? filledRows.map((row, index) => [
          `DDx ${index + 1}: ${row.diagnosis || "Not named"}`,
          `Questions: ${row.questions || "Not stated"}`,
          `Examination: ${row.examination || "Not stated"}`,
          `Investigations: ${row.investigations || "Not stated"}`,
          `Management: ${row.management || "Not stated"}`,
        ].join("\n")).join("\n\n")
      : "No differential chart completed.";

    return [
      `Presenting complaint: ${presentation}`,
      `Differential diagnosis chart:\n${chartText}`,
      plan.trim() ? `Final synthesis / consultant presentation:\n${plan.trim()}` : "",
    ].filter(Boolean).join("\n\n");
  };

  const send = async (override = text, mode = caseMode) => {
    if (!override.trim() || !active) return;
    const messageToSend = mode === "exam"
      ? `I am now examining the patient. ${override.trim()} Please give the relevant positive and negative examination findings only.`
      : override.trim();
    const next = [...messages, { role: "user", content: messageToSend }];
    const responseRole = mode === "exam" ? "examiner" : "patient";
    setMessages(next);
    setText("");
    setLoading(true);
    try {
      const systemPrompt = buildCasePatientPrompt(active);
      const reply = await kimiChat([
        systemPrompt,
        ...next.map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
      ]);
      setMessages([...next, { role: responseRole, content: reply }]);
    } catch {
      const fallback = mode === "exam"
        ? "(AI offline) Write the examination you requested in the DDx chart. It will still be saved for review."
        : "(AI offline) Keep taking your history and writing your plan — it will still save for review.";
      setMessages([...next, { role: responseRole, content: fallback }]);
    } finally {
      setLoading(false);
    }
  };

  const grade = async () => {
    if (!active) return;
    setGrading(true);
    setAi({ status: "loading", result: null, error: "" });
    try {
      const messages = buildCaseExaminerPrompt(active, transcriptText(), buildStructuredPlan());
      const rawText = await kimiChat([messages[0], messages[1]], { maxTokens: 1600 });
      const parsed = parseAiResponse(rawText);
      setAi({ status: "done", result: parsed, error: "" });

      // Run review engine
      const plainFeedback = parsed.ok ? parsed.json.verdict : parsed.plain;
      const { weakConcept: wc, d3Graph: updatedGraph } = processCaseResult(
        active, plainFeedback, parsed.ok ? parsed.json : null, d3Graph
      );
      setWeakConcept(wc);
      if (wc && addWeakConcept) addWeakConcept(wc);
      if (setD3Graph && updatedGraph) setD3Graph(updatedGraph);
    } catch (err) {
      setAi({ status: "error", result: null, error: err.message });
    } finally {
      setGrading(false);
    }
  };

  const save = () => {
    if (!active) return;
    const feedbackText = ai.result?.ok
      ? ai.result.json.verdict
      : ai.result?.plain || "Saved for review.";
    setCases(prev => ({
      ...prev,
      [active.id]: {
        transcript: transcriptText(),
        plan: buildStructuredPlan(),
        feedback: feedbackText,
        at: Date.now(),
        title: active.title,
        subject: active.subject,
      },
    }));
  };

  if (active) {
    const modeCopy = CASE_MODES[caseMode];
    const presentation = presentingComplaint(active.text);

    return (
      <main className="screen case-workspace">
        <header className="screen-head">
          <div><p className="eyebrow">{active.subject} · live OSCE</p><h1>{active.title}</h1></div>
          <button className="ghost" onClick={() => setActive(null)}>Exit</button>
        </header>

        <section className="card case-guide-card">
          <p className="eyebrow">Do this in order</p>
          <h3>Presentation → ask → examine → DDx chart → grade</h3>
          <p><b>History mode</b> talks to the patient. <b>Examination mode</b> talks to the examiner. The chart below is your map for what to ask, examine, investigate and manage for each differential.</p>
        </section>

        <ol className="case-steps case-stepper">
          {STEPS.map(s => <li key={s.n} title={s.hint}><b>{s.n}</b> {s.label}</li>)}
        </ol>

        <section className="chat card case-chat">
          {messages.map((m, i) => (
            <p key={i} className={m.role === "user" ? "you" : m.role === "examiner" ? "examiner" : "patient"}>
              {m.content}
            </p>
          ))}
          {loading && <p className={caseMode === "exam" ? "examiner typing" : "patient typing"}>…</p>}
        </section>

        <section className="card case-mode-card">
          <div className="case-mode-tabs" role="tablist" aria-label="Case interaction mode">
            <button className={caseMode === "history" ? "active" : ""} onClick={() => setCaseMode("history")}>History</button>
            <button className={caseMode === "exam" ? "active" : ""} onClick={() => setCaseMode("exam")}>Examination</button>
          </div>

          <div className="case-mode-copy">
            <p className="eyebrow">{modeCopy.eyebrow}</p>
            <h3>{modeCopy.title}</h3>
            <p>{modeCopy.helper}</p>
          </div>

          <div className="quick-row case-quick-row">
            <button onClick={() => useTemplate("history", "Tell me about the onset, duration, progression, severity and associated symptoms.")}>H/P/C template</button>
            <button onClick={() => useTemplate("exam", "I would perform general examination, vitals and the relevant system examination.")}>Exam template</button>
          </div>

          <button className={`voice ${recording ? "recording" : ""}`} onClick={toggleRecording}>
            {recording ? "Stop voice input" : "🎙 Record voice input"}
          </button>
          {voiceError && <p className="error-text">{voiceError}</p>}
          <textarea className="answer-box small" value={text} onChange={e => setText(e.target.value)} placeholder={modeCopy.placeholder} />
          <button className="primary full" onClick={() => send()} disabled={loading}>
            {loading ? "Waiting for reply…" : modeCopy.button}
          </button>
        </section>

        <section className="card ddx-builder-card">
          <p className="eyebrow">Differential chart</p>
          <h3>Use this as your asking map</h3>
          <p className="case-presentation"><b>Presentation:</b> {presentation}</p>

          <div className="ddx-chart-list">
            {ddxRows.map((row, index) => (
              <article className="ddx-row-card" key={row.id}>
                <div className="ddx-row-head">
                  <b>DDx {index + 1}</b>
                  <button className="ghost sm" onClick={() => removeDdxRow(row.id)} disabled={ddxRows.length <= 1}>Remove</button>
                </div>
                {DDX_FIELDS.map(([field, label]) => (
                  <label className="ddx-field" key={field}>
                    <span>{label}</span>
                    <textarea
                      rows={field === "diagnosis" ? 1 : 2}
                      value={row[field]}
                      onChange={e => updateDdxRow(row.id, field, e.target.value)}
                      placeholder={field === "diagnosis" ? "e.g. Acute coronary syndrome" : `What to write for ${label.toLowerCase()}...`}
                    />
                  </label>
                ))}
              </article>
            ))}
          </div>

          <button className="tonal full" onClick={addDdxRow}>+ Add another differential</button>

          <label className="ddx-final-note">
            <span>Final synthesis / consultant presentation</span>
            <textarea className="answer-box small" value={plan} onChange={e => setPlan(e.target.value)} placeholder="One-line diagnosis, key evidence, immediate investigations, management and safety-netting..." />
          </label>
        </section>

        <section className="card grade-card">
          <p className="eyebrow">Grade</p>
          <h3>Submit the full case</h3>
          <p>The examiner will mark your history, examination requests, differential chart, investigations and management against the hidden case sheet.</p>
          <button className="primary full" onClick={grade} disabled={grading}>
            {grading ? "Examiner is marking…" : "Grade my case"}
          </button>
        </section>

        <AiFeedbackCard
          aiResult={ai.result}
          toolSuggestions={[]}
          loading={ai.status === "loading" || grading}
          error={ai.status === "error" ? ai.error : ""}
          onRetry={grade}
        />

        {weakConcept && <WeakConceptCard weakConcept={weakConcept} />}

        {settings?.trustedVideoShelfEnabled && (
          <VideoShelf
            subject={active?.subject || "Medicine"}
            topic={active?.title || ""}
            customVideos={profile?.customVideos || []}
            onAddCustomVideo={newVideo => {
              if (setProfile) {
                setProfile(prev => ({
                  ...prev,
                  customVideos: [...(prev.customVideos || []), newVideo]
                }));
              }
            }}
          />
        )}

        <button className="tonal full" onClick={save}>Save transcript, DDx chart &amp; mark</button>
      </main>
    );
  }

  return (
    <main className="screen">
      <header className="screen-head"><div><p className="eyebrow">Live OSCE</p><h1>Cases</h1></div><span>{Object.keys(cases).length} done</span></header>
      <section className="card how-card case-how-card">
        <b>How it works</b>
        <p>Pick a case. First ask history questions. Then switch to Examination mode and request findings. Then fill the DDx chart: for each diagnosis, write questions, examination, investigations and management. Finally grade it.</p>
      </section>
      <input className="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search cases: chest pain, COPD, fever..." />
      <div className="list">
        {list.map(c => (
          <article className="card paper" key={c.id}>
            <div>
              <p className="eyebrow">{c.subject}{cases[c.id] ? " · done" : ""}</p>
              <h3>{c.title}</h3>
              <p>Presents with: {presentingComplaint(c.text)}</p>
            </div>
            <button className="tonal" onClick={() => start(c)}>{cases[c.id] ? "Redo" : "Start"}</button>
          </article>
        ))}
      </div>
    </main>
  );
}
