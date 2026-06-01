import React from "react";
import { emptyAnswer, LETTERS, answerKeyText, scoreQuestion } from "../practice/scoring.js";
import { srsQualityFromResult, srsUpdate } from "../practice/srs.js";

const SUBJECTS = ["Medicine", "Surgery", "Paediatrics", "O&G", "Psychiatry"];

// ───────── Tree visuals ─────────
// growth: 0..1 fraction of the focus block elapsed. fruit = correct MCQs this block.
function GrowingTree({ growth, fruit = 0, wilting = false }) {
  const g = Math.max(0, Math.min(1, growth));
  // Trunk grows up; canopy scales in once the sapling stage is reached.
  const trunkH = 20 + g * 70;          // 20 → 90
  const canopy = Math.max(0, (g - 0.15) / 0.85); // appears after first sprout
  const canopyR = canopy * 52;
  const baseY = 150;
  const trunkTop = baseY - trunkH;
  const fruitDots = [];
  const shown = Math.min(fruit, 9);
  for (let i = 0; i < shown; i++) {
    const angle = (i / 9) * Math.PI * 2;
    fruitDots.push({
      cx: 80 + Math.cos(angle) * canopyR * 0.6,
      cy: trunkTop - 6 + Math.sin(angle) * canopyR * 0.6,
    });
  }
  return (
    <svg viewBox="0 0 160 160" className={`forest-tree-svg ${wilting ? "wilting" : ""}`} role="img" aria-label="Your growing study tree">
      {/* mound */}
      <ellipse cx="80" cy="150" rx="46" ry="9" fill="#bbf7d0" />
      {/* trunk */}
      <rect x="75" y={trunkTop} width="10" height={trunkH} rx="4" fill="#92591f" />
      {/* canopy */}
      {canopy > 0 && (
        <g style={{ transition: "all 0.6s ease" }}>
          <circle cx="80" cy={trunkTop - 6} r={canopyR} fill={wilting ? "#a3a380" : "#22c55e"} opacity="0.95" />
          <circle cx={80 - canopyR * 0.55} cy={trunkTop + 4} r={canopyR * 0.65} fill={wilting ? "#9a9a72" : "#16a34a"} opacity="0.9" />
          <circle cx={80 + canopyR * 0.55} cy={trunkTop + 4} r={canopyR * 0.65} fill={wilting ? "#9a9a72" : "#16a34a"} opacity="0.9" />
        </g>
      )}
      {/* seed shows before sprout */}
      {canopy <= 0 && <circle cx="80" cy={baseY - 16} r="6" fill="#92591f" />}
      {/* fruit = correct MCQs */}
      {fruitDots.map((d, i) => (
        <circle key={i} cx={d.cx} cy={d.cy} r="4.5" fill="#f43f5e" stroke="#fff" strokeWidth="1.2" />
      ))}
    </svg>
  );
}

function treeEmoji(session) {
  if (session.withered) return "🍂";
  const m = session.actualMinutes || 0;
  if (m >= 45) return "🌲";
  if (m >= 25) return "🌳";
  if (m >= 10) return "🌿";
  return "🌱";
}

