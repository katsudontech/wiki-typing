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
          
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-stretch justify-center gap-3">
          <Link
            href="/settings"
            className="inline-flex items-center justify-center w-64 sm:w-auto px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-100 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Settings
          </Link>
          <Link
            href="/stats"
            className="inline-flex items-center justify-center w-64 sm:w-auto px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold shadow-sm hover:bg-gray-100 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            Statistics
          </Link>
        </div>
      </div>
    </main>
  );
}