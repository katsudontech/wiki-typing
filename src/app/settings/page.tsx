'use client';

import Link from 'next/link';

export default function SettingsPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4 tracking-tighter">
          Settings
        </h1>
        <p className="text-gray-400 mb-12 font-medium">設定は現在ありません。お楽しみに！</p>
        <Link 
          href="/" 
          className="block w-48 py-3 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 shadow-xl mx-auto"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}