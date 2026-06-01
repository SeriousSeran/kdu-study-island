export const SRS_INTERVALS = [1, 1, 3, 7, 16, 35, 90];
export const DAY_MS = 86400000;

export function srsUpdate(prev = {}, quality, now = Date.now()) {
  let box = prev.box || 0;
  let reps = prev.reps || 0;
  let lapses = prev.lapses || 0;

  if (quality === "again") {
    box = 1;
    lapses += 1;
  } else if (quality === "easy") {
    box = Math.min(SRS_INTERVALS.length - 1, (box || 1) + 2);
  } else {
    box = Math.min(SRS_INTERVALS.length - 1, (box || 0) + 1);
  }

  reps += 1;
  const interval = SRS_INTERVALS[box] || 1;
  return { box, due: now + interval * DAY_MS, interval, reps, lapses, lastGraded: now };
}

export function srsQualityFromResult(result) {
  if (result?.correct === true) return "good";
  return "again";
}

export function srsQualityFromPercent(percent) {
  if (percent == null) return "again";
  if (percent >= 90) return "easy";
  if (percent >= 70) return "good";
  return "again";
}

export function isDue(attempt, now = Date.now()) {
  return !!(attempt?.srs?.due <= now);
}

export function dueItems(attempts = {}, now = Date.now()) {
  return Object.values(attempts).filter(item => isDue(item, now)).sort((a, b) => a.srs.due - b.srs.due);
}
