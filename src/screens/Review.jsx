import { dueItems, SRS_INTERVALS } from "../practice/srs.js";

function dueLabel(srs, now) {
  if (!srs?.due) return "new";
  const diff = srs.due - now;
  if (diff <= 0) return "due now";
  const days = Math.ceil(diff / 86400000);
  return days <= 1 ? "due tomorrow" : `in ${days}d`;
}

export default function Review({ attempts, onDrill }) {
  const now = Date.now();
  const due = dueItems(attempts, now);
  const weak = Object.values(attempts).filter(a => a.weak);
  const list = [...due, ...weak.filter(item => !due.find(d => d.id === item.id))].slice(0, 80);
  const mcqDue = due.filter(d => d.kind === "MCQ").length;

  return (
    <main className="screen">
      <header className="screen-head">
        <div><p className="eyebrow">Spaced repetition</p><h1>Review</h1></div>
        <button className="primary pill" onClick={onDrill} disabled={!list.length}>Drill {mcqDue || ""}</button>
      </header>
      <p className="helper-text">{due.length} due · {weak.length} weak. Cards resurface on a {SRS_INTERVALS.join("/")}-day schedule.</p>
      <div className="list">
        {list.map(item => (
          <article className="card" key={item.id}>
            <div className="row between">
              <p className="eyebrow">{item.subject} · {item.kind}</p>
              <span className={`due-tag ${item.srs?.due <= now ? "hot" : ""}`}>{dueLabel(item.srs, now)}</span>
            </div>
            <h3>{item.stem}</h3>
            <p>Best {item.best || 0}% · tries {item.tries || 0} · box {item.srs?.box ?? 0}</p>
          </article>
        ))}
        {!list.length && <section className="card empty"><h2>No due review</h2><p>Do a fresh paper and weak items will appear here.</p></section>}
      </div>
    </main>
  );
}
