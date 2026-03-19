'use client';
import React, { useMemo, useEffect, useRef, memo } from 'react';
import {
  BoardSpace, Player, PLAYER_COLORS, getSpaceVisual, getStageMeta,
  LifeStage, TOPS, BOTTOMS, SHOES,
} from '@/types';

// ============================================================
// Constants
// ============================================================
const TILE_SPACING = 56;
const TILE_SIZE = 44;
const BOARD_COLS = 7;
const PATH_WIDTH = BOARD_COLS * TILE_SPACING + 80;

// ============================================================
// SVG position from board col/row
// ============================================================
function tileSvgPos(space: BoardSpace): { x: number; y: number } {
  const x = space.col * TILE_SPACING;
  const y = space.row * TILE_SPACING;
  return { x, y };
}

// ============================================================
// Stage ground colors
// ============================================================
const STAGE_GROUND: Record<LifeStage, string> = {
  kindheit: '#7BC67E',
  jugend: '#5BA85E',
  junges_erwachsenenalter: '#4A9A4D',
  erwachsenenalter: '#5BA85E',
  alter: '#7BC67E',
};

// ============================================================
// SVG Tree (pine)
// ============================================================
const SvgTree = memo(function SvgTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-2} y={-16} width={4} height={16} fill="#5D4037" rx={1} />
      <polygon points="-10,-16 10,-16 0,-36" fill="#2E7D32" />
      <polygon points="-7,-26 7,-26 0,-42" fill="#388E3C" />
    </g>
  );
});

// ============================================================
// SVG Round Tree
// ============================================================
const SvgRoundTree = memo(function SvgRoundTree({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-2} y={-12} width={4} height={12} fill="#795548" rx={1} />
      <circle cx={0} cy={-20} r={10} fill="#43A047" />
    </g>
  );
});

// ============================================================
// SVG House
// ============================================================
const SvgHouse = memo(function SvgHouse({ x, y, wallColor, roofColor, scale = 1 }: {
  x: number; y: number; wallColor: string; roofColor: string; scale?: number;
}) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <rect x={-14} y={-22} width={28} height={22} fill={wallColor} rx={1} />
      <polygon points="-18,-22 18,-22 0,-36" fill={roofColor} />
      <rect x={-3} y={-10} width={6} height={10} fill="#5D4037" rx={0.5} />
      <rect x={6} y={-18} width={5} height={5} fill="#BBDEFB" rx={0.5} />
    </g>
  );
});

// ============================================================
// SVG Fence
// ============================================================
const SvgFence = memo(function SvgFence({ x, y, width = 40 }: { x: number; y: number; width?: number }) {
  const posts = Math.max(2, Math.floor(width / 12));
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={0} y={-6} width={width} height={2} fill="#8D6E63" rx={0.5} />
      <rect x={0} y={-2} width={width} height={2} fill="#8D6E63" rx={0.5} />
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <rect key={i} x={i * (width / posts) - 1} y={-8} width={2} height={10} fill="#6D4C41" rx={0.5} />
      ))}
    </g>
  );
});

// ============================================================
// Board Tile (SVG)
// ============================================================
const BoardTileSvg = memo(function BoardTileSvg({ space, isActive, isLanded }: {
  space: BoardSpace; isActive: boolean; isLanded?: boolean;
}) {
  const { x, y } = tileSvgPos(space);
  const visual = getSpaceVisual(space.type);
  const stageMeta = getStageMeta(space.stage);
  const half = TILE_SIZE / 2;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Glow ring for active / landed */}
      {(isActive || isLanded) && (
        <rect
          x={-half - 4} y={-half - 4}
          width={TILE_SIZE + 8} height={TILE_SIZE + 8}
          rx={6}
          fill="none"
          stroke={visual.color}
          strokeWidth={isLanded ? 3 : 2}
          opacity={isLanded ? 0.9 : 0.6}
        >
          {isLanded && (
            <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1s" repeatCount="indefinite" />
          )}
        </rect>
      )}

      {/* Tile body */}
      <rect
        x={-half} y={-half}
        width={TILE_SIZE} height={TILE_SIZE}
        rx={4}
        fill={isActive || isLanded ? visual.color : '#2a3a50'}
        stroke={isActive ? visual.color : '#3a4a60'}
        strokeWidth={1}
        opacity={isLanded ? 0.95 : 1}
      />

      {/* Stage color strip */}
      <rect
        x={-half + 3} y={-half + 2}
        width={TILE_SIZE - 6} height={4}
        rx={2}
        fill={stageMeta.color}
        opacity={0.8}
      />

      {/* Icon */}
      <text
        x={0} y={4}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={18}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {visual.icon}
      </text>

      {/* Tile number */}
      <text
        x={0} y={half - 6}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={7}
        fill="#8899AA"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {space.id + 1}
      </text>

      {/* Milestone label */}
      {space.milestoneTitle && (
        <text
          x={0} y={-half - 10}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={8}
          fill="#FFD700"
          fontWeight="bold"
          stroke="#000"
          strokeWidth={0.3}
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          ⭐ {space.milestoneTitle}
        </text>
      )}
    </g>
  );
});

