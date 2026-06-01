export async function kimiChat(messages, { maxTokens = 900, temperature = 0.3 } = {}) {
  const res = await fetch("/api/moonshot/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "moonshot-v1-8k", messages, temperature, max_tokens: maxTokens }),
  });
  if (!res.ok) throw new Error(`AI error ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function transcribeAudio(blob) {
  const form = new FormData();
  form.append("file", blob, "answer.webm");
  form.append("model", "whisper-large-v3-turbo");
  const res = await fetch("/api/groq/openai/v1/audio/transcriptions", { method: "POST", body: form });
  if (!res.ok) throw new Error(`STT error ${res.status}: ${(await res.text()).slice(0, 180)}`);
  const data = await res.json();
  return data.text || "";
}

export function makeSeqPrompt(question, answer) {
  return [
    { role: "system", content: "You are a strict final-year MBBS examiner. Mark against must-cover points, be concise, and do not invent facts." },
    { role: "user", content: `Question:\n${question.stem || ""}\n\nSubparts:\n${(question.subs || []).map(s => `${s.label || ""} ${s.prompt || ""} (${s.marks || ""})`).join("\n")}\n\nStudent spoken answer transcript:\n${answer}\n\nReturn: estimated mark, covered must-say points, missing must-say points, dangerous/irrelevant statements, and 2-3 revision targets.` },
  ];
}

import { LETTERS } from "../practice/scoring.js";

// Build a consultant-level explanation tailored to exactly how the student
// answered each line and to the note they wrote — per-statement teaching, topic
// connections, recent guideline changes and "what if" twists.
export function makeMcqExplainPrompt(question, answer = {}, result = {}, note = "") {
  const fmt = v => (v === true ? "True" : v === false ? "False" : "Skipped");
  let body;
  if (question.type === "sbr") {
    const picked = answer.selected;
    body = Object.entries(question.options || {})
      .map(([k, t]) => `${k}. ${t}${k === question.answer ? "  [CORRECT]" : ""}${k === picked ? "  [you chose this]" : ""}`)
      .join("\n");
  } else {
    body = LETTERS
      .filter(L => question.answer?.[L] != null || question.options?.[L])
      .map(L => {
        const correct = question.answer?.[L];
        const you = answer.mr?.[L];
        const tag = you == null ? "" : you === correct ? " ✓" : " ✗ (got this wrong)";
        return `${L}. ${question.options?.[L] || ""}\n   correct: ${fmt(correct)} | you: ${fmt(you)}${tag}`;
      })
      .join("\n");
  }
  const wrong = (result.wrongLines || []).join(", ");
  const skipped = (result.skippedLines || []).join(", ");
  return [
    {
      role: "system",
      content: "You are a consultant physician teaching a final-year MBBS student one-to-one right after they attempted an MCQ. Be precise and exam-focused, use terminology a final-year knows, and be honest about uncertainty. Plain text with short labelled sections and dashes — no markdown headings, no fluff, no restating the question.",
    },
    {
      role: "user",
      content: `MCQ stem: ${question.stem}

Statements (correct answer + how I answered):
${body}

I scored ${result.percent ?? "?"}%. Lines I got wrong: ${wrong || "none"}. Lines I skipped: ${skipped || "none"}.
${note ? `\nMy own note on this question (address what I seem unsure about): "${note}"\n` : ""}
Walk me through it like a consultant, in this order:
- Verdict: one line on how I did and the single most important takeaway.
- Near misses: the statements I got wrong or skipped — why my instinct was off and the rule to remember.
- Statement-by-statement: for EACH option, why it is true/false plus a 1–2 line summary of the underlying topic (mechanism / key facts).
- Connections: how these topics link to other high-yield conditions I should revise alongside this.
- Guidelines: any recent or commonly-tested guideline change relevant here (say "no major change" if none).
- What if: 1–2 quick "what if the patient instead had X" twists that change the answer.
Keep each section tight and high-yield.`,
    },
  ];
}

export function makeCaseSystemPrompt(casePack) {
  return {
    role: "system",
    content: `You are running a KDU final-year MBBS live clinical case. Use this hidden case sheet as ground truth:\n\n"""${casePack.text || ""}"""\n\nAct as the patient for history questions. Give short realistic answers. Only give examination findings when the student asks for a specific exam. If the student proposes an unsafe maneuver, prefix with [UNSAFE] and briefly explain as examiner. At the end, grade history, exam, differentials, investigations, management, and unsafe actions.`,
  };
}
