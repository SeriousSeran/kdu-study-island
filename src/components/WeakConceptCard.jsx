import React from "react";

/**
 * WeakConceptCard — shows a "Why I got this wrong" breakdown card.
 *
 * Displayed after an incorrect MCQ/SEQ/case attempt.
 * Props:
 *  - weakConcept: WeakConceptRecord from reviewEngine
 *  - onDrill: () => void — jump into SRS drill
 */
export default function WeakConceptCard({ weakConcept, onDrill }) {
  if (!weakConcept) return null;

  return (
    <section className="card weak-concept-card">
      <div className="weak-header">
        <span className="chip kind-chip">{weakConcept.kind}</span>
        <span className="chip subject-chip">{weakConcept.subject}</span>
      </div>

      <div className="ai-block why-wrong">
        <span className="ai-label">Why I got this wrong</span>
        <p>{weakConcept.weakReason}</p>
      </div>

      {weakConcept.recallQ && (
        <div className="ai-block viva-block">
          <span className="ai-label">Next viva question</span>
          <p className="viva-q">{weakConcept.recallQ}</p>
        </div>
      )}

      {weakConcept.linkedTopics?.length > 0 && (
        <div className="ai-block">
          <span className="ai-label">Linked topics to revise</span>
          <div className="chips">
            {weakConcept.linkedTopics.map((t, i) => (
              <span key={i} className="chip topic-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {onDrill && (
        <button className="tonal sm" onClick={onDrill}>
          🔁 Drill this in SRS
        </button>
      )}
    </section>
  );
}
