'use client';
import { memo } from 'react';
import { AvatarConfig, HAIR_STYLES, TOPS, BOTTOMS, SHOES, ACCESSORIES, getStageMeta, LifeStage } from '@/types';

interface AvatarDisplayProps {
  avatar: AvatarConfig;
  stage?: LifeStage;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
  color?: string;
}

export default memo(function AvatarDisplay({ avatar, stage, size = 'md', highlight, color }: AvatarDisplayProps) {
  const hair = HAIR_STYLES.find((h) => h.id === avatar.hairStyleId);
  const top = TOPS.find((t) => t.id === avatar.topId);
  const bottom = BOTTOMS.find((b) => b.id === avatar.bottomId);
  const shoes = SHOES.find((s) => s.id === avatar.shoesId);
  const acc = ACCESSORIES.find((a) => a.id === avatar.accessoryId);
  const stageMeta = getStageMeta(stage);

  const sizeClasses = {
    sm: 'w-12 h-16',
    md: 'w-20 h-28',
    lg: 'w-28 h-36',
  };

  const headSizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-10 h-10' };
  const hairSizes = { sm: 'text-sm', md: 'text-xl', lg: 'text-2xl' };

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl bg-slate-900/80 border-2 flex flex-col items-center justify-center gap-0.5 p-1 relative overflow-hidden transition-all ${highlight ? 'ring-2 ring-offset-2 ring-offset-slate-900 shadow-lg shadow-current' : ''}`}
      style={{
        borderColor: highlight ? (color ?? stageMeta.color) : '#475569',
        ...(highlight ? { boxShadow: `0 0 12px ${color ?? stageMeta.color}40` } : {}),
      }}
    >
      {/* Hair */}
      <div className={hairSizes[size]} style={{ color: avatar.hairColor }}>
        {hair?.preview ?? '◻'}
      </div>
      {/* Head */}
      <div className={`${headSizes[size]} rounded-full`} style={{ backgroundColor: avatar.skinColor }} />
      {/* Top */}
      {size !== 'sm' && (
        <div className="w-[70%] h-[18%] rounded-t-lg" style={{ backgroundColor: top?.color ?? '#4D96FF' }} />
      )}
      {/* Bottom */}
      {size !== 'sm' && (
        <div className="w-[60%] h-[14%] rounded-b" style={{ backgroundColor: bottom?.color ?? '#3B5998' }} />
      )}
      {/* Shoes */}
      {size === 'lg' && (
        <div className="flex gap-0.5">
          <div className="w-3 h-1.5 rounded" style={{ backgroundColor: shoes?.color ?? '#fff' }} />
          <div className="w-3 h-1.5 rounded" style={{ backgroundColor: shoes?.color ?? '#fff' }} />
        </div>
      )}
      {/* Accessory */}
      {acc && acc.id !== 'none' && (
        <div className="absolute top-0.5 right-0.5 text-xs">{acc.emoji}</div>
      )}
      {/* Stage emoji */}
      {stage && size !== 'sm' && (
        <div className="absolute bottom-0.5 left-0.5 text-xs">{stageMeta.emoji}</div>
      )}
    </div>
  );
});
