"use server";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  DEFAULT_CATEGORY,
  geminiResponseJsonSchema,
  parseGeminiResponse,
  type TypingSegment,
  typingRequestSchema,
} from "@/lib/generation";

const WIKIPEDIA_USER_AGENT = "WikiTyping/1.0 (https://github.com/katsudontech/wiki-typing)";
const WIKI_INPUT_LIMIT = 20_000;
const GEMINI_MODEL = "gemini-2.5-flash";
const SAFE_ERROR_MESSAGE = "文章を生成できませんでした。しばらく待ってから再試行してください。";

const searchResponseSchema = z.object({
  query: z.object({ search: z.array(z.object({ pageid: z.number().int().positive() })) }),
});
const randomResponseSchema = z.object({
  query: z.object({ random: z.array(z.object({ id: z.number().int().positive() })).min(1) }),
});
const pageResponseSchema = z.object({
  query: z.object({
    pages: z.record(z.string(), z.object({
      pageid: z.number().int().positive(),
      title: z.string().min(1),
      extract: z.string(),
    })),
  }),
});

export type WikipediaSource = {
  title: string;
  url: string;
  license: "CC BY-SA 4.0";
  processedBy: "Gemini";
};

export type TypingTextResult =
  | { success: true; data: { kanji: string; hiragana: string; segments: TypingSegment[]; source: WikipediaSource } }
  | { success: false; error: string };

async function fetchWikipediaJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "User-Agent": WIKIPEDIA_USER_AGENT },
  });
  if (!response.ok) throw new Error("Wikipedia request failed");
  return response.json() as Promise<unknown>;
}

async function selectPageId(category: string): Promise<number> {
  if (category !== DEFAULT_CATEGORY) {
    const searchUrl = `https://ja.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(category)}&srlimit=50`;
    const searchData = searchResponseSchema.parse(await fetchWikipediaJson(searchUrl));
    if (searchData.query.search.length > 0) {
      const selected = searchData.query.search[Math.floor(Math.random() * searchData.query.search.length)];
      return selected.pageid;
    }
  }

  const randomUrl = "https://ja.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=1";
  const randomData = randomResponseSchema.parse(await fetchWikipediaJson(randomUrl));
  return randomData.query.random[0].id;
}

async function generateSegments(sourceText: string, maxLength: number, apiKey: string): Promise<TypingSegment[]> {
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `以下の日本語をタイピング練習向けに最大${maxLength}文字で要約してください。
結果は指定されたJSON Schemaに従い、意味のまとまりごとのsegmentsに分割してください。
各textは漢字交じりの日本語、各readingは対応する読みをひらがなだけで記述してください。
句読点・括弧・記号・空白はtextとreadingの両方から除き、全要素のtextとreadingを空にしないでください。
readingを連結した文字列だけで元の要約全文をタイピングできるようにしてください。

Wikipedia本文:
${sourceText}`;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: geminiResponseJsonSchema,
        temperature: attempt === 0 ? 0.4 : 0.1,
      },
    });

    try {
      if (!response.text) throw new Error("Gemini returned no text");
      return parseGeminiResponse(response.text, maxLength).segments;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }

  throw new Error("Gemini response validation failed");
}

export async function getTypingText(
  maxLength: unknown = 500,
  category: unknown = DEFAULT_CATEGORY,
): Promise<TypingTextResult> {
  const request = typingRequestSchema.safeParse({ maxLength, category });
  if (!request.success) {
    return { success: false, error: "設定値が不正です。文字数とカテゴリを確認してください。" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Typing text generation failed: GEMINI_API_KEY is not configured");
    return { success: false, error: SAFE_ERROR_MESSAGE };
  }

  try {
    const pageId = await selectPageId(request.data.category);
    const textUrl = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&pageids=${pageId}`;
    const pageData = pageResponseSchema.parse(await fetchWikipediaJson(textUrl));
    const page = pageData.query.pages[String(pageId)] ?? Object.values(pageData.query.pages)[0];
    if (!page || page.extract.length < 50) throw new Error("Wikipedia article is too short");

    const segments = await generateSegments(page.extract.slice(0, WIKI_INPUT_LIMIT), request.data.maxLength, apiKey);
    return {
      success: true,
      data: {
        kanji: segments.map((segment) => segment.text).join(""),
        hiragana: segments.map((segment) => segment.reading).join(""),
        segments,
        source: {
          title: page.title,
          url: `https://ja.wikipedia.org/?curid=${page.pageid}`,
          license: "CC BY-SA 4.0",
          processedBy: "Gemini",
        },
      },
    };
  } catch (error) {
    console.error("Typing text generation failed", error instanceof Error ? error.name : "UnknownError");
    return { success: false, error: SAFE_ERROR_MESSAGE };
  }
}
