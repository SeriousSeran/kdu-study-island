export const SUBJECTS = ["Medicine", "Surgery", "Paediatrics", "O&G", "Psychiatry"];

export function slug(value) {
  return String(value || "x").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function subjectRank(subject) {
  const idx = SUBJECTS.indexOf(subject);
  return idx === -1 ? 999 : idx;
}

export function buildPapersFromGlobals(source = globalThis) {
  const legacy = source.KDU_BANK || {};
  const answered = Object.entries(legacy).map(([subject, questions]) => {
    const id = `${slug(subject)}-35-mcq-answered`;
    return {
      id,
      subject,
      intake: "35",
      kind: "MCQ",
      title: `${subject} Intake 35 MCQ`,
      scored: true,
      source: "answered",
      questions: (questions || []).map(question => ({
        ...question,
        id: `${slug(subject)}-35-mcq-${question.n}`,
        paperId: id,
        subject,
        intake: "35",
        kind: "MCQ",
        source: "answered",
        needsReview: false,
      })),
    };
  });

  const seq = (source.KDU_SEQ_BANK || []).map(paper => ({
    ...paper,
    kind: paper.kind || "SEQ",
    scored: false,
    questions: (paper.questions || []).map(question => ({ ...question, paperId: paper.id })),
  }));

  const ocr = (source.KDU_OCR_MCQ_BANK || []).map(paper => {
    const id = `${paper.id}-ocr`;
    return {
      ...paper,
      id,
      kind: paper.kind || "MCQ",
      title: String(paper.title || "").replace("OCR MCQ", "MCQ practice") || paper.title,
      scored: false,
      questions: (paper.questions || []).map(question => ({ ...question, paperId: id })),
    };
  });

  return [...answered, ...seq, ...ocr].sort((a, b) => {
    return subjectRank(a.subject) - subjectRank(b.subject)
      || String(b.intake || "").localeCompare(String(a.intake || ""))
      || String(a.kind || "").localeCompare(String(b.kind || ""));
  });
}

export function summarizeInventory(papers = [], cases = []) {
  return {
    papers: papers.length,
    mcq: papers.filter(p => p.kind === "MCQ").reduce((sum, p) => sum + (p.questions?.length || 0), 0),
    seq: papers.filter(p => p.kind === "SEQ").reduce((sum, p) => sum + (p.questions?.length || 0), 0),
    cases: Array.isArray(cases) ? cases.length : Object.keys(cases || {}).length,
  };
}
