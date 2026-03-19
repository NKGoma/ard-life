'use client';
import { memo } from 'react';
import { Player, SCORE_LABELS, SCORE_COLORS, SCORE_ICONS, ScoreKey, ALL_SCORE_KEYS, getStageMeta, PLAYER_COLORS } from '@/types';

interface ScoreBarProps {
  players: Player[];
  currentPlayerIndex: number;
}

export default memo(function ScoreBar({ players, currentPlayerIndex }: ScoreBarProps) {
  const player = players[currentPlayerIndex];
  if (!player) return null;
  const stageMeta = getStageMeta(player.currentStage);

  return (
    <div className="bg-slate-800/90 backdrop-blur rounded-2xl p-4 border border-slate-700 w-[180px] flex flex-col gap-3">
      {/* Player tabs — stacked vertically */}
      <div className="flex flex-col gap-1.5">
        {players.map((p, i) => {
          const isActive = i === currentPlayerIndex;
          const color = PLAYER_COLORS[p.id % PLAYER_COLORS.length];
          return (
            <div
              key={p.id}
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all text-sm
                ${isActive ? 'text-white font-bold' : 'text-slate-500'}`}
              style={{
                backgroundColor: isActive ? `${color}25` : 'transparent',
                ...(isActive ? { boxShadow: `0 0 6px ${color}40, inset 0 0 0 1.5px ${color}` } : {}),
              }}
            >
              <div
                className="w-5 h-5 rounded-full border border-white/80 flex items-center justify-center text-[8px] font-bold text-white shrink-0"
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
        <p className="text-white font-bold text-base truncate leading-tight">{player.name}</p>
        <p className="text-xs leading-tight mt-0.5 flex items-center gap-1" style={{ color: stageMeta.color }}>
          <stageMeta.icon className="w-3 h-3 flex-shrink-0" />
          {stageMeta.name}
        </p>
        <p className="text-xs text-slate-400 leading-tight">Feld {player.position + 1}</p>
      </div>

      {/* Divider */}
      <div className="border-t border-slate-700" />

      {/* Three score categories — vertical bars */}
      <div className="flex flex-col gap-3 px-1">
        {ALL_SCORE_KEYS.map((key: ScoreKey) => {
          const val = player.scores[key];
          const pct = Math.min(val * 2, 100);
          return (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                {(() => { const Icon = SCORE_ICONS[key]; return <Icon className="w-4 h-4 flex-shrink-0" />; })()}
                <span className="text-xs text-slate-300 font-medium truncate mx-1 flex-1">{SCORE_LABELS[key]}</span>
                <span className="text-xs text-white font-mono font-bold">{val}</span>
              </div>
              <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
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
