'use client';
import { useState, useEffect, useRef, memo } from 'react';
import { GameQuestion, SCORE_LABELS, ScoreKey } from '@/types';
import { synthCorrect, synthWrong, synthTick, setSilenced } from '@/lib/audio';
import { pauseForVideo, resumeAfterVideo } from '@/lib/bgmManager';
import { QuestionIcon } from '@/components/icons/GameIcons';

interface QuestionCardProps {
  question: GameQuestion;
  onAnswer: (answerIndex: number) => void;
}

interface Stream { url: string; type: string; }
type VideoStatus = 'loading' | 'stream' | 'embed' | 'none';

const CATEGORY_IMAGES: Record<string, string> = {
  sport: '/Sport.png', grundwissen: '/Grundwissen.png',
  geschichte: '/Geschichte.png', kultur: '/Kultur.png', musik: '/Musik.png',
};
function getCategoryImage(category: string): string {
  return CATEGORY_IMAGES[category.toLowerCase()] ?? '/Random.png';
}

function getVideoId(url: string): string | null {
  try {
    const id = new URL(url).pathname.split('/').findLast(Boolean);
    return id ?? null;
  } catch { return null; }
}

function pickStream(streams: Stream[]): string | null {
  const mp4s = streams.filter(s => s.type === 'video/mp4' || s.url.includes('.mp4'));
  const hls  = streams.find(s => s.type.includes('mpegURL') || s.url.includes('.m3u8'));

  // HLS works natively in Safari and via the browser in Chrome/Firefox via MSE
  // Prefer it when available since it delivers adaptive quality
  if (hls) return hls.url;

  // Fallback: highest-res MP4 — urls look like ..._1080.mp4, ..._720.mp4 etc.
  if (mp4s.length > 0) {
    const sorted = [...mp4s].sort((a, b) => {
      const res = (u: string) => { const m = /(\d+)\.mp4/.exec(u); return m ? Number(m[1]) : 0; };
      return res(b.url) - res(a.url);
    });
    return sorted[0].url;
  }

  return null;
}

export default memo(function QuestionCard({ question, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);
  const [videoStatus, setVideoStatus] = useState<VideoStatus>('loading');
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const isCorrect = selected === question.correctIndex;

  // Resolve video source when question changes
  useEffect(() => {
    setVideoStatus('loading');
    setStreamUrl(null);
    setEmbedUrl(null);

    if (!question.url) { setVideoStatus('none'); return; }

    const id = getVideoId(question.url);
    if (!id) { setVideoStatus('none'); return; }

    const fallbackEmbed = `https://www.ardmediathek.de/embed/video/${id}`;

    let cancelled = false;
    fetch(`/api/video-src?id=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then((data: { streams?: Stream[]; error?: string }) => {
        if (cancelled) return;
        const url = data.streams ? pickStream(data.streams) : null;
        if (url) {
          setStreamUrl(url);
          setVideoStatus('stream');
        } else {
          setEmbedUrl(fallbackEmbed);
          setVideoStatus('embed');
        }
      })
      .catch(() => {
        if (!cancelled) { setEmbedUrl(fallbackEmbed); setVideoStatus('embed'); }
      });

    return () => { cancelled = true; };
  }, [question.url]);

  // Restore audio when card unmounts (e.g. video was playing when user answered)
  useEffect(() => {
    return () => {
      resumeAfterVideo();
      setSilenced(false);
    };
  }, []);

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
    // Pause video and restore audio when answering
    videoRef.current?.pause();
    setSelected(idx);
    setRevealed(true);
    if (idx === question.correctIndex) synthCorrect(); else synthWrong();

    // Auto-scroll to the feedback / "Weiter" area after a brief render tick
    requestAnimationFrame(() => {
      feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const handleVideoPlay = () => {
    pauseForVideo();
    setSilenced(true);
  };

  const handleVideoStop = () => {
    resumeAfterVideo();
    setSilenced(false);
  };

  // Format points display
  const pointsDisplay = Object.entries(question.points)
    .filter(([, v]) => (v as number) !== 0)
    .map(([k, v]) => `${(v as number) > 0 ? '+' : ''}${v} ${SCORE_LABELS[k as ScoreKey] ?? k}`)
    .join(', ');

  return (
    <div ref={cardRef} className="bg-slate-800/95 backdrop-blur rounded-2xl max-w-2xl w-full mx-auto border border-slate-700 shadow-2xl animate-[fadeIn_0.3s_ease-out] max-h-[90dvh] overflow-y-auto">

      {/* ── Video area ── */}
      {videoStatus === 'loading' && question.url && (
        <div className="w-full rounded-t-2xl bg-slate-900/60 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
          <span className="text-slate-500 text-sm animate-pulse">📺 Lade Video…</span>
        </div>
      )}

      {videoStatus === 'stream' && streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          controls
          className="w-full rounded-t-2xl bg-black"
          style={{ aspectRatio: '16/9', display: 'block' }}
          onPlay={handleVideoPlay}
          onPause={handleVideoStop}
          onEnded={handleVideoStop}
        >
          <track kind="captions" />
        </video>
      )}

      {videoStatus === 'embed' && embedUrl && (
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
          <span className="px-3 py-1 bg-blue-600/30 text-blue-300 text-xs font-medium rounded-full flex items-center gap-1 w-fit">
            <QuestionIcon className="w-3.5 h-3.5" /> Frage
          </span>
          <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">{question.category}</span>
          <img
            src={getCategoryImage(question.category)}
            alt={question.category}
            className="h-8 w-8 rounded-lg object-cover"
          />
          {question.url && (
            <a href={question.url} target="_blank" rel="noopener noreferrer"
              className="ml-auto text-slate-500 hover:text-blue-400 text-xs transition-colors shrink-0">
              Mediathek ↗
            </a>
          )}
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{question.title}</h3>
        <p className="text-slate-200 mb-4 text-base leading-relaxed">{displayedText}{!typingDone && <span className="animate-pulse">▋</span>}</p>

        {/* Options — 2×2 grid, fade in after typing completes */}
        <div className={`grid grid-cols-2 gap-2 transition-opacity duration-500 ${typingDone ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
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
          <div ref={feedbackRef} className={`mt-4 p-3 rounded-xl border ${isCorrect ? 'border-green-600 bg-green-900/20 text-green-300' : 'border-red-600 bg-red-900/20 text-red-300'}`}>
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
