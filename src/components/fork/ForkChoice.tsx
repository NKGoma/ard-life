'use client';
import { memo } from 'react';

interface ForkChoiceProps {
  options: { label: string; targetSpace: number }[];
  onChoose: (targetSpace: number) => void;
}

export default memo(function ForkChoice({ options, onChoose }: ForkChoiceProps) {
  return (
    <div className="bg-slate-800/95 backdrop-blur rounded-2xl p-6 max-w-md w-full mx-auto
      border border-purple-600/50 shadow-2xl animate-[fadeIn_0.3s_ease-out] text-center">
      <div className="text-4xl mb-3">🔱</div>
      <h3 className="text-xl font-bold text-purple-300 mb-2">Weggabelung</h3>
      <p className="text-slate-400 mb-5">Waehle deinen Weg!</p>

      <div className="space-y-3">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onChoose(opt.targetSpace)}
            className="w-full p-4 rounded-xl border-2 border-purple-700/50 bg-purple-900/20
              hover:bg-purple-800/30 hover:border-purple-500 text-white font-medium
              transition-all text-left"
          >
            <span className="text-purple-300 mr-2">{i === 0 ? '🛤️' : '🌄'}</span>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
});
