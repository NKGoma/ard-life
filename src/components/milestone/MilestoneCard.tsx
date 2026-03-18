'use client';
import { memo } from 'react';
import { BoardSpace } from '@/types';

interface MilestoneCardProps {
  space: BoardSpace;
  onAcknowledge: () => void;
}

export default memo(function MilestoneCard({ space, onAcknowledge }: MilestoneCardProps) {
  return (
    <div className="bg-slate-800/95 backdrop-blur rounded-2xl p-6 max-w-md w-full mx-auto
      border border-yellow-600/50 shadow-2xl animate-[fadeIn_0.3s_ease-out] text-center">
      {/* Star burst */}
      <div className="text-5xl mb-3 animate-bounce">⭐</div>

      <h3 className="text-2xl font-bold text-yellow-300 mb-2">
        {space.milestoneTitle ?? 'Meilenstein!'}
      </h3>

      <p className="text-slate-300 mb-6 leading-relaxed">
        {space.milestoneDescription ?? 'Du hast einen wichtigen Meilenstein erreicht!'}
      </p>

      <button
        onClick={onAcknowledge}
        className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-amber-600
          text-slate-900 font-bold rounded-xl text-lg
          hover:from-yellow-400 hover:to-amber-500
          transition-all shadow-lg transform hover:scale-105 active:scale-95"
      >
        🎉 Weiter!
      </button>
    </div>
  );
});
