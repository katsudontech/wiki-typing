export type ScoreResult = { kpm: number; accuracy: number; eTypingScore: number; time: number };

function nonNegativeFinite(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function calculateETypingScore(kpm: number, accuracy: number): number {
  const validKpm = nonNegativeFinite(kpm);
  const validAccuracy = Math.min(nonNegativeFinite(accuracy), 100);
  const score = Math.floor(validKpm * (validAccuracy / 100) ** 3);
  return Number.isFinite(score) ? score : 0;
}

export function calculateScore(totalKeys: number, missCount: number, elapsedSeconds: number): ScoreResult {
  const validKeys = nonNegativeFinite(totalKeys);
  const validMisses = nonNegativeFinite(missCount);
  const validTime = nonNegativeFinite(elapsedSeconds);
  const attempts = validKeys + validMisses;
  const kpm = validTime === 0 ? 0 : Math.floor((validKeys / validTime) * 60);
  const accuracy = attempts === 0 ? 0 : Math.floor((validKeys / attempts) * 100);
  const eTypingScore = calculateETypingScore(kpm, accuracy);
  return { kpm, accuracy, eTypingScore, time: validTime };
}
