'use client';

import Link from 'next/link';

export default function TypingTitle() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center">
        {/* HHKBユーザーに刺さるような、ちょっとミニマルなデザイン */}
        <h1 className="text-6xl font-black text-gray-800 mb-4 tracking-tighter">
          Wiki<span className="text-blue-500">Typing</span>
        </h1>
        <p className="text-gray-400 mb-12 font-medium">Wikipediaの記事で知を磨く、究極のタイピング体験</p>

        <div className="space-y-6">
          <Link 
            href="/game" 
            className="block w-64 py-4 bg-gray-900 text-white rounded-xl font-bold text-xl hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl mx-auto"
          >
            GAME START
          </Link>
          
          <div className="text-sm text-gray-400">
            <p>Ready to use your HHKB?</p>
            <p className="mt-1 italic">ホームポジションを確認してください</p>
          </div>
        </div>
        <div className="mt-12 text-sm text-gray-500">
            <Link href="/settings" className="hover:underline">Settings</Link>
        </div>
      </div>
    </main>
  );
}