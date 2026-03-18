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
    <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-3 border border-slate-700">
      {/* Player tabs */}
      <div className="flex items-center gap-2 mb-3">
        {players.map((p, i) => {
          const isActive = i === currentPlayerIndex;
          const color = PLAYER_COLORS[p.id % PLAYER_COLORS.length];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all text-sm
                ${isActive ? 'ring-2 text-white font-bold' : 'text-slate-500'}`}
              style={{
                backgroundColor: isActive ? `${color}25` : 'transparent',
                ...(isActive ? { boxShadow: `0 0 8px ${color}40, inset 0 0 0 2px ${color}` } : {}),
              }}
            >
              <div
                className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white"
                style={{ backgroundColor: color }}
              >
                {p.name.charAt(0)}
              </div>
              <span className="truncate max-w-[60px]">{p.name}</span>
              {isActive && <span className="text-[10px] ml-1 animate-pulse">◀</span>}
            </div>
          );
        })}
      </div>

      {/* Active player info */}
      <div className="flex items-center gap-3 mb-2 pb-2 border-b border-slate-700">
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-lg truncate">{player.name}</h3>
          <p className="text-xs" style={{ color: stageMeta.color }}>
            {stageMeta.emoji} {stageMeta.name} · Feld {player.position + 1}
          </p>
        </div>
      </div>

      {/* Three score bars: bildung, gemeinschaft, glueck */}
      <div className="space-y-2">
        {ALL_SCORE_KEYS.map((key: ScoreKey) => {
          const val = player.scores[key];
          const pct = Math.min(val * 2, 100); // scale for visual (50 = full)
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-base w-6 text-center">{SCORE_EMOJIS[key]}</span>
              <span className="text-xs text-slate-300 w-24 font-medium">{SCORE_LABELS[key]}</span>
              <div className="flex-1 h-3 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: SCORE_COLORS[key],
                    boxShadow: `0 0 6px ${SCORE_COLORS[key]}60`,
                  }}
                />
              </div>
              <span className="text-xs text-white w-8 text-right font-mono font-bold">{val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
});
