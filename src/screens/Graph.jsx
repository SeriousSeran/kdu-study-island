import GraphView from "../graph/GraphView.jsx";
import React from "react";

export default function Graph({ graph }) {
  const [query, setQuery] = React.useState("");
  const topics = (graph.nodes || []).filter(n => n.type === "topic" && (!query || n.label.toLowerCase().includes(query.toLowerCase()))).slice(0, 24);
  return (
    <main className="screen">
      <header className="screen-head"><div><p className="eyebrow">Obsidian map</p><h1>Connected topics</h1></div></header>
      <input className="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search ACS, ECG, asthma..." />
      <section className="card"><GraphView graph={graph} selectedTopic={query} onSelectTopic={setQuery} /></section>
      <div className="chips">{topics.map(t => <button key={t.id} onClick={() => setQuery(t.label)}>{t.label}</button>)}</div>
    </main>
  );
}
