/**
 * Prompt Builders — compact, token-efficient prompts for each KDU learning mode.
 *
 * Design rules:
 *  1. System prompts are SHORT (<180 chars). All teaching context is in the user turn.
 *  2. Each builder returns a messages array ready for kimiChat().
 *  3. The user turn embeds the KDU teaching flow inline as a compact instruction list.
 *  4. Every prompt ends with "Return valid JSON only" to trigger structured output.
 *
 * Teaching flow (embedded in every prompt):
 *   Patient→Physiology→Pathology→Symptoms→Signs→Investigations→Management→Exam trap→Memory hook
 *
 * Emergency addendum:  Danger→ABCDE→drugs→monitoring→investigations→definitive→complications
 * Neurology addendum:  Localize(cortex/BS/CB/SC/PN/NMJ/muscle)→lesion→pathway→symptom→sign→Ix→Mx
 * Psychiatry addendum: Risk→MSE→Dx→Differentials→BPS formulation→Mx→legal/ethical
 *
 * Safety: never invent guideline-sensitive doses — label as "verify local protocol".
 */

const BASE_SYSTEM =
  "KDU-Tutor: strict MBBS finals coach. Exam-first, mechanism-first. No fluff. Return valid JSON only.";

// Compact JSON schema reminder embedded in every user turn.
const JSON_SCHEMA = `Return ONLY valid JSON:
{"verdict":"","mistakePattern":"","mechanism":"","mustKnow":[],"missedPoints":[],"examTraps":[],"memoryHook":"","linkedTopics":[],"nextVivaQuestion":"","flashcards":[{"front":"","back":""}],"graphUpdates":[{"source":"","target":"","edge":"","weight":1}],"toolCallsSuggested":[{"tool":"","reason":"","query":""}]}`;

const FLOW =
  "Teach: Patient→Physiology→Pathology→Symptoms→Signs→Investigations→Management→Exam trap→Memory hook.";

const EMERGENCY_ADDENDUM =
  "Emergency: Danger→ABCDE→immediate drugs→monitoring→investigations→definitive Tx→complications.";

const NEURO_ADDENDUM =
  "Neuro: localize first (cortex/BS/CB/SC/PN/NMJ/muscle)→lesion→pathway→symptom→sign→Ix→emergency Mx.";

const PSYCH_ADDENDUM =
  "Psych: Risk→MSE→Dx→Differentials→BPS formulation→Mx→legal/ethical issue.";

function _subjectAddendum(subject = "", tags = []) {
  const lc = `${subject} ${tags.join(" ")}`.toLowerCase();
  if (/neuro|brain|spinal|cerebel/.test(lc)) return NEURO_ADDENDUM;
  if (/psych|mental|mse/.test(lc)) return PSYCH_ADDENDUM;
  if (/emerg|shock|resus|sepsis|arrest|anaphyl/.test(lc)) return EMERGENCY_ADDENDUM;
  return "";
}

function _optionsBlock(options = {}) {
  return Object.entries(options)
    .map(([k, v]) => `${k}. ${v}`)
    .join("\n");
}

function _subsBlock(subquestions = []) {
  if (!subquestions.length) return "";
  return subquestions.map(s => `${s.label}. ${s.prompt} (${s.marks}m)`).join("\n");
}

// ─── Public prompt builders ───────────────────────────────────────────────────

/**
 * MCQ tutor prompt: explain why the student got it right/wrong.
 * @param {import('../data/normalizer.js').LearningItem} item
 * @param {{selected?:string, mr?:Object}} studentAnswer
 * @param {{correct:boolean, percent:number, wrongLines:string[], skippedLines:string[]}} result
 * @param {string} [note]
 */
export function buildMcqTutorPrompt(item, studentAnswer = {}, result = {}, note = "") {
  const addendum = _subjectAddendum(item.subject, item.tags);
  const answerBlock =
    item.answer != null
      ? `Correct: ${typeof item.answer === "object" ? JSON.stringify(item.answer) : item.answer}`
      : "No trusted answer key.";

  const userContent = [
    `Subject: ${item.subject} | Kind: MCQ`,
    `Q: ${item.stem}`,
    _optionsBlock(item.options),
    answerBlock,
    `Student answer: ${JSON.stringify(studentAnswer)} | Score: ${result.percent ?? "?"}%`,
    result.wrongLines?.length ? `Wrong: ${result.wrongLines.join(",")}` : "",
    result.skippedLines?.length ? `Skipped: ${result.skippedLines.join(",")}` : "",
    note ? `Student note: "${note}"` : "",
    FLOW,
    addendum,
    "Do NOT invent guideline-sensitive doses — say 'verify local protocol'.",
    JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: BASE_SYSTEM },
    { role: "user", content: userContent },
  ];
}

