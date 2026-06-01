import React from "react";

/**
 * AiFeedbackCard — renders structured AI feedback (JSON or plain text fallback).
 *
 * Props:
 *  - aiResult: {ok, json?, plain?} — from parseAiResponse()
 *  - toolSuggestions: Array<{tool, reason, query}> — from suggestTools() or json.toolCallsSuggested
 *  - onToolAction: (suggestion) => void  — called when a tool button is clicked
 *  - loading: boolean
 *  - error: string
 *  - onRetry: () => void
 *  - fallbackExplanation: string  — shown when offline and no AI result
 */
export default function AiFeedbackCard({
  aiResult,
  toolSuggestions = [],
  onToolAction,
  loading = false,
  error = "",
  onRetry,
  fallbackExplanation = "",
}) {
  if (loading) {
    return (
      <section className="card ai-card">
        <p className="expl loading-expl">🧠 KDU-Tutor is analysing your answer…</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card ai-card error-panel">
        <p className="expl">{fallbackExplanation || "AI explanation unavailable offline."}</p>
        {onRetry && (
          <button className="ghost sm" onClick={onRetry}>
            Retry explanation
          </button>
        )}
      </section>
    );
  }

  if (!aiResult) return null;

  // Plain-text fallback (model returned something but not valid JSON)
  if (!aiResult.ok) {
    return (
      <section className="card ai-card">
        <p className="expl">{aiResult.plain || fallbackExplanation}</p>
        <ToolSuggestionRow suggestions={toolSuggestions} onAction={onToolAction} />
      </section>
    );
  }

  // Structured JSON rendering
  const j = aiResult.json;
  return (
    <section className="card ai-card">
      {/* Verdict */}
      {j.verdict && (
        <p className="ai-verdict">
          <b>Verdict:</b> {j.verdict}
        </p>
      )}

      {/* Mistake pattern */}
      {j.mistakePattern && (
        <div className="ai-block why-wrong">
          <span className="ai-label">Why I got it wrong</span>
          <p>{j.mistakePattern}</p>
        </div>
      )}

      {/* Mechanism */}
      {j.mechanism && (
        <div className="ai-block">
          <span className="ai-label">Mechanism</span>
          <p>{j.mechanism}</p>
        </div>
      )}

      {/* Must know */}
      {j.mustKnow?.length > 0 && (
        <div className="ai-block">
          <span className="ai-label">Must know</span>
          <ul className="ai-list">
            {j.mustKnow.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Missed points */}
      {j.missedPoints?.length > 0 && (
        <div className="ai-block danger-block">
          <span className="ai-label">Missed points</span>
          <ul className="ai-list">
            {j.missedPoints.map((pt, i) => (
              <li key={i}>{pt}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Exam traps */}
      {j.examTraps?.length > 0 && (
        <div className="ai-block trap-block">
          <span className="ai-label">⚠ Exam traps</span>
          <ul className="ai-list">
            {j.examTraps.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Memory hook */}
      {j.memoryHook && (
        <div className="ai-block hook-block">
          <span className="ai-label">🧠 Memory hook</span>
          <p>{j.memoryHook}</p>
        </div>
      )}

      {/* Next viva question */}
      {j.nextVivaQuestion && (
        <div className="ai-block viva-block">
          <span className="ai-label">Next viva question</span>
          <p className="viva-q">{j.nextVivaQuestion}</p>
        </div>
      )}

      {/* Linked topics */}
      {j.linkedTopics?.length > 0 && (
        <div className="ai-block">
          <span className="ai-label">Linked topics</span>
          <div className="chips">
            {j.linkedTopics.map((t, i) => (
              <span key={i} className="chip topic-chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flashcards */}
      {j.flashcards?.length > 0 && (
        <details className="ai-block flashcard-block">
          <summary className="ai-label">
            Flashcards ({j.flashcards.length})
          </summary>
          <div className="flashcard-list">
            {j.flashcards.map((fc, i) => (
              <div key={i} className="flashcard">
                <p className="fc-front">
                  <b>Q:</b> {fc.front}
                </p>
                <p className="fc-back">
                  <b>A:</b> {fc.back}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Tool suggestions from both sources */}
      <ToolSuggestionRow
        suggestions={[
          ...(j.toolCallsSuggested ?? []),
          ...toolSuggestions.filter(
            s => !j.toolCallsSuggested?.some(t => t.tool === s.tool)
          ),
        ]}
        onAction={onToolAction}
      />
    </section>
  );
}

// ─── ToolSuggestionRow ───────────────────────────────────────────────────────

const TOOL_ICONS = {
  create_learning_image: "🖼",
  create_d3_graph: "🕸",
  retrieve_learning_video: "🎬",
  generate_flashcards: "🗂",
  generate_case_pathway: "🗺",
  retrieve_guideline: "📋",
};

const TOOL_LABELS = {
  create_learning_image: "Diagram",
  create_d3_graph: "Graph",
  retrieve_learning_video: "Video",
  generate_flashcards: "Flashcards",
  generate_case_pathway: "Pathway",
  retrieve_guideline: "Guideline",
};

export function ToolSuggestionRow({ suggestions = [], onAction }) {
  if (!suggestions?.length) return null;
  return (
    <div className="tool-row">
      <span className="ai-label">Suggested tools</span>
      <div className="chips">
        {suggestions.map((s, i) => (
          <button
            key={i}
            className="chip tool-chip"
            title={s.reason}
            onClick={() => onAction?.(s)}
          >
            {TOOL_ICONS[s.tool] ?? "🔧"} {TOOL_LABELS[s.tool] ?? s.tool}
          </button>
        ))}
      </div>
    </div>
  );
}
