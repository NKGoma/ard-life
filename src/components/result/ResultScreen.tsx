'use client';
import { Player, SCORE_LABELS, SCORE_COLORS, SCORE_ICONS, ScoreKey, ALL_SCORE_KEYS } from '@/types';
import { calculateProfile, getScoreTotal } from '@/lib/scoring';

interface ResultScreenProps {
  players: Player[];
  onRestart: () => void;
}

export default function ResultScreen({ players, onRestart }: ResultScreenProps) {
  const ranked = [...players].sort((a, b) => getScoreTotal(b.scores) - getScoreTotal(a.scores));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🏆 Spielende!</h1>
          <p className="text-slate-400">Hier sind eure Ergebnisse</p>
        </div>

        {ranked.map((player, rank) => {
          const profile = calculateProfile(player.scores);
          const total = getScoreTotal(player.scores);

          return (
            <div key={player.id} className="mb-6 bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">{rank === 0 ? '🥇' : rank === 1 ? '🥈' : rank === 2 ? '🥉' : '🏅'}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white">{player.name}</h2>
                  <p className="text-sm text-slate-400">Gesamtpunktzahl: {total}</p>
                </div>
              </div>

              {/* Profile */}
              <div className="bg-slate-900/60 rounded-xl p-4 mb-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{profile.emoji}</span>
                  <h3 className="text-lg font-bold text-white">{profile.name}</h3>
                </div>
                <p className="text-slate-300 text-sm mb-3">{profile.description}</p>
                {profile.tips.map((tip, i) => (
                  <p key={i} className="text-xs text-blue-300 flex gap-1"><span>💡</span>{tip}</p>
                ))}
              </div>

              {/* Score bars */}
              <div className="space-y-2">
                {ALL_SCORE_KEYS.map((key: ScoreKey) => {
                  const val = player.scores[key];
                  const pct = Math.min(val * 2, 100);
                  return (
                    <div key={key} className="flex items-center gap-2">
                      {(() => { const Icon = SCORE_ICONS[key]; return <Icon className="w-5 h-5 flex-shrink-0" />; })()}
                      <span className="text-xs text-slate-400 w-24">{SCORE_LABELS[key]}</span>
                      <div className="flex-1 h-2.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: SCORE_COLORS[key] }} />
                      </div>
                      <span className="text-xs text-white w-6 text-right font-mono">{val}</span>
                    </div>
                  );
                })}
              </div>

              {player.milestones.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                  {player.milestones.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 bg-yellow-900/30 text-yellow-300 text-xs rounded-full">⭐ {m}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        <div className="text-center mt-6">
          <button onClick={onRestart}
            className="px-10 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-xl text-lg hover:from-blue-400 hover:to-purple-500 transition-all shadow-xl transform hover:scale-105 active:scale-95">
            🔄 Neues Spiel starten
          </button>
        </div>
      </div>
    </div>
  );
}
