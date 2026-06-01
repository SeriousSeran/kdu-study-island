import { dueItems, SRS_INTERVALS } from "../practice/srs.js";
import { dueWeakConcepts } from "../practice/reviewEngine.js";

function dueLabel(srs, now, fallbackDue) {
  const due = srs?.due || fallbackDue;
  if (!due) return "new";
  const diff = due - now;
  if (diff <= 0) return "due now";
  const days = Math.ceil(diff / 86400000);
  return days <= 1 ? "due tomorrow" : `in ${days}d`;
}

function attemptMeta(item) {
  return `Best ${item.best || 0}% · tries ${item.tries || 0} · box ${item.srs?.box ?? 0}`;
}

export default function Review({ attempts = {}, onDrill, weakConcepts = {}, onClearWeakConcept }) {
  const now = Date.now();
  const due = dueItems(attempts, now);
  const weakAttempts = Object.values(attempts).filter(a => a.weak);
  const dangerZones = dueWeakConcepts(weakConcepts, attempts, now).slice(0, 80);
  const attemptList = [...due, ...weakAttempts.filter(item => !due.find(d => d.id === item.id))].slice(0, 80);
  const mcqDue = due.filter(d => d.kind === "MCQ").length + dangerZones.filter(d => d.kind === "MCQ").length;
  const hasReviewWork = attemptList.length || dangerZones.length;

  return (
    <main className="screen">
      <header className="screen-head">
        <div><p className="eyebrow">Spaced repetition</p><h1>Review</h1></div>
        <button className="primary pill" onClick={onDrill} disabled={!hasReviewWork}>Drill {mcqDue || ""}</button>
      </header>
      <p className="helper-text">
        {due.length} due · {weakAttempts.length} weak attempts · {dangerZones.length} danger zones.
        Cards resurface on a {SRS_INTERVALS.join("/")}-day schedule.
      </p>

      <div className="list">
        {dangerZones.map(item => (
          <article className="card weak-concept-card" key={`danger-${item.id}`}>
            <div className="row between">
              <p className="eyebrow">Danger zone · {item.subject} · {item.kind}</p>
              <span className={`due-tag ${item.due <= now ? "hot" : ""}`}>{dueLabel(item.srs, now, item.due)}</span>
            </div>
            <h3>{item.stem}</h3>
            <p>{item.weakReason}</p>
            {item.recallQ && <p className="helper-text">Viva check: {item.recallQ}</p>}
            {item.linkedTopics?.length > 0 && (
              <div className="chips">
                {item.linkedTopics.slice(0, 4).map(topic => <span className="chip topic-chip" key={topic}>{topic}</span>)}
              </div>
            )}
            <div className="row between align-center">
              <small>Seen {item.count || 1}× · source {item.sourceItemId}</small>
              <button className="tonal sm" onClick={() => onClearWeakConcept?.(item.id)}>Clear zone</button>
            </div>
          </article>
        ))}

        {attemptList.map(item => (
          <article className="card" key={`attempt-${item.id}`}>
            <div className="row between">
              <p className="eyebrow">{item.subject} · {item.kind}</p>
              <span className={`due-tag ${item.srs?.due <= now ? "hot" : ""}`}>{dueLabel(item.srs, now)}</span>
            </div>
            <h3>{item.stem}</h3>
            <p>{attemptMeta(item)}</p>
          </article>
        ))}
        {!hasReviewWork && <section className="card empty"><h2>No due review</h2><p>Do a fresh paper and weak items will appear here as clearable danger zones.</p></section>}
      </div>
    </main>
  );
}