// ───────── Inline MCQ player (no AI/video — keeps the focus block fast) ─────────
function FocusMcq({ entry, attempts, recordAttempt, onAnswered }) {
  const question = entry?.q;
  const [answer, setAnswer] = React.useState(() => emptyAnswer(question));
  const [result, setResult] = React.useState(null);

  React.useEffect(() => {
    setAnswer(emptyAnswer(question));
    setResult(null);
  }, [question?.id]);

  if (!question) return null;
  const answered = !!result;
  const explanation = question.expl || question.explanation || "";

  const submit = () => {
    if (answered) return;
    const next = scoreQuestion(question, answer);
    setResult(next);
    const srs = srsUpdate(attempts?.[question.id]?.srs, srsQualityFromResult(next));
    recordAttempt(question, entry.paper, next, srs);
    onAnswered(next);
  };

  return (
    <section className="card focus-mcq fade-q" key={question.id}>
      <p className="eyebrow">{question.subject || entry.paper.subject} · MCQ</p>
      <h3 className="focus-mcq-stem">{question.stem}</h3>

      {question.type === "mr" ? (
        <div className="tf-list">
          {LETTERS.filter(l => question.answer?.[l] != null || question.options?.[l]).map(letter => {
            const key = question.answer?.[letter];
            const picked = answer.mr?.[letter];
            const rowClass = answered
              ? result.wrongLines?.includes(letter) ? "bad" : (key != null ? "good" : "")
              : "";
            return (
              <div className={`tf-row ${rowClass}`} key={letter}>
                <p><b>{letter}.</b> {question.options?.[letter]}{answered && key != null ? <em className="key-tag">{key ? "True" : "False"}</em> : null}</p>
                <div className="seg">
                  {[true, false, null].map(value => (
                    <button
                      key={String(value)}
                      disabled={answered}
                      className={picked === value ? "on" : ""}
                      onClick={() => setAnswer(a => ({ mr: { ...(a.mr || {}), [letter]: value } }))}
                    >
                      {value === true ? "T" : value === false ? "F" : "—"}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="choices">
          {Object.entries(question.options || {}).map(([key, text]) => {
            const isAns = answered && question.answer === key;
            const isWrongPick = answered && answer.selected === key && question.answer !== key;
            return (
              <button
                key={key}
                disabled={answered}
                className={`${answer.selected === key ? "selected" : ""} ${isAns ? "good" : ""} ${isWrongPick ? "bad" : ""}`}
                onClick={() => setAnswer({ selected: key })}
              >
                <b>{key}</b>{text}
              </button>
            );
          })}
        </div>
      )}

      {!answered ? (
        <button className="primary full" onClick={submit}>Submit</button>
      ) : (
        <>
          <div className={`card feedback ${result.correct ? "good" : "bad"}`}>
            <b>{result.correct ? "Correct — the tree fruits 🍎" : result.percent == null ? "Self-mark" : `${result.percent}%`}</b>
            <p>Key: {answerKeyText(question)}</p>
            {explanation ? <p className="focus-expl">{explanation}</p> : null}
          </div>
          <button className="primary full" onClick={() => onAnswered(null, true)}>Next question →</button>
        </>
      )}
    </section>
  );
}

export default function FocusClinic({ focus, setFocus, onTab, onLogOutput, presetData, setPresetData, papers = [], attempts = {}, recordAttempt }) {
  const { sessions = {}, settings = {} } = focus;

  // Active session state
  const [activeSession, setActiveSession] = React.useState(null);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [timerRunning, setTimerRunning] = React.useState(false);
  const [tabHiddenCount, setTabHiddenCount] = React.useState(0);
  const [wilting, setWilting] = React.useState(false);
  const [phase, setPhase] = React.useState("setup"); // "setup" | "focus" | "break" | "summary"

  // Setup fields
  const [taskKind, setTaskKind] = React.useState("MCQ");
  const [subject, setSubject] = React.useState("Medicine");
  const [topic, setTopic] = React.useState("");
  const [duration, setDuration] = React.useState(25);
  const [energyBefore, setEnergyBefore] = React.useState("Normal");

  // Live output
  const [mcqCorrect, setMcqCorrect] = React.useState(0);
  const [mcqCount, setMcqCount] = React.useState(0);
  const [seqCount, setSeqCount] = React.useState(0);
  const [caseCount, setCaseCount] = React.useState(0);

  // Inline MCQ queue
  const [queue, setQueue] = React.useState([]);
  const [qIndex, setQIndex] = React.useState(0);

  // Box breathing
  const [breathingText, setBreathingText] = React.useState("Inhale");
  const [breathingSeconds, setBreathingSeconds] = React.useState(4);

  // Apply a preset coming from the Topic Atlas ("study this now")
  React.useEffect(() => {
    if (presetData) {
      if (presetData.taskKind) setTaskKind(presetData.taskKind);
      if (presetData.subject) setSubject(presetData.subject);
      if (presetData.topic) setTopic(presetData.topic);
      if (setPresetData) setPresetData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetData]);

  // Flatten all trusted-key MCQs once.
  const mcqPool = React.useMemo(() => {
    const pool = [];
    for (const p of papers) {
      if (p.kind !== "MCQ") continue;
      for (const q of p.questions || []) {
        if (q.answer == null) continue;
        pool.push({ q, paper: p });
      }
    }
    return pool;
  }, [papers]);

  // Tab-leave withers the current tree (Forest mechanic) until you return.
  React.useEffect(() => {
    const onVis = () => {
      if (phase === "focus") {
        if (document.hidden) {
          setTabHiddenCount(c => c + 1);
          setWilting(true);
        } else {
          setWilting(false);
        }
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [phase]);

  // Main timer tick
  React.useEffect(() => {
    let timerId = null;
    if (timerRunning && timeLeft > 0) {
      timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerRunning && timeLeft === 0) {
      setTimerRunning(false);
      if (phase === "focus") completeFocusSession();
      else if (phase === "break") setPhase("summary");
    }
    return () => { if (timerId) clearInterval(timerId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerRunning, timeLeft, phase]);

  // Box breathing cycle
  React.useEffect(() => {
    let id = null;
    if (phase === "break" && settings.breakMode === "breathing") {
      id = setInterval(() => {
        setBreathingSeconds(s => {
          if (s <= 1) {
            setBreathingText(t =>
              t === "Inhale" ? "Hold (Full)" : t === "Hold (Full)" ? "Exhale" : t === "Exhale" ? "Hold (Empty)" : "Inhale"
            );
            return 4;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => { if (id) clearInterval(id); };
  }, [phase, settings.breakMode]);

  const buildQueue = () => {
    const wanted = mcqPool.filter(e => (e.q.subject || e.paper.subject) === subject);
    const base = wanted.length >= 5 ? wanted : mcqPool;
    // Prioritise weak / unattempted, then everything else.
    const weak = [], fresh = [], rest = [];
    for (const e of base) {
      const a = attempts[e.q.id];
      if (a?.weak) weak.push(e);
      else if (!a) fresh.push(e);
      else rest.push(e);
    }
    const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
    return [...shuffle(weak), ...shuffle(fresh), ...shuffle(rest)];
  };

  const startSession = () => {
    setActiveSession({
      id: `focus-${Date.now()}`,
      taskKind,
      subject,
      topic: topic.trim() || "General Study",
      plannedMinutes: duration,
      startedAt: Date.now(),
      energyBefore,
    });
    setTabHiddenCount(0);
    setWilting(false);
    setMcqCorrect(0);
    setMcqCount(0);
    setSeqCount(0);
    setCaseCount(0);
    setQueue(buildQueue());
    setQIndex(0);
    setTimeLeft(duration * 60);
    setPhase("focus");
    setTimerRunning(true);
  };

  const pauseTimer = () => setTimerRunning(false);
  const resumeTimer = () => setTimerRunning(true);

  // Called by FocusMcq. result==null + advance===true means "go to next question".
  const onMcqAnswered = (result, advance = false) => {
    if (advance) {
      setQIndex(i => i + 1);
      return;
    }
    if (!result) return;
    setMcqCount(c => c + 1);
    if (result.correct) setMcqCorrect(c => c + 1);
  };

  const completeFocusSession = () => {
    setTimerRunning(false);
    setPhase("break");
    setTimeLeft((settings.defaultShortBreakMinutes || 5) * 60);
  };

  const skipBreak = () => {
    setTimerRunning(false);
    setPhase("summary");
  };

  const plantTree = (status, moodAfter, energyAfter) => {
    const actualMinutes = Math.max(0, duration - Math.max(0, Math.ceil(timeLeft / 60)));
    const finished = {
      ...activeSession,
      actualMinutes,
      endedAt: Date.now(),
      status,
      withered: status !== "completed",
      tabHiddenCount,
      moodAfter,
      energyAfter,
      mcqCorrect,
      outputSummary: {
        mcqDone: mcqCount,
        mcqCorrect,
        seqDone: seqCount,
        casesDone: caseCount,
      },
    };
    setFocus(prev => ({ ...prev, sessions: { ...prev.sessions, [finished.id]: finished } }));
    if (status === "completed" && onLogOutput) onLogOutput(finished);
    setPhase("setup");
    setActiveSession(null);
  };

  const abandonSession = () => {
    if (window.confirm("Leave now and your tree withers. A 🍂 will be planted in your forest as an honest record. Abandon?")) {
      setTimerRunning(false);
      plantTree("abandoned");
    }
  };

  const forestSessions = Object.values(sessions).sort((a, b) => (a.startedAt || 0) - (b.startedAt || 0));
  const completedCount = forestSessions.filter(s => s.status === "completed").length;
  const totalMinutes = forestSessions.filter(s => s.status === "completed").reduce((sum, s) => sum + (s.actualMinutes || 0), 0);
  const totalMcq = forestSessions.reduce((sum, s) => sum + (s.outputSummary?.mcqDone || 0), 0);

  const formatTime = secs => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const growth = activeSession ? 1 - (timeLeft / (activeSession.plannedMinutes * 60)) : 0;
  const currentEntry = queue[qIndex];

  const renderForest = () => (
    <div className="forest-plot">
      <div className="row between align-center">
        <h4>🌳 My Study Forest</h4>
        <span className="forest-stat-pill">{completedCount} trees · {totalMinutes} min · {totalMcq} MCQs</span>
      </div>
      <div className="forest-grid">
        {forestSessions.length > 0 ? (
          forestSessions.slice(-40).map(s => (
            <div
              key={s.id}
              className={`forest-tree animated-bud ${s.withered ? "withered" : ""}`}
              title={`${s.subject} · ${s.topic} · ${s.actualMinutes || 0} min · ${s.outputSummary?.mcqCorrect || 0}/${s.outputSummary?.mcqDone || 0} MCQ`}
            >
              {treeEmoji(s)}
            </div>
          ))
        ) : (
          <p className="empty-garden-text">Your forest is bare. Plant your first tree by finishing a focus block — and answer MCQs to grow its fruit!</p>
        )}
      </div>
    </div>
  );

  return (
    <main className="screen scrollable">
      <header className="page-header">
        <h1>Study Forest</h1>
        <p className="subtitle">Plant a tree, stay focused, answer MCQs — it grows fruit for every one you get right. Leave the tab and it wilts.</p>
      </header>

      {phase === "setup" && (
        <div className="setup-container">
          <section className="card focus-form">
            <h3>Plant a Focus Tree</h3>

            <div className="form-group">
              <label>What grows this tree</label>
              <select value={taskKind} onChange={e => setTaskKind(e.target.value)}>
                <option value="MCQ">Practice MCQs (live, in-app)</option>
                <option value="SEQ/CQ">Review SEQ / CQ</option>
                <option value="Case">Live Case Sim</option>
                <option value="Review">Weak Concept Review</option>
                <option value="Custom">Custom Revision</option>
              </select>
            </div>

            <div className="form-group">
              <label>Clinical Subject</label>
              <select value={subject} onChange={e => setSubject(e.target.value)}>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Topic / Disease (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Hyperkalaemia, Preeclampsia"
                value={topic}
                onChange={e => setTopic(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>How long will you focus?</label>
              <div className="block-preset-grid">
                {[
                  { m: 10, l: "Sapling" },
                  { m: 25, l: "Young Tree" },
                  { m: 45, l: "Tall Tree" },
                  { m: 60, l: "Old Oak" },
                ].map(preset => (
                  <button
                    key={preset.m}
                    type="button"
                    className={`preset-btn ${duration === preset.m ? "active" : ""}`}
                    onClick={() => setDuration(preset.m)}
                  >
                    <b>{preset.m} min</b>
                    <span>{preset.l}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group row between">
              <label>My Current Energy</label>
              <select value={energyBefore} onChange={e => setEnergyBefore(e.target.value)}>
                <option value="Low">Low</option>
                <option value="Normal">Normal</option>
                <option value="High">High</option>
              </select>
            </div>

            <button className="primary full pill margin-top-lg" onClick={startSession}>
              🌱 Plant &amp; Start Focus
            </button>
          </section>

          {renderForest()}
        </div>
      )}

      {phase === "focus" && activeSession && (
        <>
          <section className="card timer-container focus-live-card">
            <p className={`eyebrow ${wilting ? "clinical-pulsar" : ""}`}>
              {wilting ? "⚠ TREE WILTING — COME BACK!" : "FOCUS LIVE 🌱"}
            </p>
            <GrowingTree growth={growth} fruit={mcqCorrect} wilting={wilting} />
            <div className="focus-live-meta">
              <span className="time-string">{formatTime(timeLeft)}</span>
              <span className="planned-time">{activeSession.subject} · {activeSession.topic}</span>
            </div>
            <div className="forest-mini-stats">
              <span>🍎 {mcqCorrect} fruit</span>
              <span>📝 {mcqCount} answered</span>
              {tabHiddenCount > 0 && <span className="bad-stat">🥀 {tabHiddenCount} wilt{tabHiddenCount > 1 ? "s" : ""}</span>}
            </div>
            <div className="timer-controls">
              {timerRunning ? (
                <button className="tonal pill" onClick={pauseTimer}>Pause</button>
              ) : (
                <button className="primary pill" onClick={resumeTimer}>Resume</button>
              )}
              <button className="bad pill" onClick={abandonSession}>Give up</button>
            </div>
          </section>

          {currentEntry ? (
            <FocusMcq
              entry={currentEntry}
              attempts={attempts}
              recordAttempt={recordAttempt}
              onAnswered={onMcqAnswered}
            />
          ) : (
            <section className="card empty">
              <p>No more MCQs in this set — keep your tree alive until the timer ends, or log other work below.</p>
            </section>
          )}

          <section className="card padding-sm">
            <h4>Other output this block</h4>
            <div className="focus-output-grid">
              <div className="output-row">
                <span>SEQs evaluated:</span>
                <div className="counter-row">
                  <button onClick={() => setSeqCount(c => Math.max(0, c - 1))}>-</button>
                  <span>{seqCount}</span>
                  <button onClick={() => setSeqCount(c => c + 1)}>+</button>
                </div>
              </div>
              <div className="output-row">
                <span>OSCE cases simulated:</span>
                <div className="counter-row">
                  <button onClick={() => setCaseCount(c => Math.max(0, c - 1))}>-</button>
                  <span>{caseCount}</span>
                  <button onClick={() => setCaseCount(c => c + 1)}>+</button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {phase === "break" && (
        <div className="break-container card">
          <p className="eyebrow">YOUR TREE IS GROWING 🌳</p>
          <h2>Take a Short Rest</h2>

          <div className="timer-display-circle rest-circle">
            <span className="time-string">{formatTime(timeLeft)}</span>
            <span>Break remaining</span>
          </div>

          {settings.breakMode === "breathing" && (
            <div className="box-breathing-widget">
              <h5>Interactive Box Breathing</h5>
              <div className="breathing-circle-scale">
                <span className="breathing-state">{breathingText}</span>
                <span className="breathing-seconds">{breathingSeconds}s</span>
              </div>
              <p className="breathing-hint">Inhale (4s) → Hold (4s) → Exhale (4s) → Hold (4s)</p>
            </div>
          )}

          <div className="timer-controls margin-top-md">
            <button className="primary pill" onClick={skipBreak}>Skip break</button>
          </div>
        </div>
      )}

      {phase === "summary" && activeSession && (
        <div className="summary-container card">
          <div className="summary-tree">{mcqCorrect >= 8 ? "🌲" : mcqCorrect >= 3 ? "🌳" : "🌿"}</div>
          <h2>Tree Planted!</h2>
          <p className="subtitle">You protected your attention and grew {mcqCorrect} {mcqCorrect === 1 ? "fruit" : "fruits"}. Added to your forest.</p>

          <div className="bento-summary-grid margin-top-md">
            <div className="summary-stat-box">
              <h3>{mcqCorrect}/{mcqCount}</h3>
              <span>MCQs correct</span>
            </div>
            <div className="summary-stat-box">
              <h3>{Math.max(0, duration - Math.max(0, Math.ceil(timeLeft / 60)))}</h3>
              <span>Minutes focused</span>
            </div>
            <div className="summary-stat-box">
              <h3>{seqCount}</h3>
              <span>SEQs evaluated</span>
            </div>
            <div className="summary-stat-box">
              <h3>{caseCount}</h3>
              <span>OSCE cases run</span>
            </div>
            <div className="summary-stat-box full-width">
              <span>Focus quality:</span>
              <p>Times you left the tab: <b>{tabHiddenCount}</b>{tabHiddenCount === 0 ? " — perfect focus! 🌟" : ""}</p>
            </div>
          </div>

          <div className="satisfaction-form card margin-top-md">
            <h4>How is your mental state now?</h4>
            <div className="form-group row between">
              <label>Energy After</label>
              <select id="energyAfter">
                <option value="Refreshed">Refreshed</option>
                <option value="Normal">Normal</option>
                <option value="Tired">Tired</option>
              </select>
            </div>
            <div className="form-group row between">
              <label>Mood After</label>
              <select id="moodAfter">
                <option value="Calm">Calm</option>
                <option value="Focused">Focused</option>
                <option value="Exhausted">Exhausted</option>
              </select>
            </div>

            <button
              className="primary full pill margin-top-md"
              onClick={() => {
                const energyAfter = document.getElementById("energyAfter")?.value || "Normal";
                const moodAfter = document.getElementById("moodAfter")?.value || "Calm";
                plantTree("completed", moodAfter, energyAfter);
              }}
            >
              🌳 Add Tree to My Forest
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
