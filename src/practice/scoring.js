export const LETTERS = ["A", "B", "C", "D", "E"];

export function scoreQuestion(question, answer = {}) {
  if (!question || question.answer == null) {
    return { percent: null, score: null, maxScore: null, correct: null, needsReview: true };
  }

  if (question.type === "sbr") {
    const correct = answer.selected === question.answer;
    return { percent: correct ? 100 : 0, score: correct ? 1 : 0, maxScore: 1, correct, needsReview: false };
  }

  let score = 0;
  let maxScore = 0;
  let any = false;
  const wrongLines = [];
  const skippedLines = [];

  for (const letter of LETTERS) {
    if (question.answer?.[letter] == null) continue;
    maxScore += 1;
    const picked = answer.mr?.[letter];
    if (picked == null) {
      skippedLines.push(letter);
      continue;
    }
    any = true;
    if (picked === question.answer[letter]) score += 1;
    else {
      score -= 1;
      wrongLines.push(letter);
    }
  }

  const percent = maxScore ? Math.max(0, Math.round((score / maxScore) * 100)) : null;
  return {
    percent,
    score,
    maxScore,
    correct: any && percent === 100,
    needsReview: false,
    wrongLines,
    skippedLines,
  };
}

export function emptyAnswer(question) {
  return question?.type === "mr" ? { mr: {} } : { selected: null };
}

export function answerKeyText(question) {
  if (!question || question.answer == null) return "No trusted key yet";
  if (question.type === "sbr") return `${question.answer}. ${question.options?.[question.answer] || ""}`.trim();
  return LETTERS
    .filter(letter => question.answer?.[letter] != null)
    .map(letter => `${letter}=${question.answer[letter] ? "True" : "False"}`)
    .join("  ");
}
