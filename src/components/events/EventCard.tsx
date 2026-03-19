'use client';
import { memo, useEffect, useState } from 'react';
import { RandomEvent, SCORE_LABELS, ScoreKey } from '@/types';
import { synthEvent } from '@/lib/audio';

interface EventCardProps {
  event: RandomEvent;
  onChoose: (choiceIndex: number) => void;
}

export default memo(function EventCard({ event, onChoose }: EventCardProps) {
  const [chosen, setChosen] = useState<number | null>(null);
  useEffect(() => { synthEvent(); }, []);

  const handleChoose = (i: number) => {
    if (chosen !== null) return;
    setChosen(i);
  };

  return (
    <div className="bg-slate-800/95 backdrop-blur rounded-2xl p-6 max-w-lg w-full mx-auto border border-orange-700/50 shadow-2xl animate-[fadeIn_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="px-3 py-1 bg-orange-600/30 text-orange-300 text-xs font-medium rounded-full">📰 Ereignis</span>
        <span className="px-3 py-1 bg-slate-700 text-slate-300 text-xs rounded-full">{event.category}</span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2">{event.title}</h3>
      <p className="text-slate-300 mb-5 leading-relaxed">{event.description}</p>

      {/* Choices */}
      <div className="space-y-3">
        {event.choices.map((choice, i) => {
          const isChosen = chosen === i;
          const isOther = chosen !== null && chosen !== i;

          const effects = Object.entries(choice.points)
            .filter(([, v]) => (v as number) !== 0)
            .map(([k, v]) => {
              const num = v as number;
              return `${num > 0 ? '+' : ''}${num} ${SCORE_LABELS[k as ScoreKey] ?? k}`;
            })
            .join(', ');
          const moveInfo = choice.moveSpaces
            ? ` | ${choice.moveSpaces > 0 ? '+' : ''}${choice.moveSpaces} Felder`
            : '';

          return (
            <button key={i} onClick={() => handleChoose(i)} disabled={chosen !== null}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                isChosen
                  ? 'border-orange-500 bg-orange-900/30 text-orange-200'
                  : isOther
                    ? 'border-slate-700 bg-slate-800/50 text-slate-500'
                    : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 hover:border-orange-500/60 group'
              } disabled:cursor-default`}>
              <p className={`font-medium transition-colors ${!chosen ? 'text-white group-hover:text-orange-200' : ''}`}>{choice.text}</p>
              {isChosen && (
                <p className="text-xs text-orange-300 mt-1">
                  Effekt: {effects || 'Keine Änderung'}{moveInfo}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Continue button after choosing */}
      {chosen !== null && (
        <button
          onClick={() => onChoose(chosen)}
          className="mt-4 w-full py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-medium transition-colors"
        >
          Weiter →
        </button>
      )}
    </div>
  );
});
