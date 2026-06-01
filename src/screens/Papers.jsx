export default function Papers({ papers, attempts, settings, setSettings, onStartPaper }) {
  const subjects = ["All", ...Array.from(new Set(papers.map(p => p.subject).filter(Boolean)))];
  const filtered = papers.filter(p => (settings.subject === "All" || p.subject === settings.subject));

  return (
    <main className="screen">
      <header className="screen-head">
        <div><p className="eyebrow">Inventory</p><h1>Papers</h1></div>
        <select value={settings.subject} onChange={e => setSettings(s => ({ ...s, subject: e.target.value }))}>
          {subjects.map(s => <option key={s}>{s}</option>)}
        </select>
      </header>
      <div className="list">
        {filtered.map(paper => {
          const done = (paper.questions || []).filter(q => attempts[q.id]).length;
          const total = paper.questions?.length || 0;
          return (
            <article className="card paper" key={paper.id}>
              <div>
                <p className="eyebrow">{paper.subject} · {paper.kind}</p>
                <h3>{paper.title}</h3>
                <p>{done}/{total} attempted</p>
              </div>
              <button className="tonal" onClick={() => onStartPaper(paper)}>{done ? "Resume" : "Start"}</button>
            </article>
          );
        })}
      </div>
    </main>
  );
}
