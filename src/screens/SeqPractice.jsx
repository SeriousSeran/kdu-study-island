import React from "react";
import { kimiChat } from "../ai/client.js";
import { buildSeqTutorPrompt } from "../ai/prompts.js";
import { parseAiResponse } from "../ai/parseResponse.js";
import { suggestTools } from "../ai/toolPlanner.js";
import { processSeqResult } from "../practice/reviewEngine.js";
import { normalize } from "../data/normalizer.js";
import { useVoiceRecorder } from "../ai/useVoiceRecorder.js";
import { srsQualityFromPercent, srsUpdate } from "../practice/srs.js";
import AiFeedbackCard from "../components/AiFeedbackCard.jsx";
import WeakConceptCard from "../components/WeakConceptCard.jsx";
import VideoShelf from "../components/resources/VideoShelf.jsx";

export default function SeqPractice({ papers, seqAnswers, setSeqAnswers, recordSeq, d3Graph, setD3Graph, onDrill, settings, addWeakConcept, profile, setProfile }) {
  const seqPapers = papers.filter(p => p.kind === "SEQ" && p.questions?.length);
  const [paperId, setPaperId] = React.useState(seqPapers[0]?.id || "");
  const [index, setIndex] = React.useState(0);
  const paper = seqPapers.find(p => p.id === paperId) || seqPapers[0];
  const question = paper?.questions?.[index] || paper?.questions?.[0];
  const saved = seqAnswers[question?.id] || {};
  const [answer, setAnswer] = React.useState(saved.answer || "");
  const [mark, setMark] = React.useState(saved.mark || "");
  const [ai, setAi] = React.useState({ status: "idle", result: null, error: "" });
  const [weakConcept, setWeakConcept] = React.useState(null);
  const { recording, voiceError, toggleRecording } = useVoiceRecorder(text => {
    setAnswer(prev => `${prev}${prev ? "\n" : ""}${text}`);
  }, settings);

  React.useEffect(() => {
    if (!question) return;
    const nextSaved = seqAnswers[question.id] || {};
    setAnswer(nextSaved.answer || "");
    setMark(nextSaved.mark || "");
    setAi({ status: "idle", result: null, error: "" });
    setWeakConcept(null);
  }, [question?.id, seqAnswers]);

  if (!question) return <main className="screen empty"><h1>CQ/SEQ</h1><p>No SEQ bank loaded.</p></main>;

  const item = normalize({ ...question, kind: "seq" });
  const toolSuggestions = suggestTools(item);

  const save = () => {
    const percent = mark ? Math.round((Number(mark) / Number(question.marks || 10)) * 100) : null;
    const srs = srsUpdate(undefined, srsQualityFromPercent(percent));
    const rec = { answer, mark, feedback: "", updatedAt: Date.now() };
    setSeqAnswers(prev => ({ ...prev, [question.id]: rec }));
    recordSeq(question, paper, percent, srs);

    const { weakConcept: wc, d3Graph: updatedGraph } = processSeqResult(item, percent, undefined, null, d3Graph);
    setWeakConcept(wc);
    if (wc && addWeakConcept) addWeakConcept(wc);
    if (setD3Graph && updatedGraph) setD3Graph(updatedGraph);
  };

  const aiMark = async () => {
    setAi({ status: "loading", result: null, error: "" });
    try {
      const messages = buildSeqTutorPrompt(item, answer, mark);
      const text = await kimiChat(messages, { maxTokens: 1200 });
      const parsed = parseAiResponse(text);
      setAi({ status: "done", result: parsed, error: "" });

      // If AI gave us structured JSON, run review engine with it
      if (parsed.ok) {
        const percent = mark ? Math.round((Number(mark) / Number(question.marks || 10)) * 100) : null;
        const { weakConcept: wc, d3Graph: updatedGraph } = processSeqResult(
          item, percent, undefined, parsed.json, d3Graph
        );
        setWeakConcept(wc);
        if (wc && addWeakConcept) addWeakConcept(wc);
        if (setD3Graph && updatedGraph) setD3Graph(updatedGraph);

        // Persist AI feedback text into seqAnswers
        const feedbackText = parsed.json.verdict || parsed.plain || "";
        setSeqAnswers(prev => ({
          ...prev,
          [question.id]: { ...(prev[question.id] || {}), feedback: feedbackText, updatedAt: Date.now() },
        }));
      }
    } catch (err) {
      setAi({ status: "error", result: null, error: err.message });
    }
  };

  const handleToolAction = (suggestion) => {
    const query = encodeURIComponent(suggestion.query || "");
    if (suggestion.tool === "retrieve_learning_video") {
      window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noopener");
    } else if (suggestion.tool === "retrieve_guideline") {
      window.open(`https://www.nice.org.uk/search?q=${query}`, "_blank", "noopener");
    }
  };

  // Display subquestions from either subs (legacy) or subquestions (normalized)
  const subs = question.subs ?? question.subquestions ?? [];

  return (
    <main className="screen">
      <p className="eyebrow">{paper.subject} · spoken answer</p>
      <section className="card form">
        <label>Paper
          <select value={paper.id} onChange={e => { setPaperId(e.target.value); setIndex(0); }}>
            {seqPapers.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </label>
        <label>Question
          <select value={question.id} onChange={e => setIndex(Math.max(0, paper.questions.findIndex(q => q.id === e.target.value)))}>
            {paper.questions.map((q, i) => <option key={q.id} value={q.id}>Question {i + 1}</option>)}
          </select>
        </label>
      </section>
      <section className="card question-card">
        <h2>{question.stem}</h2>
        {subs.map((s, i) => <p key={i}><b>{s.label}</b> {s.prompt} ({s.marks} marks)</p>)}
      </section>
      <button className={`voice ${recording ? "recording" : ""}`} onClick={toggleRecording}>
        {recording ? "Stop recording" : "Record spoken answer"}
      </button>
      {voiceError && <p className="error-text">{voiceError}</p>}
      <textarea className="answer-box" value={answer} onChange={e => setAnswer(e.target.value)} placeholder="Speak/read aloud, then keep or edit the transcript here..." />
      <div className="row">
        <input value={mark} onChange={e => setMark(e.target.value)} placeholder={`Mark / ${question.marks || 10}`} />
        <button className="tonal" onClick={aiMark} disabled={ai.status === "loading"}>
          {ai.status === "loading" ? "Marking..." : "AI mark"}
        </button>
      </div>

      <AiFeedbackCard
        aiResult={ai.result}
        toolSuggestions={toolSuggestions}
        onToolAction={handleToolAction}
        loading={ai.status === "loading"}
        error={ai.status === "error" ? ai.error : ""}
        onRetry={aiMark}
      />

      {weakConcept && <WeakConceptCard weakConcept={weakConcept} onDrill={onDrill} />}

      {settings?.trustedVideoShelfEnabled && (
        <VideoShelf
          subject={question.subject}
          topic={question.tags?.[0] || ""}
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

      <button className="primary full" onClick={save}>Save SEQ</button>
      <div className="quick-row">
        <button disabled={index === 0} onClick={() => setIndex(i => Math.max(0, i - 1))}>Previous</button>
        <button disabled={index >= paper.questions.length - 1} onClick={() => setIndex(i => Math.min(paper.questions.length - 1, i + 1))}>Next</button>
      </div>
    </main>
  );
}
