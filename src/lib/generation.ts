import { TypingText } from "@mogamoga1024/typing-jp";
import { z } from "zod";

export const DEFAULT_CATEGORY = "ランダム";
export const MAX_CATEGORY_LENGTH = 50;

export const typingRequestSchema = z.object({
  maxLength: z.number().finite().int().min(10).max(1000),
  category: z.string().trim().min(1).max(MAX_CATEGORY_LENGTH),
}).strict();

export const geminiResponseJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    segments: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          text: { type: "string" },
          reading: { type: "string" },
        },
        required: ["text", "reading"],
      },
    },
  },
  required: ["segments"],
} as const;

const segmentSchema = z.object({
  text: z.string().trim().min(1),
  reading: z.string().trim().min(1),
}).strict().superRefine((segment, context) => {
  if (!isTypingReadingSupported(segment.reading)) {
    context.addIssue({ code: "custom", path: ["reading"], message: "タイピングできない読み仮名です" });
  }
});

export type TypingSegment = z.infer<typeof segmentSchema>;

export function isTypingReadingSupported(reading: string): boolean {
  if (!/^[ぁ-ゖー]+$/u.test(reading)) return false;
  try {
    const typing = new TypingText(reading);
    return typing.remainingRoman.length > 0 && /^[\x20-\x7e]+$/.test(typing.remainingRoman);
  } catch {
    return false;
  }
}

export function createGeminiResponseSchema(maxLength: number) {
  const permittedLength = Math.ceil(maxLength * 1.2);
  return z.object({ segments: z.array(segmentSchema).min(1) }).strict().superRefine((value, context) => {
    const totalLength = value.segments.reduce((length, segment) => length + segment.text.length, 0);
    if (totalLength > permittedLength) {
      context.addIssue({ code: "custom", path: ["segments"], message: `生成文が許容文字数（${permittedLength}文字）を超えています` });
    }
  });
}

export function parseGeminiResponse(responseText: string, maxLength: number): { segments: TypingSegment[] } {
  const parsed: unknown = JSON.parse(responseText);
  return createGeminiResponseSchema(maxLength).parse(parsed);
}
