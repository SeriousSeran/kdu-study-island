/**
 * Tests for src/ai/prompts.js
 * Run: node --test tests/prompts.test.mjs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildMcqTutorPrompt,
  buildSeqTutorPrompt,
  buildCasePatientPrompt,
  buildCaseExaminerPrompt,
  buildWeakPointPrompt,
  buildToolPlanPrompt,
} from "../src/ai/prompts.js";

const MCQ_ITEM = {
  id: "q1", kind: "mcq", subject: "Medicine", stem: "Causes of hyponatraemia include?",
  options: { A: "SIADH", B: "Conn syndrome", C: "Adrenal insufficiency" },
  answer: { A: true, B: false, C: true },
  tags: ["electrolytes", "sodium"], subquestions: [], explanation: "",
  source: "answered", confidence: 1, needsReview: false, linkedTopics: [],
};

const SEQ_ITEM = {
  id: "s1", kind: "seq", subject: "Medicine", stem: "Describe management of DKA",
  options: {}, answer: null, subquestions: [{ label: "A", prompt: "Initial stabilisation", marks: 5 }],
  tags: ["endocrine", "emergency"], source: "seq", confidence: 0, needsReview: false, linkedTopics: [],
};

const NEURO_ITEM = {
  ...MCQ_ITEM, id: "q2", subject: "Medicine",
  tags: ["neuro", "stroke"], stem: "Localize this lesion",
};

const PSYCH_ITEM = {
  ...MCQ_ITEM, id: "q3", subject: "Psychiatry",
  tags: ["psychiatry", "mse"], stem: "Assess this patient",
};

describe("buildMcqTutorPrompt", () => {
  it("returns two messages [system, user]", () => {
    const msgs = buildMcqTutorPrompt(MCQ_ITEM, { mr: { A: true } }, { percent: 50, wrongLines: ["B"], skippedLines: [] });
    assert.equal(msgs.length, 2);
    assert.equal(msgs[0].role, "system");
    assert.equal(msgs[1].role, "user");
  });

  it("system prompt is short (< 200 chars)", () => {
    const msgs = buildMcqTutorPrompt(MCQ_ITEM, {}, {});
    assert.ok(msgs[0].content.length < 200, `System prompt too long: ${msgs[0].content.length}`);
  });

  it("user turn includes teaching flow keywords", () => {
    const msgs = buildMcqTutorPrompt(MCQ_ITEM, {}, {});
    const content = msgs[1].content;
    assert.ok(content.includes("Patient"), "Missing Patient flow");
    assert.ok(content.includes("Physiology"), "Missing Physiology");
    assert.ok(content.includes("Exam trap"), "Missing exam trap");
    assert.ok(content.includes("Memory hook"), "Missing memory hook");
  });

  it("includes neuro addendum for neuro tags", () => {
    const msgs = buildMcqTutorPrompt(NEURO_ITEM, {}, {});
    assert.ok(msgs[1].content.includes("localize"), `Missing neuro addendum`);
  });

  it("includes psychiatry addendum for psych subject", () => {
    const msgs = buildMcqTutorPrompt(PSYCH_ITEM, {}, {});
    assert.ok(msgs[1].content.includes("MSE") || msgs[1].content.includes("Risk"), "Missing psych addendum");
  });

  it("includes JSON schema in user turn", () => {
    const msgs = buildMcqTutorPrompt(MCQ_ITEM, {}, {});
    assert.ok(msgs[1].content.includes("verdict"), "Missing JSON schema");
    assert.ok(msgs[1].content.includes("graphUpdates"), "Missing graphUpdates key");
  });

  it("does not include dose safety warning violation — always says verify", () => {
    const msgs = buildMcqTutorPrompt(MCQ_ITEM, {}, {});
    assert.ok(msgs[1].content.includes("verify local protocol"), "Missing safety note");
  });
});

describe("buildSeqTutorPrompt", () => {
  it("includes subquestions in user turn", () => {
    const msgs = buildSeqTutorPrompt(SEQ_ITEM, "My spoken answer here", "4");
    const content = msgs[1].content;
    assert.ok(content.includes("Initial stabilisation"), "Missing subpart label");
    assert.ok(content.includes("5m"), "Missing marks");
  });

  it("includes emergency addendum for emergency tags", () => {
    const msgs = buildSeqTutorPrompt(SEQ_ITEM, "answer", "");
    assert.ok(msgs[1].content.includes("ABCDE") || msgs[1].content.includes("Danger"), "Missing emergency addendum");
  });
});

describe("buildCasePatientPrompt", () => {
  it("returns a single system message object", () => {
    const msg = buildCasePatientPrompt({ text: "Patient info", title: "HF", subject: "Medicine" });
    assert.equal(msg.role, "system");
    assert.ok(msg.content.includes("patient"), "Missing patient instruction");
    assert.ok(msg.content.includes("[UNSAFE]"), "Missing unsafe instruction");
  });

  it("truncates very long case texts to prevent token overflow", () => {
    const longText = "x".repeat(5000);
    const msg = buildCasePatientPrompt({ text: longText, title: "T", subject: "Medicine" });
    assert.ok(msg.content.length < longText.length + 500, "Case text not truncated");
  });
});

describe("buildCaseExaminerPrompt", () => {
  it("returns [system, user] messages", () => {
    const msgs = buildCaseExaminerPrompt({ title: "HF", subject: "Medicine", text: "..." }, "transcript", "plan");
    assert.equal(msgs.length, 2);
    assert.ok(msgs[1].content.includes("Grade"), "Missing grade instruction");
  });
});

describe("buildWeakPointPrompt", () => {
  it("mentions teaching from scratch", () => {
    const msgs = buildWeakPointPrompt(MCQ_ITEM);
    assert.ok(msgs[1].content.includes("weak point"), "Missing weak point mention");
  });
});

describe("buildToolPlanPrompt", () => {
  it("includes available tools list", () => {
    const msgs = buildToolPlanPrompt(MCQ_ITEM, "diagram may help");
    assert.ok(msgs[1].content.includes("create_learning_image"), "Missing tool names");
  });
});
