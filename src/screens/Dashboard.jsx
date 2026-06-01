import React from "react";
import { summarizeInventory } from "../data/banks.js";
import { dueItems } from "../practice/srs.js";

export default function Dashboard({ papers, caseBank, profile, attempts, settings, onPractice, onTab, weakConcepts = {}, focus = {} }) {
  const inv = summarizeInventory(papers, caseBank);
  const due = dueItems(attempts).length;
  const days = Math.max(0, Math.ceil((new Date(settings.examDate || "2026-06-14") - new Date()) / 86400000));
  const todayDone = profile.mcqDone || 0;
  const goal = Number(settings.dailyGoal) || 60;
  
  // Calculate weak concept review counts
  const weakCount = Object.keys(weakConcepts || {}).length;

  // Calculate completed focus blocks
  const completedFocusSessions = Object.values(focus?.sessions || {}).filter(s => s.status === "completed").length;

  return (
    <main className="screen scrollable">
      {/* 1. MD3 Hero Card with exam countdown */}
      <section className="dashboard-hero">
        <div className="hero-content">
          <span className="hero-countdown-badge">{days} days remaining</span>
          <h1>KDU Finals Study Hub</h1>
          <p className="hero-subtitle">Optimize every second. Focus on weak concepts, achieve maximum marks.</p>
        </div>
        <div className="hero-actions">
          <button className="primary pill" onClick={onPractice}>
            ⚡ Continue Learning
          </button>
        </div>
      </section>

      {/* 2. Today's Minimum Pass Set tracker */}
      <section className="card pass-set-card">
        <h3>Today's Minimum Pass Set</h3>
        <p className="pass-set-subtitle">Achieve this daily ritual to secure your clinical pass.</p>
        
        <div className="pass-set-item">
          <div className="row between">
            <span className="pass-label">✓ 20 Daily MCQs</span>
            <span className="pass-progress">{todayDone} / 20</span>
          </div>
          <div className="meter thin">
            <span style={{ width: `${Math.min(100, (todayDone / 20) * 100)}%` }} className={todayDone >= 20 ? "completed" : ""} />
          </div>
        </div>

        <div className="pass-set-item margin-top-sm">
          <div className="row between">
            <span className="pass-label">✓ 1 Clinical SEQ or Case</span>
            <span className="pass-progress">{(profile.seqDone || 0) >= 1 ? "1 / 1" : "0 / 1"}</span>
          </div>
          <div className="meter thin">
            <span style={{ width: `${(profile.seqDone || 0) >= 1 ? 100 : 0}%` }} className={(profile.seqDone || 0) >= 1 ? "completed" : ""} />
          </div>
        </div>

        <div className="pass-set-item margin-top-sm">
          <div className="row between">
            <span className="pass-label">✓ Weak Review Clearance</span>
            <span className="pass-progress">{weakCount} weak concepts</span>
          </div>
        </div>
      </section>

      {/* 3. Focus Clinic Quick Start Card */}
      <section className="card focus-quick-start clickable" onClick={() => onTab("focus")}>
        <div className="row between align-center">
          <div>
            <h3>Study Forest</h3>
            <p className="subtitle">Plant a tree, stay focused, and answer MCQs to grow its fruit.</p>
            {completedFocusSessions > 0 && (
              <span className="garden-status-pill">🌳 {completedFocusSessions} Trees Grown</span>
            )}
          </div>
          <span className="arrow-indicator">→</span>
        </div>
      </section>

      {/* 4. MD3 Bento Grid cards */}
      <section className="bento-grid">
        <div className="bento-card med" onClick={() => onTab("papers")}>
          <p className="eyebrow">PRACTICE BANK</p>
          <h2>{inv.mcq}</h2>
          <span>Scored MCQs</span>
        </div>

        <div className="bento-card surg" onClick={() => onTab("papers")}>
          <p className="eyebrow">WRITTEN PREP</p>
          <h2>{inv.seq}</h2>
          <span>SEQ Question Papers</span>
        </div>

        <div className="bento-card obgyn" onClick={() => onTab("cases")}>
          <p className="eyebrow">LIVE OSCE</p>
          <h2>{inv.cases}</h2>
          <span>Clinical Case Sheets</span>
        </div>

        <div className="bento-card psych" onClick={() => onTab("review")}>
          <p className="eyebrow">SRS SCHEDULER</p>
          <h2>{due}</h2>
          <span>Due review questions</span>
        </div>

        <div className="bento-card cardio full-width clickable" onClick={() => onTab("atlas")}>
          <p className="eyebrow">COLLECTION</p>
          <h2>Clinical Topic Atlas</h2>
          <p className="subtitle">Access must-know exam criteria, presentations, and core mechanisms.</p>
        </div>
      </section>

      {/* 5. Weakest System Highlight if weak concepts exist */}
      {weakCount > 0 && (
        <section className="card warning-card clickable" onClick={() => onTab("review")}>
          <h3>⚠️ Weak Spot Clearance Required</h3>
          <p>You have <b>{weakCount}</b> weak topics marked for SRS review. Clear these concepts to secure your marks.</p>
        </section>
      )}
    </main>
  );
}
