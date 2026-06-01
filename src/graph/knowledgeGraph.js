const STOPWORDS = new Set([
  "the", "and", "for", "with", "from", "that", "this", "are", "was", "were", "has", "have",
  "his", "her", "she", "him", "you", "your", "patient", "patients", "which", "what", "when",
  "where", "how", "why", "about", "into", "after", "before", "rise", "changes",
  // question-filler noise that otherwise pollutes the graph
  "needs", "suggestive", "positive", "negative", "features", "feature", "following",
  "cause", "causes", "caused", "include", "includes", "including", "associated",
  "association", "common", "commonly", "typical", "typically", "seen", "may", "can",
  "due", "used", "use", "uses", "increased", "increase", "decreased", "decrease",
  "normal", "abnormal", "high", "low", "true", "false", "both", "all", "none", "not",
  "most", "least", "less", "more", "also", "often", "usually", "always", "never",
  "known", "found", "show", "shows", "shown", "present", "presents", "presenting",
  "result", "results", "leads", "lead", "occur", "occurs", "type", "types", "best",
  "given", "year", "old", "man", "woman", "history", "presented", "presentation",
]);

const PHRASES = [
  "chest pain",
  "acute coronary syndrome",
  "myocardial infarction",
  "pulmonary embolism",
  "heart failure",
  "bronchial asthma",
  "ectopic pregnancy",
  "diabetic ketoacidosis",
  "status epilepticus",
];

export function topicKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function addNode(nodes, id, label, type, extra = {}) {
  if (!nodes.has(id)) nodes.set(id, { id, label, type, weight: 0, ...extra });
  nodes.get(id).weight += 1;
}

function addLink(links, source, target, type, weight = 1) {
  const id = `${source}->${target}:${type}`;
  const cur = links.get(id) || { source, target, type, weight: 0 };
  cur.weight += weight;
  links.set(id, cur);
}

// Obsidian-style: topics that appear together in the same question/case are linked.
// Order the pair so A<->B and B<->A accumulate onto one undirected edge.
function addCooccurrence(links, topicIds, cap = 8) {
  const ids = Array.from(new Set(topicIds)).slice(0, cap);
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      const [a, b] = ids[i] < ids[j] ? [ids[i], ids[j]] : [ids[j], ids[i]];
      addLink(links, a, b, "co", 1);
    }
  }
}

export function extractTopics(text = "", tags = []) {
  const body = `${tags.join(" ")} ${text}`.toLowerCase();
  const topics = new Set();

  for (const phrase of PHRASES) {
    if (body.includes(phrase)) topics.add(phrase);
  }

  const words = body.match(/[a-z][a-z0-9]{2,}/g) || [];
  for (const word of words) {
    if (!STOPWORDS.has(word)) topics.add(word);
  }

  return Array.from(topics).slice(0, 12);
}

export function questionText(question = {}) {
  const options = Object.values(question.options || {}).join(" ");
  const answerStatements = typeof question.answer === "object"
    ? Object.keys(question.answer || {}).map(letter => `${letter} ${question.options?.[letter] || ""}`).join(" ")
    : "";
  return `${question.stem || ""} ${options} ${answerStatements} ${question.expl || ""}`;
}

export function buildKnowledgeGraph({ papers = [], attempts = {}, notes = {}, cases = {}, ragChunks = [] } = {}) {
  const nodes = new Map();
  const links = new Map();

  // The map grows from what you've actually practised — only questions you have
  // attempted (or written a note on) contribute. A brand-new user sees an empty
  // graph that fills in as they study, the way Obsidian grows from your notes.
  for (const paper of papers) {
    const paperId = `paper:${paper.id}`;
    let paperAdded = false;

    for (const question of paper.questions || []) {
      const attempt = attempts[question.id];
      const note = notes[question.id]?.text || "";
      if (!attempt && !note) continue; // not practised yet → skip

      if (!paperAdded) {
        addNode(nodes, paperId, paper.title || paper.id, "paper", { subject: paper.subject });
        paperAdded = true;
      }

      const qid = `question:${question.id}`;
      addNode(nodes, qid, question.stem || question.id, "question", { subject: question.subject || paper.subject, paperId: paper.id });
      addLink(links, paperId, qid, "contains");

      const topics = extractTopics(`${questionText(question)} ${note}`, question.tags || []);
      const tids = [];
      for (const topic of topics) {
        const tid = `topic:${topicKey(topic)}`;
        addNode(nodes, tid, topic, "topic", { subject: question.subject || paper.subject });
        addLink(links, qid, tid, attempt?.weak ? "weak-topic" : "mentions", attempt?.weak ? 2 : 1);
        tids.push(tid);
      }
      addCooccurrence(links, tids);
    }
  }

  const caseEntries = Array.isArray(cases) ? cases.map(c => [c.id, c]) : Object.entries(cases || {});
  for (const [caseId, record] of caseEntries) {
    const cid = `case:${caseId}`;
    addNode(nodes, cid, record.title || caseId, "case", { subject: record.subject });
    const caseTids = [];
    for (const topic of extractTopics(`${record.title || ""} ${record.transcript || ""} ${record.feedback || ""}`)) {
      const tid = `topic:${topicKey(topic)}`;
      addNode(nodes, tid, topic, "topic");
      addLink(links, cid, tid, "case-topic");
      caseTids.push(tid);
    }
    addCooccurrence(links, caseTids);
  }

  for (const chunk of ragChunks || []) {
    const rid = `rag:${chunk.id}`;
    const topics = extractTopics(`${chunk.title || ""} ${chunk.text || ""}`);
    if (!topics.length) continue;
    addNode(nodes, rid, chunk.title || chunk.id, "rag");
    for (const topic of topics.slice(0, 8)) {
      const tid = `topic:${topicKey(topic)}`;
      addNode(nodes, tid, topic, "topic");
      addLink(links, rid, tid, "rag-topic");
    }
  }

  return { nodes: Array.from(nodes.values()), links: Array.from(links.values()) };
}