// ============================================================
// Path road between tiles (SVG lines)
// ============================================================
const PathRoadSvg = memo(function PathRoadSvg({ board }: { board: BoardSpace[] }) {
  const d = useMemo(() => {
    if (board.length < 2) return '';
    const parts: string[] = [];
    const first = tileSvgPos(board[0]);
    parts.push(`M ${first.x} ${first.y}`);
    for (let i = 1; i < board.length; i++) {
      const p = tileSvgPos(board[i]);
      parts.push(`L ${p.x} ${p.y}`);
    }
    return parts.join(' ');
  }, [board]);

  return (
    <path
      d={d}
      fill="none"
      stroke="#3a4a5e"
      strokeWidth={8}
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity={0.6}
    />
  );
});

// ============================================================
// Stage ground bands (SVG)
// ============================================================
const StageGroundsSvg = memo(function StageGroundsSvg({ board }: { board: BoardSpace[] }) {
  const bands = useMemo(() => {
    const result: { stage: LifeStage; minY: number; maxY: number }[] = [];
    let current: LifeStage | null = null;
    let minY = 0, maxY = 0;
    for (const space of board) {
      const { y } = tileSvgPos(space);
      if (space.stage !== current) {
        if (current) result.push({ stage: current, minY, maxY });
        current = space.stage;
        minY = y;
        maxY = y;
      }
      maxY = Math.max(maxY, y);
    }
    if (current) result.push({ stage: current, minY, maxY });
    return result;
  }, [board]);

  return (
    <>
      {bands.map((band, i) => {
        const bandHeight = band.maxY - band.minY + TILE_SPACING * 2;
        const centerY = (band.minY + band.maxY) / 2;
        return (
          <rect
            key={i}
            x={-(PATH_WIDTH / 2 + 60)}
            y={centerY - bandHeight / 2}
            width={PATH_WIDTH + 120}
            height={bandHeight}
            fill={STAGE_GROUND[band.stage]}
            opacity={0.3}
          />
        );
      })}
    </>
  );
});

// ============================================================
// Stage label signs (SVG)
// ============================================================
const StageSignsSvg = memo(function StageSignsSvg({ board }: { board: BoardSpace[] }) {
  const signs = useMemo(() => {
    const result: { stage: LifeStage; y: number }[] = [];
    let current: LifeStage | null = null;
    for (const space of board) {
      if (space.stage !== current) {
        current = space.stage;
        const { y } = tileSvgPos(space);
        result.push({ stage: current, y: y - TILE_SPACING * 0.4 });
      }
    }
    return result;
  }, [board]);

  return (
    <>
      {signs.map((sign, i) => {
        const meta = getStageMeta(sign.stage);
        const signX = -(PATH_WIDTH / 2 + 20);
        return (
          <g key={i} transform={`translate(${signX},${sign.y})`}>
            {/* Post */}
            <rect x={-1} y={-30} width={2} height={30} fill="#5D4037" rx={0.5} />
            {/* Sign board */}
            <rect x={-40} y={-42} width={80} height={18} rx={3} fill={meta.color} />
            <text
              x={0} y={-33}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fill="#FFFFFF"
              fontWeight="bold"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {meta.emoji} {meta.name}
            </text>
            <text
              x={0} y={-26}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6}
              fill="#FFFFFFCC"
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {meta.ages}
            </text>
          </g>
        );
      })}
    </>
  );
});

