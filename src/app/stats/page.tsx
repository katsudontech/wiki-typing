"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { z } from "zod";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLocalStorageValue } from "@/lib/local-storage";
import { calculateETypingScore } from "@/lib/score";

const historyRecordSchema = z.object({
  kanji: z.string(),
  title: z.string().optional(),
  url: z.string().optional(),
  license: z.literal("CC BY-SA 4.0").optional(),
  processedBy: z.literal("Gemini").optional(),
  kpm: z.number().finite().nonnegative(),
  accuracy: z.number().finite().min(0).max(100),
  eTypingScore: z.number().finite().nonnegative().optional(),
  time: z.number().finite().nonnegative(),
  date: z.string(),
}).passthrough();

type HistoryRecord = z.infer<typeof historyRecordSchema> & { eTypingScore: number };

function parseHistory(serialized: string): HistoryRecord[] {
  try {
    const parsed: unknown = JSON.parse(serialized);
    const result = z.array(historyRecordSchema).safeParse(parsed);
    if (!result.success) return [];
    return result.data.map((record) => ({
      ...record,
      eTypingScore: record.eTypingScore ?? calculateETypingScore(record.kpm, record.accuracy),
    })).reverse();
  } catch {
    return [];
  }
}

export default function StatsPage() {
  const serializedHistory = useLocalStorageValue("typingHistory", "[]");
  const history = useMemo(() => parseHistory(serializedHistory), [serializedHistory]);
  const [chartMode, setChartMode] = useState<"kpm" | "etyping">("etyping");

  return (
    <main className="flex flex-col items-center justify-start min-h-screen bg-gray-50 p-6 md:p-12">
      <div className="w-full max-w-4xl bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <h1 className="text-4xl font-bold text-gray-800 tracking-tight">Typing History</h1>
          <Link href="/" className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition shadow-md">Back to Home</Link>
        </div>
        {history.length === 0 ? (
          <div className="text-center py-20 text-gray-400"><p className="text-xl font-medium mb-4">まだ履歴がありません</p><p>ゲームをプレイして記録を残しましょう！</p></div>
        ) : (
          <>
            <div className="mb-12 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-700">{chartMode === "kpm" ? "KPM (Speed) Transition" : "Score Transition"}</h2>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setChartMode("kpm")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${chartMode === "kpm" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>KPM</button>
                  <button type="button" onClick={() => setChartMode("etyping")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${chartMode === "etyping" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>Score</button>
                </div>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={[...history].reverse()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tickFormatter={(value) => { const date = new Date(value); return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`; }} tick={{ fontSize: 12, fill: "#888" }} stroke="#e0e0e0" />
                    <YAxis tick={{ fontSize: 12, fill: "#888" }} stroke="#e0e0e0" />
                    <Tooltip labelFormatter={(value) => new Date(value as string).toLocaleString("ja-JP")} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Line type="monotone" dataKey={chartMode === "kpm" ? "kpm" : "eTypingScore"} stroke={chartMode === "kpm" ? "#3b82f6" : "#16a34a"} strokeWidth={3} dot={{ r: 4 }} name={chartMode === "kpm" ? "KPM" : "Score"} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mb-4 text-sm text-gray-500">Score = KPM × (正確率 ÷ 100)³（小数点以下切り捨て）</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead><tr className="bg-gray-50 text-gray-500 text-sm uppercase tracking-wider"><th className="p-4 rounded-tl-xl font-semibold">Date</th><th className="p-4 font-semibold">Title (Wikipedia)</th><th className="p-4 font-semibold text-right">KPM</th><th className="p-4 font-semibold text-right">Score</th><th className="p-4 font-semibold text-right">Accuracy</th><th className="p-4 rounded-tr-xl font-semibold text-right">Time</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {history.map((record) => (
                    <tr key={`${record.date}:${record.title ?? record.kanji}`} className="hover:bg-blue-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">{new Date(record.date).toLocaleString("ja-JP")}</td>
                      <td className="p-4">{record.url ? <a href={record.url} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:text-blue-800 hover:underline line-clamp-1 max-w-md" title={record.title || record.kanji}>{record.title || record.kanji}</a> : <span className="font-bold text-gray-800 line-clamp-1 max-w-md">{record.title || record.kanji}</span>}</td>
                      <td className="p-4 text-right font-mono text-xl font-bold text-blue-600">{record.kpm}</td>
                      <td className="p-4 text-right"><span className="font-mono text-xl font-bold text-green-600 cursor-help" title={`Score = KPM × (正確率 ÷ 100)³\n${record.kpm} × (${record.accuracy} ÷ 100)³`}>{record.eTypingScore}</span></td>
                      <td className="p-4 text-right font-mono text-lg font-bold text-gray-700">{record.accuracy}%</td>
                      <td className="p-4 text-right whitespace-nowrap font-mono text-gray-600">{record.time.toFixed(1)}s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
