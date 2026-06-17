require('dotenv').config({ path: '.env.local' });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

async function run() {
  const prompt = `以下の日本語を、タイピング練習の文章として... テキスト：吾輩は猫である。`;
  const result = await model.generateContent(prompt);
  console.log(result.response.text());
}
run().catch(console.error);
