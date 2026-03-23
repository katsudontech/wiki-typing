'use server';

import { GoogleGenerativeAI } from "@google/generative-ai";
import { revalidatePath } from 'next/cache';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // 最新の高速モデルを使おう！

// ▼ タイピング用のお題を生成するアクション
export async function getTypingText(maxLength: number = 500, category: string = '') {
  try {
    let pageId;

    // カテゴリ（キーワード）が指定されている場合は、そのキーワードで検索してランダムに取得
    if (category.trim() !== '') {
      // 検索パラメータを厳密なincategoryから、通常のキーワード検索に変更
      const searchUrl = `https://ja.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(category.trim())}&srlimit=50`;
      const searchRes = await fetch(searchUrl, { cache: 'no-store' });
      const searchData = await searchRes.json();
      const results = searchData.query?.search;
      
      if (results && results.length > 0) {
        // 検索結果からランダムに1つの記事を選ぶ
        const randomItem = results[Math.floor(Math.random() * results.length)];
        pageId = randomItem.pageid;
      }
    }

    // カテゴリ指定がない、あるいは検索結果が見つからなかった場合は完全ランダム
    if (!pageId) {
      const wikiApiUrl = 'https://ja.wikipedia.org/w/api.php?action=query&format=json&list=random&rnnamespace=0&rnlimit=1';
      const wikiRes = await fetch(wikiApiUrl, { cache: 'no-store' });
      const wikiData = await wikiRes.json();
      pageId = wikiData.query.random[0].id;
    }

    const textApiUrl = `https://ja.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exintro=&explaintext=&pageids=${pageId}`;
    const textRes = await fetch(textApiUrl);
    const textData = await textRes.json();
    const originalText = textData.query.pages[pageId].extract;
    const pageTitle = textData.query.pages[pageId].title;

    if (!originalText || originalText.length < 50) throw new Error('Short text');

    // 2. Gemini APIで変換
    const prompt = `以下の日本語を、タイピング練習の文章として
ふさわしい形で、最大${maxLength}文字に要約した上で、
元の文章（漢字交じり）と、その読み方（全てひらがな）を、意味のまとまりごとに分割してJSON配列で返して。
    【超重要ルール】
    1. 読み方（reading）側には、『』や「」、（）などの記号を絶対に含まないこと。空文字（""）にして。
    2. 句読点（。、）もタイピングの邪魔になるので、読み方（reading）側からは取り除き、空文字（""）にして。
    3. 全て繋げたときに元の文章になるように。

    フォーマット例:
    {
      "segments": [
        {"text": "吾輩", "reading": "わがはい"},
        {"text": "は", "reading": "は"},
        {"text": "猫", "reading": "ねこ"},
        {"text": "である", "reading": "である"},
        {"text": "。", "reading": ""}
      ]
    }
    
    テキスト：${originalText}`;
    const result = await model.generateContent(prompt);
    const geminiRes = result.response.text();
    
    // JSON部分だけを抽出してパース
    const jsonMatch = geminiRes.match(/\{.*\}/s);
    if (!jsonMatch) throw new Error('Invalid Gemini Response');
    
    const parsedData = JSON.parse(jsonMatch[0]);
    
    let fullKanji = "";
    let fullHiragana = "";
    if (parsedData.segments) {
      for (const seg of parsedData.segments) {
        fullKanji += seg.text;
        fullHiragana += seg.reading;
      }
    }
    const data = {
      kanji: fullKanji,
      hiragana: fullHiragana,
      segments: parsedData.segments
    };
    const wikiUrl = `https://ja.wikipedia.org/?curid=${pageId}`;

    return { ...data, url: wikiUrl, title: pageTitle };

  } catch (error) {
    console.error(error);
    return { error: '取得に失敗しました' };
  }
}