/**
 * SEQ/CQ tutor prompt: mark the spoken answer and give structured feedback.
 * @param {import('../data/normalizer.js').LearningItem} item
 * @param {string} studentAnswer  Transcript text.
 * @param {string} [markGiven]    Optional mark entered by student.
 */
export function buildSeqTutorPrompt(item, studentAnswer = "", markGiven = "") {
  const addendum = _subjectAddendum(item.subject, item.tags);
  const subs = _subsBlock(item.subquestions);

  const userContent = [
    `Subject: ${item.subject} | Kind: SEQ/CQ`,
    `Stem: ${item.stem}`,
    subs ? `Subparts:\n${subs}` : "",
    `Student spoken answer:\n${studentAnswer}`,
    markGiven ? `Student self-mark: ${markGiven}` : "",
    FLOW,
    addendum,
    "Do NOT invent guideline-sensitive doses — say 'verify local protocol'.",
    JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: BASE_SYSTEM },
    { role: "user", content: userContent },
  ];
}

/**
 * Case patient system prompt — AI acts as patient/examiner during the encounter.
 * @param {Object} casePack   {text, title, subject}
 */
export function buildCasePatientPrompt(casePack) {
  return {
    role: "system",
    content: [
      "You are running a KDU MBBS live OSCE case. Hidden case sheet (ground truth):",
      `"""${(casePack.text ?? "").slice(0, 2400)}"""`,
      "If the student asks history, act as the patient. Short, realistic answers only.",
      "If the student says they are examining/requesting examination, act as examiner and give relevant positive and negative findings.",
      "Do not reveal diagnosis or full marking scheme during the encounter unless the student's exact request justifies a finding.",
      "Prefix unsafe manoeuvres with [UNSAFE] and briefly explain as examiner.",
    ].join("\n"),
  };
}

/**
 * Case examiner grading prompt — AI grades the encounter.
 * @param {Object} casePack
 * @param {string} transcript  Full conversation transcript text.
 * @param {string} plan        Student's structured DDx chart + submitted plan.
 */
export function buildCaseExaminerPrompt(casePack, transcript, plan) {
  const addendum = _subjectAddendum(casePack.subject ?? "", []);

  const userContent = [
    "End of OSCE encounter. Act as examiner only.",
    `Subject: ${casePack.subject ?? ""}`,
    `Hidden case sheet:\n${(casePack.text ?? "").slice(0, 2200)}`,
    `Transcript:\n${transcript.slice(0, 3200)}`,
    `Student structured DDx chart and final plan:\n${plan}`,
    "Grade out of 10: history positives/negatives, examination requests/findings, DDx reasoning, investigations, management, safety and consultant-style synthesis.",
    "Feedback must tell the student exactly which questions/examinations/investigations/management points were missing for each important differential.",
    addendum,
    JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: BASE_SYSTEM },
    { role: "user", content: userContent },
  ];
}

/**
 * Weak-point teaching prompt — no student answer; just explain the topic deeply.
 * Used for SRS review items the student hasn't attempted yet.
 * @param {import('../data/normalizer.js').LearningItem} item
 */
export function buildWeakPointPrompt(item) {
  const addendum = _subjectAddendum(item.subject, item.tags);

  const userContent = [
    `Subject: ${item.subject} | Kind: ${item.kind}`,
    `Topic: ${item.stem}`,
    "This is a known weak point. Teach the core concept from scratch.",
    FLOW,
    addendum,
    "Do NOT invent guideline-sensitive doses — say 'verify local protocol'.",
    JSON_SCHEMA,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: BASE_SYSTEM },
    { role: "user", content: userContent },
  ];
}

/**
 * Tool-plan prompt — ask the model whether a visual tool would help.
 * Only used when the auto-planner is insufficient and you want the model's opinion.
 * @param {import('../data/normalizer.js').LearningItem} item
 * @param {string} suggestionReason  Why we think a tool may help.
 */
export function buildToolPlanPrompt(item, suggestionReason = "") {
  const userContent = [
    `Subject: ${item.subject} | Kind: ${item.kind}`,
    `Topic: ${item.stem}`,
    suggestionReason ? `Context: ${suggestionReason}` : "",
    "Should a visual tool help here? If yes, return toolCallsSuggested only. If no, return empty array.",
    `Available tools: create_learning_image, create_d3_graph, retrieve_learning_video, generate_case_pathway, retrieve_guideline, generate_flashcards.`,
    '{"toolCallsSuggested":[{"tool":"","reason":"","query":""}]}',
  ]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: BASE_SYSTEM },
    { role: "user", content: userContent },
  ];
}
