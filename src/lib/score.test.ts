import { describe, expect, it } from "vitest";
import { calculateScore } from "./score";

describe("calculateScore", () => {
  it("通常のKPM・正確率・スコアを計算する", () => {
    expect(calculateScore(100, 10, 60)).toEqual({ kpm: 100, accuracy: 90, eTypingScore: 72, time: 60 });
  });

  it("入力数が0でも有限値を返す", () => {
    expect(calculateScore(0, 0, 0)).toEqual({ kpm: 0, accuracy: 0, eTypingScore: 0, time: 0 });
  });

  it("正確率が0ならスコアも0になる", () => {
    expect(calculateScore(0, 10, 60)).toMatchObject({ kpm: 0, accuracy: 0, eTypingScore: 0 });
  });

  it("NaNやInfinityを渡しても非有限値を返さない", () => {
    const result = calculateScore(Number.POSITIVE_INFINITY, Number.NaN, 0);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });
});
