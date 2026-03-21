'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type HistoryRecord = {
  kanji: string;
  title?: string;
  url?: string;
  kpm: number;
  accuracy: number;
  eTypingScore?: number;
  time: number;
  date: string;
};

export default function StatsPage() {
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [chartMode, setChartMode] = useState<'kpm' | 'etyping'>('etyping');

  useEffect(() => {
    const savedHistory = localStorage.getItem('typingHistory');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory) as HistoryRecord[];
        // 古いデータにはeTypingScoreがない可能性があるので補完する
        const dataWithScore = parsed.map(record => ({
          ...record,
          eTypingScore: record.eTypingScore ?? Math.floor(record.kpm * Math.pow(record.accuracy / 100, 3))
        }));
        // 最新の記録が上に来るように反転
        setHistory(dataWithScore.reverse());
      } catch (e) {
        console.error("履歴の読み込みに失敗しました", e);
      }
    }
  }, []);

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="w-full max-w-4xl bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">
            Typing History
          </h1>
          <Link 
            href="/" 
            className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-md"
          >
            Back to Home
          </Link>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-xl font-medium mb-4">まだ履歴がありません</p>
            <p>ゲームをプレイして記録を残しましょう！</p>
          </div>
        ) : (
          <>
            <div className="mb-12 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-700">
                  {chartMode === 'kpm' ? 'KPM (Speed) Transition' : 'E-Typing Score Transition'}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setChartMode('kpm')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      chartMode === 'kpm' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    KPM
                  </button>
                  <button
                    onClick={() => setChartMode('etyping')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                      chartMode === 'etyping' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Score
                  </button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...history].reverse()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(val) => {
                        const d = new Date(val);
                        return `${(d.getMonth()+1)}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                      }} 
                      tick={{ fontSize: 12, fill: '#888' }}
                      stroke="#e0e0e0"
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#888' }}
                      stroke="#e0e0e0" 
                    />
                    <Tooltip 
                      labelFormatter={(val) => {
                        const d = new Date(val as string);
                        return `${d.getFullYear()}/${(d.getMonth()+1)}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
                      }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey={chartMode === 'kpm' ? 'kpm' : 'eTypingScore'} 
                      stroke={chartMode === 'kpm' ? '#3b82f6' : '#16a34a'} 
                      strokeWidth={3}
                      dot={{ r: 4, fill: chartMode === 'kpm' ? '#3b82f6' : '#16a34a', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      name={chartMode === 'kpm' ? 'KPM' : 'E-Typing Score'}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="p-4 rounded-tl-xl font-semibold">Date</th>
                  <th className="p-4 font-semibold">Title (Wikipedia)</th>
                  <th className="p-4 font-semibold text-right">KPM</th>
                  <th className="p-4 font-semibold text-right">Score</th>
                  <th className="p-4 font-semibold text-right">Accuracy</th>
                  <th className="p-4 rounded-tr-xl font-semibold text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.map((record, index) => {
                  const dateObj = new Date(record.date);
                  const dateStr = `${dateObj.getFullYear()}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')} ${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`;
                  
                  return (
                    <tr key={index} className="hover:bg-blue-50 transition-colors group">
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {dateStr}
                      </td>
                      <td className="p-4">
                        {record.url ? (
                          <a 
                            href={record.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline line-clamp-1 max-w-xs md:max-w-md inline-flex items-center gap-1"
                            title={record.title || record.kanji}
                          >
                            {record.title || record.kanji}
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        ) : (
                          <div className="font-bold text-gray-800 line-clamp-1 max-w-xs md:max-w-md" title={record.title || record.kanji}>
                            {record.title || record.kanji}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-xl font-bold text-blue-600">{record.kpm}</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-help" title={`E-Typing Score = WPM × (正確率)^3\n(${record.kpm} × ${Math.pow(record.accuracy/100, 3).toFixed(3)})`}>
                          {record.eTypingScore}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="font-mono text-lg font-bold text-gray-700">{record.accuracy}%</span>
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <span className="font-mono text-gray-600">{record.time.toFixed(1)}s</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </main>
  );
}
