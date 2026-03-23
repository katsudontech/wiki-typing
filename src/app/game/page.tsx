'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTypingText } from './actions';
import { TypingText } from "@mogamoga1024/typing-jp";

export default function TypingGame() {
  // --- 状態管理 (State) ---
  const [kanji, setKanji] = useState(''); // 漢字（お題）
  const [segments, setSegments] = useState<{text: string, reading: string}[]>([]); // 追加: お題の分割データ
  const [typing, setTyping] = useState<TypingText | null>(null); // タイピングロジック
  const [loading, setLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // 🌟 表示用State：これを作ることで1打鍵ごとの更新を確実に反映させる
  const [display, setDisplay] = useState({
    completedText: '',
    remainingText: '',
    completedRoman: '',
    remainingRoman: ''
  });

  // スコア・記録用
  const [missCount, setMissCount] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [results, setResults] = useState<{ kpm: number; accuracy: number; time: number } | null>(null);
  const [wikiInfo, setWikiInfo] = useState<{ title: string; url: string }>({ title: '', url: '' });

  // --- 補助関数 ---

  // 🌟 ロジック内の文字列をStateに同期する関数
  const syncDisplay = useCallback((t: TypingText) => {
    setDisplay({
      completedText: t.completedText,
      remainingText: t.remainingText,
      completedRoman: t.completedRoman,
      remainingRoman: t.remainingRoman,
    });
  }, []);

  // お題を取得して初期化する
  const fetchNewText = useCallback(async () => {
    setLoading(true);
    setResults(null);
    const maxTextLength = localStorage.getItem('typingMaxLength') ? Number(localStorage.getItem('typingMaxLength')) : 500;
    const category = localStorage.getItem('typingCategory') || '';
    const result = await getTypingText(maxTextLength, category);
    if ('error' in result && result.error) {
      setIsError(true);
      setLoading(false);
      return;
    }
    
    // @ts-ignore
    const { kanji: resKanji, segments: resSegments, title: resTitle, url: resUrl, hiragana: resHiragana } = result;
    
    setKanji(resKanji);
    setSegments(resSegments || []); // 🌟 セグメント情報をStateに保存
    setWikiInfo({ title: resTitle || '', url: resUrl || '' });
    // 🌟 記号を取り除いてからライブラリに渡す
    const cleanHiragana = resHiragana.replace(/[『』「」()（）]/g, '');
    const newTyping = new TypingText(cleanHiragana);
      
    setTyping(newTyping);
    syncDisplay(newTyping); // 初期状態を同期
    setStartTime(null);
    setMissCount(0);
    
    setLoading(false);
  }, [syncDisplay]);

  // --- Effect (副作用) ---

  // 初回読み込み
  useEffect(() => {
    fetchNewText();
  }, [fetchNewText]);

  // キーボードイベントの監視
  useEffect(() => {
    // typingがない、または結果表示中はイベントを無視
    if (!typing || results) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (!TypingText.isValidInputKey(e.key)) return;

      // 最初の1打でタイマー開始
      let currentStartTime = startTime;
      if (currentStartTime === null) {
        currentStartTime = Date.now();
        setStartTime(currentStartTime);
      }

      const isCapsLock = e.getModifierState("CapsLock");
      const result = typing.inputKey(e.key, isCapsLock);
      
      switch (result) {
        case "unmatch":
          setIsError(true);
          setMissCount(prev => prev + 1);
          setTimeout(() => setIsError(false), 100);
          break;

        case "incomplete":
          // 正解だが未完了：何もしなくても最後に同期される
          break;

        case "complete":
          const endTime = Date.now();
          const timeInSeconds = (endTime - currentStartTime) / 1000;
          const totalKeys = typing.completedRoman.length;
          // KPM: (打鍵数 / 秒) * 60
          const kpm = Math.floor((totalKeys / timeInSeconds) * 60);
          // 正確率: 正解文字数 / (正解文字数 + ミス数)
          const accuracy = Math.floor((totalKeys / (totalKeys + missCount)) * 100);
          // e-typingのスコア
          const eTypingScore = Math.floor(kpm * ((accuracy / 100) ** 3));

          //localStorageに記録を保存
          const history = JSON.parse(localStorage.getItem('typingHistory') || '[]');
          history.push({ 
            kanji, 
            title: wikiInfo.title,
            url: wikiInfo.url,
            kpm, 
            accuracy, 
            eTypingScore,
            time: timeInSeconds, 
            date: new Date().toISOString() 
          });
          localStorage.setItem('typingHistory', JSON.stringify(history));

          setResults({ kpm, accuracy, time: timeInSeconds });
          break;
      }

      // 🌟 毎回必ずStateを更新して画面をリライトさせる！
      syncDisplay(typing);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [typing, startTime, missCount, results, syncDisplay, kanji, wikiInfo]);

  // --- レンダリング (UI) ---

  if (loading || (!typing && !results)) {
    return (
      <main className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-xl text-gray-500">Wikipediaから記事を抽出中...</p>
        </div>
      </main>
    );
  }

  return (
    <main className={`flex flex-col items-center justify-center min-h-screen transition-colors duration-100 
      ${isError ? 'bg-red-50' : 'bg-gray-50'}`}>
      
      {results ? (
        /* スコア結果表示画面 */
        <div className="text-center bg-white p-12 rounded-3xl shadow-2xl border-4 border-green-400 animate-in fade-in zoom-in duration-300">
          <h2 className="text-3xl font-bold mb-8 text-green-600">Clear! 🎉</h2>
          <div className="grid grid-cols-3 gap-12 mb-10">
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">KPM (Speed)</p>
              <p className="text-6xl font-black text-gray-800">{results.kpm}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Accuracy</p>
              <p className="text-6xl font-black text-gray-800">{results.accuracy}<span className="text-2xl">%</span></p>
            </div>
            <div>
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">Time</p>
              <p className="text-6xl font-black text-gray-800">{results.time.toFixed(1)}<span className="text-2xl">s</span></p>
            </div>
          </div>
          <button 
            onClick={fetchNewText} 
            className="bg-green-500 text-white px-12 py-4 rounded-full font-bold text-xl hover:bg-green-600 transition shadow-lg active:scale-95"
          >
            Next Challenge
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="ml-4 bg-gray-300 text-gray-800 px-8 py-3 rounded-full font-medium text-lg hover:bg-gray-400 transition"
          >
            Return to Tiltle
          </button>
        </div>
      ) : (
        /* 通常のタイピング画面 */
        <div className="max-w-5xl w-full px-4 md:px-8 text-center flex flex-col max-h-[95vh] py-8">
          {/* お題（漢字交じり）の表示部分：文字を小さくし、長ければスクロール */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-y-auto max-h-[25vh] text-left">
            <h1 className="text-xl md:text-2xl font-bold text-gray-700 leading-relaxed">
              {(() => {
                if (!segments || segments.length === 0) return kanji;
                
                let currentCompletedLength = display.completedText.length;
                let readingOffset = 0;

                return segments.map((seg, i) => {
                  const segReadingLength = seg.reading.length;
                  // readingが空（記号など）の場合、直前の文字が完了していれば一緒に完了とするなど
                  const isCompleted = (readingOffset + segReadingLength <= currentCompletedLength) && (segReadingLength > 0 || readingOffset <= currentCompletedLength);
                  const isCurrent = !isCompleted && readingOffset <= currentCompletedLength;
                  
                  readingOffset += segReadingLength;

                  if (isCompleted) {
                    return <span key={i} className="text-gray-300">{seg.text}</span>;
                  } else if (isCurrent) {
                    return <span key={i} className="text-blue-500">{seg.text}</span>;
                  } else {
                    return <span key={i}>{seg.text}</span>;
                  }
                });
              })()}
            </h1>
          </div>

          {/* タイピング入力部分（ローマ字・ひらがな）：アルファベットを小さくし、枠内に収める */}
          <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-2xl border border-gray-100 mb-6 relative text-left overflow-y-auto max-h-[50vh]">
            {/* 装飾用の背景ロゴ的なもの */}
            <div className="absolute top-6 right-8 text-gray-100 font-black text-xl select-none">HHKB TYPE</div>
            
            {/* ひらがなガイド */}
            <div className="text-lg md:text-xl mb-4 font-medium tracking-[0.2em] min-h-[2rem]">
              <span className="text-gray-200">{display.completedText}</span>
              <span className="text-blue-500">{display.remainingText}</span>
            </div>

            {/* メインのローマ字表示 (text-6xl から 3xl に縮小) */}
            <div className="text-3xl md:text-4xl font-mono tracking-wider break-all leading-relaxed">
              <span className="text-gray-200">{display.completedRoman}</span>
              <span className="text-gray-800">{display.remainingRoman}</span>
            </div>
          </div>

          {/* 下部のインフォメーション */}
          <div className="flex justify-between items-center text-gray-400 text-sm px-2 md:px-6 mt-auto">
            <div className="flex gap-8">
              <span>MISS: <span className={`font-bold ${missCount > 0 ? 'text-red-400' : 'text-gray-300'}`}>{missCount}</span></span>
              <span>PROGRESS: <span className="text-gray-600 font-bold">{Math.floor((display.completedText.length / (display.completedText.length + display.remainingText.length || 1)) * 100)}%</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${startTime ? 'bg-green-400 animate-pulse' : 'bg-gray-300'}`}></div>
              <p className="italic font-serif">Typing Journey with Wikipedia</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}