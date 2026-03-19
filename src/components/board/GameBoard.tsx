'use client';
import { useEffect, useRef, useMemo } from 'react';
import { BoardSpace, Player, PLAYER_COLORS, getSpaceVisual, getStageMeta, LifeStage } from '@/types';
import { BOARD_COLS } from '@/lib/boardGenerator';

interface GameBoardProps {
  board: BoardSpace[];
  players: Player[];
  activePlayerIndex: number;
  animatingPosition?: number | null;
}

// Pixel sizing
const TILE_SIZE = 72;
const TILE_GAP = 6;
const CELL = TILE_SIZE + TILE_GAP;
const BOARD_PAD = 24;

/** Stage color bands for the board background */
const STAGE_BG: Record<LifeStage, string> = {
  kindheit: 'rgba(255,217,61,0.08)',
  jugend: 'rgba(107,203,119,0.08)',
  junges_erwachsenenalter: 'rgba(77,150,255,0.08)',
  erwachsenenalter: 'rgba(255,107,107,0.08)',
  alter: 'rgba(155,89,182,0.08)',
};

export default function GameBoard({ board, players, activePlayerIndex }: GameBoardProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activePlayer = players[activePlayerIndex];

  // Compute board dimensions
  const maxRow = useMemo(() => Math.max(...board.map(s => s.row)), [board]);
  const boardW = BOARD_COLS * CELL + BOARD_PAD * 2;
  const boardH = (maxRow + 1) * CELL + BOARD_PAD * 2;

  // Auto-scroll to active player tile
  useEffect(() => {
    if (!scrollRef.current || !activePlayer) return;
    const space = board[activePlayer.position];
    if (!space) return;
    const tileX = BOARD_PAD + space.col * CELL + TILE_SIZE / 2;
    const tileY = BOARD_PAD + space.row * CELL + TILE_SIZE / 2;
    scrollRef.current.scrollTo({
      left: tileX - scrollRef.current.clientWidth / 2,
      top: tileY - scrollRef.current.clientHeight / 2,
      behavior: 'smooth',
    });
  }, [activePlayer?.position, board, activePlayer]);

  // Group spaces by stage for background bands
  const stageBands = useMemo(() => {
    const bands: { stage: LifeStage; minRow: number; maxRow: number }[] = [];
    let current: LifeStage | null = null;
    let minR = 0, maxR = 0;
    for (const s of board) {
      if (s.stage !== current) {
        if (current) bands.push({ stage: current, minRow: minR, maxRow: maxR });
        current = s.stage;
        minR = s.row;
        maxR = s.row;
      }
      maxR = Math.max(maxR, s.row);
    }
    if (current) bands.push({ stage: current, minRow: minR, maxRow: maxR });
    return bands;
  }, [board]);

  // Path line between consecutive tiles
  const pathSegments = useMemo(() => {
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < board.length - 1; i++) {
      const a = board[i], b = board[i + 1];
      segs.push({
        x1: BOARD_PAD + a.col * CELL + TILE_SIZE / 2,
        y1: BOARD_PAD + a.row * CELL + TILE_SIZE / 2,
        x2: BOARD_PAD + b.col * CELL + TILE_SIZE / 2,
        y2: BOARD_PAD + b.row * CELL + TILE_SIZE / 2,
      });
    }
    return segs;
  }, [board]);

  return (
    <div
      ref={scrollRef}
      className="w-full h-[480px] md:h-[560px] overflow-auto rounded-2xl border-2 border-slate-700 bg-slate-900/95 relative"
      style={{ scrollBehavior: 'smooth' }}
    >
      <div className="relative" style={{ width: boardW, height: boardH, minWidth: boardW, minHeight: boardH }}>
        {/* Stage background bands */}
        {stageBands.map((band, i) => (
          <div
            key={i}
            className="absolute left-0 right-0"
            style={{
              top: BOARD_PAD + band.minRow * CELL - 4,
              height: (band.maxRow - band.minRow + 1) * CELL + 8,
              backgroundColor: STAGE_BG[band.stage],
              borderLeft: `3px solid ${getStageMeta(band.stage).color}40`,
            }}
          >
            {(() => {
              const meta = getStageMeta(band.stage);
              const StageIcon = meta.icon;
              return (
                <span
                  className="absolute left-2 top-1 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                  style={{ color: meta.color }}
                >
                  <StageIcon className="w-3 h-3 flex-shrink-0" />
                  {meta.name}
                </span>
              );
            })()}
          </div>
        ))}

        {/* Path connections (SVG lines) */}
        <svg className="absolute inset-0 pointer-events-none" width={boardW} height={boardH}>
          {pathSegments.map((seg, i) => (
            <line
              key={i}
              x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
              stroke="#334155" strokeWidth={3} strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Tiles */}
        {board.map((space) => {
          const isActive = activePlayer?.position === space.id;
          const visual = getSpaceVisual(space.type);
          const stageMeta = getStageMeta(space.stage);
          const playersHere = players.filter(p => p.position === space.id);
          const left = BOARD_PAD + space.col * CELL;
          const top = BOARD_PAD + space.row * CELL;

          return (
            <div
              key={space.id}
              className="absolute flex flex-col items-center justify-center transition-all duration-300"
              style={{
                left, top, width: TILE_SIZE, height: TILE_SIZE,
                borderRadius: 14,
                backgroundColor: isActive ? `${visual.color}30` : '#1e293b',
                border: isActive ? `3px solid ${visual.color}` : '2px solid #334155',
                boxShadow: isActive
                  ? `0 0 20px ${visual.color}60, 0 0 40px ${visual.color}20, inset 0 0 10px ${visual.color}15`
                  : 'none',
                zIndex: isActive ? 20 : 1,
              }}
            >
              {/* Stage color dot */}
              <div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-slate-800"
                style={{ backgroundColor: stageMeta.color }}
              />

              {/* Tile icon */}
              {visual.icon
                ? (() => { const TileIcon = visual.icon!; return <TileIcon className="w-5 h-5" />; })()
                : <span className="text-slate-500 text-lg leading-none">·</span>}

              {/* Tile number */}
              <span className="text-[9px] text-slate-500 mt-0.5">{space.id + 1}</span>

              {/* Milestone label */}
              {space.milestoneTitle && (
                <span className="absolute -bottom-5 text-[8px] text-yellow-400 font-bold whitespace-nowrap flex items-center gap-0.5">
                  <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 inline-block flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="M12 3l3 6 6 .8-4.5 4.2 1 6-5.5-3-5.5 3 1-6L3 9.8 9 9z"/></svg>
                  {space.milestoneTitle}
                </span>
              )}

              {/* Active tile pulse ring */}
              {isActive && (
                <div
                  className="absolute inset-[-6px] rounded-[18px] animate-ping pointer-events-none"
                  style={{ border: `2px solid ${visual.color}`, opacity: 0.4 }}
                />
              )}

              {/* Player avatars standing ON this tile */}
              {playersHere.length > 0 && (
                <div className="absolute -top-5 flex gap-0.5" style={{ zIndex: 30 }}>
                  {playersHere.map((p) => {
                    const isActiveP = p.id === activePlayer?.id;
                    const color = PLAYER_COLORS[p.id % PLAYER_COLORS.length];
                    return (
                      <div
                        key={p.id}
                        className="flex flex-col items-center transition-all duration-500"
                        style={{
                          transform: isActiveP ? 'scale(1.3) translateY(-4px)' : 'scale(1)',
                          filter: isActiveP ? 'none' : 'brightness(0.6)',
                          zIndex: isActiveP ? 40 : 30,
                        }}
                      >
                        {/* Player name tag */}
                        <span
                          className="text-[8px] font-bold px-1 rounded-sm mb-0.5 whitespace-nowrap"
                          style={{
                            backgroundColor: isActiveP ? color : '#475569',
                            color: '#fff',
                            boxShadow: isActiveP ? `0 0 8px ${color}80` : 'none',
                          }}
                        >
                          {p.name}
                        </span>
                        {/* Player piece */}
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                          style={{
                            backgroundColor: color,
                            boxShadow: isActiveP ? `0 0 12px ${color}, 0 2px 8px rgba(0,0,0,0.5)` : '0 1px 3px rgba(0,0,0,0.4)',
                          }}
                        >
                          {p.name.charAt(0)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
