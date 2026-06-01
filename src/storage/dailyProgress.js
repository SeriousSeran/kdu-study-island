export function todayKey(now = new Date()) {
  return now.toISOString().slice(0, 10);
}

export function getDailyProgress(profile = {}, dateKey = todayKey()) {
  const bucket = profile?.dailyProgress?.[dateKey] || {};
  return {
    mcqDone: Number(bucket.mcqDone) || 0,
    seqDone: Number(bucket.seqDone) || 0,
  };
}

export function incrementDailyProgress(profile = {}, field, dateKey = todayKey()) {
  const current = getDailyProgress(profile, dateKey);
  const nextBucket = {
    ...current,
    [field]: (Number(current[field]) || 0) + 1,
  };
  return {
    ...profile,
    dailyProgress: {
      ...(profile.dailyProgress || {}),
      [dateKey]: nextBucket,
    },
  };
}
