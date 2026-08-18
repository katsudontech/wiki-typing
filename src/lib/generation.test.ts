import { describe, expect, it } from "vitest";
import { createGeminiResponseSchema, parseGeminiResponse, typingRequestSchema } from "./generation";

describe("typingRequestSchema", () => {
  it("通常値、境界値、trimしたカテゴリを受け入れる", () => {
    for (const maxLength of [10, 500, 1000]) {
      expect(typingRequestSchema.parse({ maxLength, category: " 科学 " })).toEqual({ maxLength, category: "科学" });
    }
  });

  it("範囲外、小数、非有限値、文字列のmaxLengthを拒否する", () => {
    for (const maxLength of [9, 1001, 10.5, Number.NaN, Number.POSITIVE_INFINITY, "100"]) {
      expect(() => typingRequestSchema.parse({ maxLength, category: "科学" })).toThrow();
    }
  });

  it("空または過度に長いcategoryを拒否する", () => {
    for (const category of ["", "   ", 123, "a".repeat(51)]) {
      expect(() => typingRequestSchema.parse({ maxLength: 100, category })).toThrow();
    }
  });
});

describe("Geminiレスポンス検証", () => {
  it("正常な構造化レスポンスを受け入れる", () => {
    const value = { segments: [{ text: "吾輩", reading: "わがはい" }, { text: "は猫である", reading: "はねこである" }] };
    expect(parseGeminiResponse(JSON.stringify(value), 100).segments).toHaveLength(2);
  });

  it("空配列、不足フィールド、不正な型、入力不能な読み、長すぎる文を拒否する", () => {
    const invalidValues: unknown[] = [
      { segments: [] },
      { segments: [{ text: "猫" }] },
      { segments: [{ text: 1, reading: "ねこ" }] },
      { segments: [{ text: "猫", reading: "neko" }] },
      { segments: [{ text: "猫".repeat(121), reading: "ねこ" }] },
    ];
    for (const value of invalidValues) {
      expect(() => createGeminiResponseSchema(100).parse(value)).toThrow();
    }
  });
});
