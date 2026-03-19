'use client';
import { memo } from 'react';
import { Player, SCORE_LABELS, SCORE_COLORS, SCORE_EMOJIS, ScoreKey, ALL_SCORE_KEYS, getStageMeta, PLAYER_COLORS } from '@/types';

interface ScoreBarProps {
  players: Player[];
  currentPlayerIndex: number;
}

export default memo(function ScoreBar({ players, currentPlayerIndex }: ScoreBarProps) {
  const player = players[currentPlayerIndex];
  if (!player) return null;
  const stageMeta = getStageMeta(player.currentStage);

  return (
    <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-2.5 border border-slate-700 w-[140px] flex flex-col gap-2">
      {/* Player tabs — stacked vertically */}
      <div className="flex flex-col gap-1">
        {players.map((p, i) => {
          const isActive = i === currentPlayerIndex;
          const color = PLAYER_COLORS[p.id % PLAYER_COLORS.length];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all text-xs
                ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}
              style={{
                backgroundColor: isActive ? `${color}25` : 'transparent',
                ...(isActive ? { boxShadow: `0 0 6px ${color}40, inset 0 0 0 1.5px ${color}` } : {}),
              }}
            >
              <div
                className="w-4 h-4 rounded-full border border-white/80 flex items-center justify-center text-[7px] font-bold text-white shrink-0"
                style={{ backgroundColor: color }}
              >
                {p.name.charAt(0)}
              </div>
              <span className="truncate">{p.name}</span>
            </div>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* Active player info */}
      <div className="px-1">
        <p className="text-white font-bold text-sm truncate leading-tight">{player.name}</p>
        <p className="text-[10px] leading-tight" style={{ color: stageMeta.color }}>
          {stageMeta.emoji} {stageMeta.name}
        </p>
        <p className="text-[10px] text-slate-400 leading-tight">Feld {player.position + 1}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* Three score categories — vertical bars */}
      <div className="flex flex-col gap-2 px-1">
        {ALL_SCORE_KEYS.map((key: ScoreKey) => {
          const val = player.scores[key];
          const pct = Math.min(val * 2, 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs">{SCORE_EMOJIS[key]}</span>
                <span className="text-[10px] text-slate-300 font-medium truncate mx-1 flex-1">{SCORE_LABELS[key]}</span>
                <span className="text-[10px] text-white font-mono font-bold">{val}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: SCORE_COLORS[key],
                    boxShadow: `0 0 4px ${SCORE_COLORS[key]}60`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
