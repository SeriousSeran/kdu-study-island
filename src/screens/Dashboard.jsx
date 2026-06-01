import React from "react";
import { summarizeInventory } from "../data/banks.js";
import { dueItems } from "../practice/srs.js";
import { activeWeakConceptCount } from "../practice/reviewEngine.js";
import IslandHero from "../components/IslandHero.jsx";

export default function Dashboard({ papers, caseBank, profile, attempts, settings, onPractice, onTab, weakConcepts = {}, focus = {} }) {
  const inv = summarizeInventory(papers, caseBank);
  const due = dueItems(attempts).length;
  const days = Math.max(0, Math.ceil((new Date(settings.examDate || "2026-06-14") - new Date()) / 86400000));
  const todayDone = profile.mcqDone || 0;
  const mcqPercent = Math.min(100, (todayDone / 20) * 100);
  const seqComplete = (profile.seqDone || 0) >= 1;
  const weakCount = activeWeakConceptCount(weakConcepts, attempts);
  const completedFocusSessions = Object.values(focus?.sessions || {}).filter(s => s.status === "completed").length;
  const safeDay = todayDone >= 20 && seqComplete && weakCount === 0;

  return (
    <main className="screen scrollable island-dashboard">
      <section className="island-top-card">
        <div className="island-copy">
          <span className="island-badge">Final boss in {days} days</span>
          <h1>KDU Finals Island</h1>
          <p>Survive today: collect MCQ supplies, run one clinic case, clear danger zones, and grow the Study Forest.</p>
          <button className="primary pill island-cta" onClick={onPractice}>Continue Learning</button>
        </div>
        <IslandHero days={days} mcqProgress={mcqPercent} seqComplete={seqComplete} weakCount={weakCount} focusTrees={completedFocusSessions} />
      </section>

      <section className={`card survival-card ${safeDay ? "safe" : ""}`}>
        <div className="row between align-center">
          <div>
            <p className="eyebrow">TODAY'S SURVIVAL TASKS</p>
            <h3>{safeDay ? "Safe Day badge secured" : "Minimum pass ritual"}</h3>
          </div>
          <span className="safe-day-badge">{safeDay ? "🏝️ Safe Day" : "⚕️ On duty"}</span>
        </div>

        <SurvivalTask
          label="20 Daily MCQs"
          theme="supplies"
          value={`${Math.min(todayDone, 20)} / 20`}
          progress={mcqPercent}
          onClick={() => onTab("papers")}
        />
        <SurvivalTask
          label="1 Clinical SEQ or Case"
          theme="clinic"
          value={seqComplete ? "1 / 1" : "0 / 1"}
          progress={seqComplete ? 100 : 0}
          onClick={() => onTab("cases")}
        />
        <SurvivalTask
          label="Weak Review Clearance"
          theme="danger"
          value={weakCount ? `${weakCount} zones` : "clear"}
          progress={weakCount ? 30 : 100}
          onClick={() => onTab("review")}
        />
      </section>

      <section className="island-building-grid">
        <BuildingCard icon="🥥" title="MCQ Supplies" value={inv.mcq} label="scored questions" onClick={() => onTab("papers")} />
        <BuildingCard icon="📜" title="SEQ Hut" value={inv.seq} label="written papers" onClick={() => onTab("papers")} />
        <BuildingCard icon="🩺" title="Clinic Cases" value={inv.cases} label="live OSCE sheets" onClick={() => onTab("cases")} />
        <BuildingCard icon="🟣" title="SRS Enemies" value={due} label="due reviews" onClick={() => onTab("review")} />
      </section>

      <section className="card forest-card clickable" onClick={() => onTab("focus")}>
        <div>
          <p className="eyebrow">STUDY FOREST</p>
          <h3>{completedFocusSessions || 0} focus trees grown</h3>
          <p className="subtitle">Plant focus blocks. Each completed session makes the island feel more alive.</p>
        </div>
        <span className="arrow-indicator">→</span>
      </section>

      <section className="card atlas-card clickable" onClick={() => onTab("atlas")}>
        <p className="eyebrow">CLINICAL TOPIC ATLAS</p>
        <h3>Open the island map</h3>
        <p className="subtitle">Move through Medicine finals topics by systems, weak mechanisms, and exam patterns.</p>
      </section>

      {weakCount > 0 && (
        <section className="card warning-card clickable" onClick={() => onTab("review")}>
          <h3>Danger zone active</h3>
          <p><b>{weakCount}</b> weak concepts are still roaming the island. Clear them before the final boss exam.</p>
        </section>
      )}
    </main>
  );
}

function SurvivalTask({ label, value, progress, theme, onClick }) {
  return (
    <button className={`survival-task ${theme}`} onClick={onClick}>
      <span>{label}</span>
      <b>{value}</b>
      <i><em style={{ width: `${Math.min(100, progress)}%` }} /></i>
    </button>
  );
}

function BuildingCard({ icon, title, value, label, onClick }) {
  return (
    <button className="building-card" onClick={onClick}>
      <span className="building-icon">{icon}</span>
      <b>{value}</b>
      <strong>{title}</strong>
      <small>{label}</small>
    </button>
  );
}
