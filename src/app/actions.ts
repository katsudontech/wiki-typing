'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from 'next/cache';
import * as wanakana from 'wanakana';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" }); // 最新の高速モデルを使おう！

// ▼ タイピング用のお題を生成するアクション
export async function getTypingText() {
  try {
    // 1. Wikipediaからランダムな記事を取得（ロジックはさっきと同じ）
    const wikiApiUrl = 'https://ja.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=1';
    const wikiRes = await fetch(wikiApiUrl, { cache: 'no-store' }); // 常に新しい記事を
    const wikiData = await wikiRes.json();
    const pageId = wikiData.query.random[0].id;

    const textApiUrl = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&explaintext=&pageids=${pageId}`;
    const textRes = await fetch(textApiUrl);
    const textData = await textRes.json();
    const originalText = textData.query.pages[pageId].extract;

    if (!originalText || originalText.length < 50) throw new Error('Short text');

    // 2. Gemini APIで変換
    const prompt = `以下の日本語を、漢字と「全てひらがな」に変換してJSONで返して。
    【超重要ルール】
    1. ひらがな側には、『』や「」、（）などの記号を絶対に含まないこと。
    2. 句読点（。、）もタイピングの邪魔になるので、ひらがな側からは取り除いて。
    3. 全て繋げたひらがなのみを出力して。

    {"kanji": "...", "hiragana": "..."}
    テキスト：${originalText.substring(0, 500)}`;
    const result = await model.generateContent(prompt);
    const geminiRes = result.response.text();
    
    // JSON部分だけを抽出してパース
    const jsonMatch = geminiRes.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Invalid Gemini Response');
    
    const data = JSON.parse(jsonMatch[0]);

    const romaji = wanakana.toRomaji(data.hiragana);

    return { ...data, romaji: romaji.toLowerCase() };

  } catch (error) {
    console.error(error);
    return { error: '取得に失敗しました' };
  }
}