// ============================================================
// SVG Character
// ============================================================
const SvgCharacter = memo(function SvgCharacter({ player, x, y, isActive }: {
  player: Player; x: number; y: number; isActive: boolean;
}) {
  const color = PLAYER_COLORS[player.id % PLAYER_COLORS.length];
  const avatar = player.avatar;
  const topColor = TOPS.find(t => t.id === avatar.topId)?.color ?? '#4D96FF';
  const bottomColor = BOTTOMS.find(b => b.id === avatar.bottomId)?.color ?? '#3B5998';
  const shoesColor = SHOES.find(s => s.id === avatar.shoesId)?.color ?? '#FFFFFF';
  const sc = isActive ? 1 : 0.85;

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Active player ring */}
      {isActive && (
        <ellipse cx={0} cy={2} rx={10} ry={4} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
      )}

      <g transform={`scale(${sc})`}>
        {/* Shoes */}
        <rect x={-7} y={-3} width={5} height={3} rx={1} fill={shoesColor} />
        <rect x={2} y={-3} width={5} height={3} rx={1} fill={shoesColor} />

        {/* Legs */}
        <rect x={-5} y={-14} width={4} height={12} rx={1.5} fill={bottomColor} />
        <rect x={1} y={-14} width={4} height={12} rx={1.5} fill={bottomColor} />

        {/* Torso */}
        <rect x={-8} y={-26} width={16} height={14} rx={3} fill={topColor} />

        {/* Arms */}
        <rect x={-12} y={-25} width={4} height={12} rx={2} fill={avatar.skinColor} />
        <rect x={8} y={-25} width={4} height={12} rx={2} fill={avatar.skinColor} />

        {/* Head */}
        <circle cx={0} cy={-32} r={7} fill={avatar.skinColor} />

        {/* Hair */}
        <ellipse cx={0} cy={-36} rx={6} ry={4} fill={avatar.hairColor} />

        {/* Eyes */}
        <circle cx={-2.5} cy={-32} r={1.2} fill="#1a1a2e" />
        <circle cx={2.5} cy={-32} r={1.2} fill="#1a1a2e" />
      </g>

      {/* Name label */}
      <text
        x={0} y={-44}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={8}
        fill={isActive ? '#FFFFFF' : '#AABBCC'}
        fontWeight={isActive ? 'bold' : 'normal'}
        stroke="#000"
        strokeWidth={0.3}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {player.name}
      </text>
    </g>
  );
});

// ============================================================
// World Environment (procedural scenery along the road)
// ============================================================
const WorldEnvironmentSvg = memo(function WorldEnvironmentSvg({ board }: { board: BoardSpace[] }) {
  const maxY = Math.max(...board.map(s => tileSvgPos(s).y));

  const items = useMemo(() => {
    const elements: React.ReactElement[] = [];
    const side = PATH_WIDTH / 2 + 10;
    let idx = 0;

    for (let row = -60; row <= maxY + 100; row += 70) {
      const progress = Math.max(0, Math.min(1, row / maxY));
      const seed = Math.abs(Math.sin(row * 123.456)) % 1;
      const seed2 = Math.abs(Math.cos(row * 789.012)) % 1;

      // Left side
      const lx = -(side + 10 + seed * 80);

      if (progress < 0.2) {
        if (seed > 0.5) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#FFF9C4" roofColor="#E57373" scale={0.9} />);
        } else {
          elements.push(<SvgRoundTree key={idx++} x={lx} y={row} scale={0.8 + seed * 0.5} />);
        }
        if (seed2 > 0.6) elements.push(<SvgTree key={idx++} x={lx - 40} y={row + 20} scale={0.7} />);
      } else if (progress < 0.4) {
        if (seed > 0.4) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#E3F2FD" roofColor="#1565C0" scale={1.1} />);
        }
        if (seed2 > 0.5) elements.push(<SvgFence key={idx++} x={-(side + 5)} y={row + 20} width={30} />);
      } else if (progress < 0.6) {
        if (seed > 0.3) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#ECEFF1" roofColor="#455A64" scale={1.3} />);
        }
        if (seed2 > 0.4) elements.push(<SvgRoundTree key={idx++} x={lx + 40} y={row + 10} scale={1.1} />);
      } else if (progress < 0.8) {
        if (seed > 0.3) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#FFF3E0" roofColor="#BF360C" scale={1.2} />);
        }
        if (seed2 > 0.5) elements.push(<SvgTree key={idx++} x={lx + 30} y={row - 20} scale={1.2} />);
        if (seed > 0.7) elements.push(<SvgFence key={idx++} x={-(side + 5)} y={row} width={35} />);
      } else {
        elements.push(<SvgRoundTree key={idx++} x={lx} y={row} scale={1.3} />);
        if (seed2 > 0.4) elements.push(<SvgTree key={idx++} x={lx - 30} y={row + 15} scale={1} />);
      }

      // Right side (less dense)
      const rx = side + 10 + seed2 * 80;
      if (seed > 0.3) {
        elements.push(<SvgTree key={idx++} x={rx} y={row} scale={0.7 + seed2 * 0.8} />);
      }
      if (seed2 > 0.6) {
        elements.push(<SvgRoundTree key={idx++} x={rx + 40} y={row + 30} scale={0.9} />);
      }
      if (seed > 0.8) {
        elements.push(<SvgHouse key={idx++} x={rx + 20} y={row} wallColor="#E8EAF6" roofColor="#283593" scale={1 + seed * 0.3} />);
      }
    }

    return elements;
  }, [maxY]);

  return <>{items}</>;
});

