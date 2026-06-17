require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  const prompt = `以下の日本語を、タイピング練習の文章として
ふさわしい形で、最大1000文字に要約した上で、
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
    
    テキスト：科学（かがく、英: science）とは、一定の目的・方法のもとに種々の事象を研究する認識の活動、およびその客観的な知識の体系。`;
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}
run().catch(console.error);
