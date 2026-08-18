"use client";

import Link from "next/link";
import { useState } from "react";
import { DEFAULT_CATEGORY, typingRequestSchema } from "@/lib/generation";
import { useLocalStorageValue } from "@/lib/local-storage";

type SettingsFormProps = { initialMaxLength: number; initialCategory: string };

function SettingsForm({ initialMaxLength, initialCategory }: SettingsFormProps) {
  const [maxLength, setMaxLength] = useState(initialMaxLength);
  const [category, setCategory] = useState(initialCategory);
  const [message, setMessage] = useState("");

  const handleSave = () => {
    const parsed = typingRequestSchema.safeParse({ maxLength, category });
    if (!parsed.success) {
      setMessage("文字数は10〜1000の整数、カテゴリは1〜50文字で入力してください。");
      return;
    }
    localStorage.setItem("typingMaxLength", String(parsed.data.maxLength));
    localStorage.setItem("typingCategory", parsed.data.category);
    setCategory(parsed.data.category);
    setMessage("設定を保存しました。");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <label htmlFor="maxLength" className="text-sm font-bold text-gray-700">タイピング最大文字数</label>
        <input id="maxLength" type="number" value={maxLength} onChange={(event) => setMaxLength(Number(event.target.value))} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" min={10} max={1000} step={1} />
      </div>
      <div className="flex flex-col space-y-2">
        <label htmlFor="category" className="text-sm font-bold text-gray-700">Wikipediaのジャンル（検索キーワード）</label>
        <input id="category" type="text" value={category} onChange={(event) => setCategory(event.target.value)} maxLength={50} placeholder="例: 歴史、コンピュータ" className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <p className="text-xs text-gray-500">無指定で遊ぶ場合は「ランダム」と入力してください。</p>
      </div>
      {message && <p role="status" className="text-sm text-gray-600">{message}</p>}
      <button type="button" onClick={handleSave} className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition">設定を保存</button>
    </div>
  );
}

export default function SettingsPage() {
  const storedMaxLength = useLocalStorageValue("typingMaxLength", "500");
  const storedCategory = useLocalStorageValue("typingCategory", DEFAULT_CATEGORY);
  const parsedMaxLength = Number(storedMaxLength);
  const initialMaxLength = Number.isInteger(parsedMaxLength) && parsedMaxLength >= 10 && parsedMaxLength <= 1000 ? parsedMaxLength : 500;
  const initialCategory = storedCategory.trim() || DEFAULT_CATEGORY;

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center tracking-tight">Settings</h1>
        <SettingsForm key={`${initialMaxLength}:${initialCategory}`} initialMaxLength={initialMaxLength} initialCategory={initialCategory} />
        <div className="mt-8 pt-6 border-t border-gray-100 text-center"><Link href="/" className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition">Back to Home</Link></div>
      </div>
    </main>
  );
}