// ============================================================
// Main exported component
// ============================================================
interface GameWorld3DProps {
  board: BoardSpace[];
  players: Player[];
  activePlayerIndex: number;
  animatingToPosition: number | null;
  landedTileId?: number | null;
  onAnimationComplete?: () => void;
}

export default function GameWorld3D({
  board, players, activePlayerIndex, landedTileId,
}: GameWorld3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const activePlayer = players[activePlayerIndex];
  const activeSpace = board[activePlayer?.position ?? 0];
  const activePos = activeSpace ? tileSvgPos(activeSpace) : { x: 0, y: 0 };

  // Compute the bounding box of the entire board in SVG coordinates
  const bounds = useMemo(() => {
    if (board.length === 0) return { minX: -200, minY: -100, maxX: 200, maxY: 100 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const space of board) {
      const { x, y } = tileSvgPos(space);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return { minX: minX - 80, minY: minY - 80, maxX: maxX + 80, maxY: maxY + 80 };
  }, [board]);

  // Pan & zoom the SVG to center on the active player.
  // Uses a single CSS transform on the SVG — no viewBox scaling,
  // so proportions are always correct (uniform scale).
  useEffect(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const containerW = container.clientWidth;
    const containerH = container.clientHeight;

    // How many SVG-units we want visible around the active player
    // (roughly a 600×400 SVG-unit window so a few tiles are visible)
    const visibleW = 500;
    const visibleH = 400;

    // Uniform scale: pick the smaller axis so nothing stretches
    const zoom = Math.min(containerW / visibleW, containerH / visibleH);

    // Translate so the active player is at the center of the screen
    const tx = containerW / 2 - activePos.x * zoom;
    const ty = containerH / 2 - activePos.y * zoom;

    svg.style.transition = 'transform 0.8s ease-out';
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    svg.style.transformOrigin = '0 0';
  }, [activePos.x, activePos.y, bounds]);

  // Also re-center on window resize
  useEffect(() => {
    const handle = () => {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;

      const containerW = container.clientWidth;
      const containerH = container.clientHeight;
      const visibleW = 500;
      const visibleH = 400;
      const zoom = Math.min(containerW / visibleW, containerH / visibleH);
      const tx = containerW / 2 - activePos.x * zoom;
      const ty = containerH / 2 - activePos.y * zoom;

      svg.style.transition = 'none'; // no animation on resize
      svg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
      svg.style.transformOrigin = '0 0';
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, [activePos.x, activePos.y]);

  // The SVG uses no viewBox — it occupies its natural coordinate space.
  // All positioning is in SVG-units; the CSS transform handles zoom + pan.
  const svgW = bounds.maxX - bounds.minX;
  const svgH = bounds.maxY - bounds.minY;

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden"
      style={{ background: '#87CEEB', position: 'relative' }}
    >
      <svg
        ref={svgRef}
        width={svgW}
        height={svgH}
        viewBox={`${bounds.minX} ${bounds.minY} ${svgW} ${svgH}`}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, overflow: 'visible' }}
      >
        {/* Stage ground bands */}
        <StageGroundsSvg board={board} />

        {/* Path road */}
        <PathRoadSvg board={board} />

        {/* Board tiles */}
        {board.map((space) => (
          <BoardTileSvg
            key={space.id}
            space={space}
            isActive={activePlayer?.position === space.id}
            isLanded={landedTileId === space.id}
          />
        ))}

        {/* Stage signs */}
        <StageSignsSvg board={board} />

        {/* Scenery */}
        <WorldEnvironmentSvg board={board} />

        {/* Players */}
        {players.map((player) => {
          const space = board[player.position] ?? board[0];
          const pos = tileSvgPos(space);
          const isActive = player.id === activePlayer?.id;

          // Offset multiple players on same tile
          const samePos = players.filter(p => p.position === player.position);
          const myIdx = samePos.findIndex(p => p.id === player.id);
          const offset = myIdx * 14 - (samePos.length - 1) * 7;

          return (
            <SvgCharacter
              key={player.id}
              player={player}
              x={pos.x + offset}
              y={pos.y}
              isActive={isActive}
            />
          );
        })}
      </svg>
    </div>
  );
}
