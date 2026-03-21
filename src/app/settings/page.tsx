'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [maxLength, setMaxLength] = useState(500);
  const [category, setCategory] = useState('');

  // ローカルストレージから設定を読み込む
  useEffect(() => {
    const savedMaxLength = localStorage.getItem('typingMaxLength');
    const savedCategory = localStorage.getItem('typingCategory');
    if (savedMaxLength) setMaxLength(Number(savedMaxLength));
    if (savedCategory) setCategory(savedCategory);
  }, []);

  // 設定を保存する
  const handleSave = () => {
    localStorage.setItem('typingMaxLength', maxLength.toString());
    localStorage.setItem('typingCategory', category);
    alert('設定を保存しました！');
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center tracking-tight">
          Settings
        </h1>
        
        <div className="space-y-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-bold text-gray-700">タイピング最大文字数</label>
            <input 
              type="number" 
              value={maxLength}
              onChange={(e) => setMaxLength(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              min={10}
              max={1000}
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label className="text-sm font-bold text-gray-700">Wikipediaのジャンル（カテゴリ）指定</label>
            <input 
              type="text" 
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="例: 歴史、コンピュータ"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500">※空白の場合はランダムになります</p>
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition"
          >
            設定を保存
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <Link 
            href="/" 
            className="inline-block px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}