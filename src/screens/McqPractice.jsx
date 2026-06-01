import { answerKeyText, emptyAnswer, LETTERS, scoreQuestion } from "../practice/scoring.js";
import { srsQualityFromResult, srsUpdate } from "../practice/srs.js";
import { kimiChat } from "../ai/client.js";
import { buildMcqTutorPrompt } from "../ai/prompts.js";
import { parseAiResponse } from "../ai/parseResponse.js";
import { suggestTools } from "../ai/toolPlanner.js";
import { processMcqResult } from "../practice/reviewEngine.js";
import { normalize } from "../data/normalizer.js";
import AiFeedbackCard from "../components/AiFeedbackCard.jsx";
import WeakConceptCard from "../components/WeakConceptCard.jsx";
import VideoShelf from "../components/resources/VideoShelf.jsx";
import React from "react";

export default function McqPractice({ paper, attempts, notes, setNotes, recordAttempt, onPickPaper, d3Graph, setD3Graph, onDrill, addWeakConcept, profile, setProfile, settings }) {
  const questions = paper?.questions || [];

  // Position is held explicitly so submitting never yanks the question out from under you.
  const [index, setIndex] = React.useState(0);
  React.useEffect(() => {
    const firstUnanswered = questions.findIndex(q => !attempts[q.id]);
    setIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
    // Only re-seek when the paper itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paper?.id]);

  const question = questions[index];
  const [answer, setAnswer] = React.useState(() => emptyAnswer(question));
  const [result, setResult] = React.useState(null);
  const [note, setNote] = React.useState("");
  // ai.status: "idle" | "loading" | "done" | "error"
  const [ai, setAi] = React.useState({ status: "idle", result: null, error: "" });
  const [weakConcept, setWeakConcept] = React.useState(null);

  React.useEffect(() => {
    setAnswer(emptyAnswer(question));
    setResult(null);
    setNote(notes[question?.id]?.text || "");
    setAi({ status: "idle", result: null, error: "" });
    setWeakConcept(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);

  if (!paper || !question) {
    return (
      <main className="screen empty">
        <h1>MCQ Practice</h1>
        <p>Pick a paper to begin.</p>
        <button className="primary pill" onClick={onPickPaper}>Choose paper</button>
      </main>
    );
  }

  const answered = !!result;
  const atEnd = index >= questions.length - 1;
  const explanation = question.expl || question.explanation || "";

  const explain = (q, a, r) => {
    setAi({ status: "loading", result: null, error: "" });
    const item = normalize({ ...q, kind: "mcq" });
    const toolSuggestions = suggestTools(item);
    const messages = buildMcqTutorPrompt(item, a, r, note);
    kimiChat(messages, { maxTokens: 1200 })
      .then(text => {
        const parsed = parseAiResponse(text);
        setAi({ status: "done", result: parsed, error: "" });
        if (parsed.ok && parsed.json) {
          const { weakConcept: updatedWc, d3Graph: updatedGraph } = processMcqResult(
            item, r, attempts[q.id]?.srs, parsed.json, d3Graph
          );
          if (updatedWc) {
            setWeakConcept(updatedWc);
            if (addWeakConcept) addWeakConcept(updatedWc);
          }
          if (setD3Graph && updatedGraph) setD3Graph(updatedGraph);
        }
      })
      .catch(err => setAi({ status: "error", result: null, error: err.message }));
  };

  const submit = () => {
    if (answered) return;
    const next = scoreQuestion(question, answer);
    setResult(next);
    const srs = srsUpdate(attempts[question.id]?.srs, srsQualityFromResult(next));
    recordAttempt(question, paper, next, srs);

    if (note !== (notes[question.id]?.text || "")) {
      setNotes(prev => ({ ...prev, [question.id]: { text: note, updatedAt: Date.now() } }));
    }

    // Run review engine to create weak concept + update D3 graph
    const item = normalize({ ...question, kind: "mcq" });
    const { weakConcept: wc, d3Graph: updatedGraph } = processMcqResult(
      item, next, attempts[question.id]?.srs, null, d3Graph
    );
    setWeakConcept(wc);
    if (wc && addWeakConcept) addWeakConcept(wc);
    if (setD3Graph && updatedGraph) setD3Graph(updatedGraph);

    // Launch AI explanation if there's a trusted key
    if (question.answer != null) explain(question, answer, next);
  };

  const handleToolAction = (suggestion) => {
    // Tool invocation: for now open the query in a new tab (e.g. image search)
    // Future: route to a dedicated tool screen
    const query = encodeURIComponent(suggestion.query || "");
    if (suggestion.tool === "retrieve_learning_video") {
      window.open(`https://www.youtube.com/results?search_query=${query}`, "_blank", "noopener");
    } else if (suggestion.tool === "retrieve_guideline") {
      window.open(`https://www.nice.org.uk/search?q=${query}`, "_blank", "noopener");
    }
    // Other tools: placeholder for future implementation
  };

  const toolSuggestionsForQuestion = React.useMemo(() => {
    if (!question) return [];
    return suggestTools(normalize({ ...question, kind: "mcq" }));
  }, [question?.id]);

  const goNext = () => setIndex(i => Math.min(questions.length - 1, i + 1));
  const goPrev = () => setIndex(i => Math.max(0, i - 1));

  return (
    <main className="screen">
      <div className="practice-top">
        <p className="eyebrow">{paper.subject} · {paper.title}</p>
        <span className="qcount">{index + 1} / {questions.length}</span>
      </div>
      <div className="meter thin"><span style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></div>

      <section className="card question-card fade-q" key={question.id}>
        <h2>{question.stem}</h2>
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
                        {value === true ? "True" : value === false ? "False" : "Skip"}
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
      </section>

      <textarea className="note" value={note} onChange={e => setNote(e.target.value)} placeholder="Note for this question..." />

      {!answered ? (
        <button className="primary full" onClick={submit}>Submit</button>
      ) : (
        <>
          <section className={`card feedback fade-q ${result.correct ? "good" : "bad"}`}>
            <b>{result.percent == null ? "Self-mark" : `${result.percent}%`}</b>
            {result.score != null && <p>Raw score {result.score}/{result.maxScore}. Key: {answerKeyText(question)}</p>}
            {result.skippedLines?.length ? <p>Skipped: {result.skippedLines.join(", ")}</p> : null}
          </section>

          {/* Structured AI Feedback */}
          <AiFeedbackCard
            aiResult={ai.result}
            toolSuggestions={toolSuggestionsForQuestion}
            onToolAction={handleToolAction}
            loading={ai.status === "loading"}
            error={ai.status === "error" ? ai.error : ""}
            onRetry={() => explain(question, answer, result)}
            fallbackExplanation={explanation}
          />

          {/* Why I got this wrong card */}
          {weakConcept && (
            <WeakConceptCard
              weakConcept={weakConcept}
              onDrill={onDrill}
            />
          )}

          {/* Trusted Clinical Video Shelf */}
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

          <button className="primary full" onClick={goNext} disabled={atEnd}>
            {atEnd ? "End of paper" : "Next question →"}
          </button>
        </>
      )}

      <div className="quick-row">
        <button disabled={index === 0} onClick={goPrev}>← Previous</button>
        <button disabled={atEnd} onClick={goNext}>Skip →</button>
      </div>
    </main>
  );
}
