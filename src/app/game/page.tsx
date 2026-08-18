"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { TypingText } from "@mogamoga1024/typing-jp";
import { DEFAULT_CATEGORY, type TypingSegment } from "@/lib/generation";
import { calculateScore, type ScoreResult } from "@/lib/score";
import { getTypingText, type WikipediaSource } from "./actions";

const emptyDisplay = { completedText: "", remainingText: "", completedRoman: "", remainingRoman: "" };

function SourceAttribution({ source }: { source: WikipediaSource }) {
  return (
    <div className="text-sm text-gray-500 leading-relaxed">
      <p>
        出典: Wikipedia「
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          {source.title}
        </a>
        」（{source.license}）
      </p>
      <p>{source.processedBy}で要約・読み仮名を生成しています</p>
    </div>
  );
}

export default function TypingGame() {
  const [kanji, setKanji] = useState("");
  const [segments, setSegments] = useState<TypingSegment[]>([]);
  const [typing, setTyping] = useState<TypingText | null>(null);
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [display, setDisplay] = useState(emptyDisplay);
  const [missCount, setMissCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<ScoreResult | null>(null);
  const [wikiInfo, setWikiInfo] = useState<WikipediaSource | null>(null);

  const didInitialFetchRef = useRef(false);
  const requestInFlightRef = useRef(false);
  const currentKanjiSegmentRef = useRef<HTMLSpanElement | null>(null);
  const romanCaretRef = useRef<HTMLSpanElement | null>(null);
  const setCurrentKanjiSegmentEl = useCallback((element: HTMLSpanElement | null) => {
    currentKanjiSegmentRef.current = element;
  }, []);

  const syncDisplay = useCallback((text: TypingText) => {
    setDisplay({
      completedText: text.completedText,
      remainingText: text.remainingText,
      completedRoman: text.completedRoman,
      remainingRoman: text.remainingRoman,
    });
  }, []);

  const fetchNewText = useCallback(async () => {
    if (requestInFlightRef.current) return;
    requestInFlightRef.current = true;
    setLoading(true);
    setIsError(false);
    setErrorMessage("");
    setResults(null);

    try {
      const storedMaxLength = localStorage.getItem("typingMaxLength");
      const maxTextLength = storedMaxLength === null ? 500 : Number(storedMaxLength);
      const category = localStorage.getItem("typingCategory")?.trim() || DEFAULT_CATEGORY;
      const result = await getTypingText(maxTextLength, category);

      if (!result.success) {
        setIsError(true);
        setErrorMessage(result.error);
        setTyping(null);
        return;
      }

      const { kanji: nextKanji, segments: nextSegments, source, hiragana } = result.data;
      const nextTyping = new TypingText(hiragana);
      setKanji(nextKanji);
      setSegments(nextSegments);
      setWikiInfo(source);
      setTyping(nextTyping);
      syncDisplay(nextTyping);
      setStartTime(null);
      setMissCount(0);
    } catch (error) {
      console.error("Failed to initialize typing text", error instanceof Error ? error.name : "UnknownError");
      setIsError(true);
      setErrorMessage("タイピング文章を準備できませんでした。再試行してください。");
      setTyping(null);
    } finally {
      requestInFlightRef.current = false;
      setLoading(false);
    }
  }, [syncDisplay]);

  useEffect(() => {
    if (didInitialFetchRef.current) return;
    didInitialFetchRef.current = true;
    void fetchNewText();
  }, [fetchNewText]);

  useEffect(() => {
    if (!typing || results) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || !TypingText.isValidInputKey(event.key)) return;

      let currentStartTime = startTime;
      if (currentStartTime === null) {
        currentStartTime = Date.now();
        setStartTime(currentStartTime);
      }

      const inputResult = typing.inputKey(event.key, event.getModifierState("CapsLock"));
      switch (inputResult) {
        case "unmatch":
          setIsError(true);
          setMissCount((previous) => previous + 1);
          window.setTimeout(() => setIsError(false), 100);
          break;
        case "incomplete":
          break;
        case "complete": {
          const score = calculateScore(
            typing.completedRoman.length,
            missCount,
            (Date.now() - currentStartTime) / 1000,
          );
          let history: unknown[] = [];
          try {
            const stored: unknown = JSON.parse(localStorage.getItem("typingHistory") || "[]");
            if (Array.isArray(stored)) history = stored;
          } catch {
            history = [];
          }
          history.push({
            kanji,
            title: wikiInfo?.title,
            url: wikiInfo?.url,
            license: wikiInfo?.license,
            processedBy: wikiInfo?.processedBy,
            ...score,
            date: new Date().toISOString(),
          });
          localStorage.setItem("typingHistory", JSON.stringify(history));
          setResults(score);
          break;
        }
      }
      syncDisplay(typing);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [kanji, missCount, results, startTime, syncDisplay, typing, wikiInfo]);

  useEffect(() => {
    if (results) return;
    const frameId = window.requestAnimationFrame(() => {
      currentKanjiSegmentRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
      romanCaretRef.current?.scrollIntoView({ block: "center", inline: "nearest" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [display.completedRoman.length, display.completedText.length, results, segments.length]);

  if (loading || (!typing && !results)) {
    return (
      <main className={`flex items-center justify-center min-h-screen ${isError ? "bg-red-50" : "bg-gray-50"}`}>
        <div className="text-center px-4">
          {isError ? (
            <>
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-xl text-red-600 font-bold mb-2">テキストの生成に失敗しました</p>
              <p className="text-gray-600 mb-4">{errorMessage}</p>
              <button type="button" onClick={() => void fetchNewText()} disabled={loading} className="bg-red-500 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-bold hover:bg-red-600 transition">
                再試行する
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-xl text-gray-500">Wikipediaから記事を抽出中...</p>
            </>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-100 ${isError ? "bg-red-50" : "bg-gray-50"}`}>
      {results ? (
        <div className="text-center bg-white p-8 md:p-12 rounded-3xl shadow-2xl border-4 border-green-400 animate-in fade-in zoom-in duration-300 max-w-4xl mx-4">
          <h2 className="text-3xl font-bold mb-8 text-green-600">Clear! 🎉</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">KPM</p><p className="text-5xl font-black text-gray-800">{results.kpm}</p></div>
            <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Score</p><p className="text-5xl font-black text-gray-800">{results.eTypingScore}</p></div>
            <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Accuracy</p><p className="text-5xl font-black text-gray-800">{results.accuracy}<span className="text-2xl">%</span></p></div>
            <div><p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Time</p><p className="text-5xl font-black text-gray-800">{results.time.toFixed(1)}<span className="text-2xl">s</span></p></div>
          </div>
          <p className="text-sm text-gray-500 mb-6">Score = KPM × (正確率 ÷ 100)³（小数点以下切り捨て）</p>
          {wikiInfo && <div className="mb-8"><SourceAttribution source={wikiInfo} /></div>}
          <button type="button" onClick={() => void fetchNewText()} disabled={loading} className="bg-green-500 disabled:bg-gray-400 text-white px-10 py-3 rounded-full font-bold text-lg hover:bg-green-600 transition shadow-lg active:scale-95">Next Challenge</button>
          <Link href="/" className="ml-4 inline-block bg-gray-300 text-gray-800 px-8 py-3 rounded-full font-medium text-lg hover:bg-gray-400 transition">Return to Title</Link>
        </div>
      ) : (
        <div className="max-w-5xl w-full px-4 md:px-8 text-center flex flex-col max-h-[95vh] py-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-4 overflow-y-auto max-h-[25vh] text-left">
            <h1 className="text-xl md:text-2xl font-bold text-gray-700 leading-relaxed">
              {segments.length === 0 ? kanji : (() => {
                const completedLength = display.completedText.length;
                let readingOffset = 0;
                return segments.map((segment, index) => {
                  const readingLength = segment.reading.length;
                  const isCompleted = readingOffset + readingLength <= completedLength;
                  const isCurrent = !isCompleted && readingOffset <= completedLength;
                  readingOffset += readingLength;
                  if (isCompleted) return <span key={index} className="text-gray-300">{segment.text}</span>;
                  if (isCurrent) return <span key={index} ref={setCurrentKanjiSegmentEl} className="text-blue-500">{segment.text}</span>;
                  return <span key={index}>{segment.text}</span>;
                });
              })()}
            </h1>
          </div>
          {wikiInfo && <div className="mb-4"><SourceAttribution source={wikiInfo} /></div>}
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-gray-100 mb-6 relative text-left overflow-y-auto max-h-[50vh]">
            <div className="absolute top-6 right-8 text-gray-100 font-black text-xl select-none">HHKB TYPE</div>
            <div className="text-lg md:text-xl mb-4 font-medium tracking-[0.2em] min-h-[2rem]"><span className="text-gray-200">{display.completedText}</span><span className="text-blue-500">{display.remainingText}</span></div>
            <div className="text-3xl md:text-4xl font-mono tracking-wider break-all leading-relaxed"><span className="text-gray-200">{display.completedRoman}</span><span ref={romanCaretRef} aria-hidden className="inline-block w-0 h-0" /><span className="text-gray-800">{display.remainingRoman}</span></div>
          </div>
          <div className="flex justify-between items-center text-gray-400 text-sm px-2 md:px-6 mt-auto">
            <div className="flex gap-8"><span>MISS: <span className={`font-bold ${missCount > 0 ? "text-red-400" : "text-gray-300"}`}>{missCount}</span></span><span>PROGRESS: <span className="text-gray-600 font-bold">{Math.floor((display.completedText.length / (display.completedText.length + display.remainingText.length || 1)) * 100)}%</span></span></div>
            <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${startTime ? "bg-green-400 animate-pulse" : "bg-gray-300"}`} /><p className="italic font-serif">Typing Journey with Wikipedia</p></div>
          </div>
        </div>
      )}
    </main>
  );
}
