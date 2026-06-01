import test from "node:test";
import assert from "node:assert/strict";
import { buildPapersFromGlobals, subjectRank } from "../src/data/banks.js";
import { buildKnowledgeGraph, topicKey } from "../src/graph/knowledgeGraph.js";

test("buildPapersFromGlobals keeps old answered MCQ IDs compatible", () => {
  const papers = buildPapersFromGlobals({
    KDU_BANK: {
      Medicine: [{ n: 7, type: "sbr", stem: "Chest pain", answer: "A", options: { A: "ACS" } }],
    },
    KDU_SEQ_BANK: [],
    KDU_OCR_MCQ_BANK: [],
  });
  assert.equal(papers.length, 1);
  assert.equal(papers[0].id, "medicine-35-mcq-answered");
  assert.equal(papers[0].questions[0].id, "medicine-35-mcq-7");
  assert.equal(papers[0].questions[0].paperId, "medicine-35-mcq-answered");
});

test("buildPapersFromGlobals includes OCR and SEQ banks", () => {
  const papers = buildPapersFromGlobals({
    KDU_BANK: {},
    KDU_SEQ_BANK: [{ id: "seq-1", subject: "Surgery", intake: "40", kind: "SEQ", title: "Surgery SEQ", questions: [{ id: "s1", stem: "Appendicitis" }] }],
    KDU_OCR_MCQ_BANK: [{ id: "ocr-1", subject: "Paediatrics", intake: "41", kind: "MCQ", title: "OCR MCQ", questions: [{ id: "o1", stem: "Fever" }] }],
  });
  assert.equal(papers.length, 2);
  assert.equal(papers.find(p => p.id === "seq-1").questions[0].paperId, "seq-1");
  assert.equal(papers.find(p => p.id === "ocr-1-ocr").questions[0].paperId, "ocr-1-ocr");
});

test("subjectRank gives known subjects stable ordering", () => {
  assert.equal(subjectRank("Medicine") < subjectRank("Surgery"), true);
  assert.equal(subjectRank("Unknown") > subjectRank("Psychiatry"), true);
});

test("buildKnowledgeGraph creates topic, question, paper, and case links", () => {
  const papers = [{
    id: "med-paper",
    subject: "Medicine",
    title: "Medicine Paper",
    questions: [{
      id: "q1",
      stem: "Chest pain with ECG changes and troponin rise",
      tags: ["ACS"],
      expl: "Acute coronary syndrome",
      answer: { A: true },
      options: { A: "Troponin is useful" },
    }],
  }];
  const graph = buildKnowledgeGraph({
    papers,
    cases: { c1: { title: "Chest pain case", transcript: "Asked about smoking and ECG", feedback: "ACS likely" } },
    notes: { q1: { text: "Revise ACS and ECG" } },
    attempts: { q1: { id: "q1", weak: true, wrongLines: ["A"] } },
    ragChunks: [{ id: "r1", title: "ACS guideline", text: "ECG troponin chest pain ACS" }],
  });
  assert.ok(graph.nodes.some(n => n.id === "question:q1"));
  assert.ok(graph.nodes.some(n => n.id === "paper:med-paper"));
  assert.ok(graph.nodes.some(n => n.id === "case:c1"));
  assert.ok(graph.nodes.some(n => n.id === `topic:${topicKey("chest pain")}`));
  assert.ok(graph.links.some(e => e.source === "question:q1" && String(e.target).startsWith("topic:")));
});
