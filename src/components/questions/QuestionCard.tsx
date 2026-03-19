'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { GameQuestion, SCORE_LABELS, ScoreKey } from '@/types';
import { synthCorrect, synthWrong, synthTick } from '@/lib/audio';

interface QuestionCardProps {
  question: GameQuestion;
  onAnswer: (answerIndex: number) => void;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    const id = segments.at(-1);
    if (!id) return null;
    return `https://www.ardmediathek.de/embed/video/${id}`;
  } catch {
    return null;
  }
}

export default memo(function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCorrect = selected === question.correctIndex;
  const embedUrl = question.url ? getEmbedUrl(question.url) : null;

  // Typewriter effect for question text
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setDisplayedText('');
    setTypingDone(false);
    let i = 0;
    const text = question.question;
    intervalRef.current = setInterval(() => {
      if (i >= text.length) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setTypingDone(true);
        return;
      }
      i++;
      setDisplayedText(text.slice(0, i));
      if (i % 3 === 0) synthTick();
    }, 22);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [question.question]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    if (idx === question.correctIndex) synthCorrect(); else synthWrong();
  };

  // Format points display
  const pointsDisplay = Object.entries(question.points)
    .filter(([, v]) => (v as number) !== 0)
    .map(([k, v]) => `${(v as number) > 0 ? '+' : ''}${v} ${SCORE_LABELS[k as ScoreKey] ?? k}`)
    .join(', ');

  return (
    <div className="bg-slate-800/95 backdrop-blur rounded-2xl max-w-xl w-full mx-auto border border-slate-700 shadow-2xl animate-[fadeIn_0.3s_ease-out] max-h-[90dvh] overflow-y-auto">

      {/* Video embed */}
      {embedUrl && (
        <div className="relative w-full rounded-t-2xl overflow-hidden" style={{ paddingBottom: '56.25%' }}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={question.title}
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="px-3 py-1 bg-blue-600/30 text-blue-300 text-xs font-medium rounded-full">❓ Frage</span>
          <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">{question.category}</span>
          {question.url && (
            <a href={question.url} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-slate-500 hover:text-blue-400 text-xs transition-colors shrink-0">
              Mediathek ↗
            </a>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{question.title}</h3>
        <p className="text-slate-200 mb-4 text-base leading-relaxed">{displayedText}{!typingDone && <span className="animate-pulse">▋</span>}</p>

        {/* Options — fade in after typing completes */}
        <div className={`space-y-2 transition-opacity duration-500 ${typingDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {question.options.map((opt, i) => {
            let cls = 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-white';
            if (revealed) {
              if (i === question.correctIndex) cls = 'border-green-500 bg-green-900/40 text-green-300';
              else if (i === selected && !isCorrect) cls = 'border-red-500 bg-red-900/40 text-red-300';
              else cls = 'border-slate-700 bg-slate-800/50 text-slate-500';
            }
            return (
              <button key={i} onClick={() => handleSelect(i)} disabled={revealed}
                className={`w-full p-3 rounded-xl border-2 text-left transition-all ${cls} disabled:cursor-default`}>
                <span className="font-medium mr-2 text-slate-400">{String.fromCharCode(65 + i)}.</span>
                {opt}
                {revealed && i === question.correctIndex && ' ✅'}
                {revealed && i === selected && !isCorrect && ' ❌'}
              </button>
            );
          })}
        </div>

        {/* Feedback */}
        {revealed && (
          <div className={`mt-4 p-3 rounded-xl border ${isCorrect ? 'border-green-600 bg-green-900/20 text-green-300' : 'border-red-600 bg-red-900/20 text-red-300'}`}>
            <p className="font-bold mb-1">{isCorrect ? '🎉 Richtig!' : '❌ Leider falsch!'}</p>
            <p className="text-sm text-slate-300 mt-1">{question.insight}</p>
            {isCorrect && pointsDisplay && (
              <p className="text-xs text-blue-300 mt-1">🎯 {pointsDisplay}</p>
            )}
            <button
              onClick={() => onAnswer(selected!)}
              className="mt-3 w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
            >
              Weiter →
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
