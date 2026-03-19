'use client';
import React, { useMemo, useEffect, useRef, useCallback, memo } from 'react';
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
  // Center the board columns around x=0
  const x = (space.col - (BOARD_COLS - 1) / 2) * TILE_SPACING;
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
            x={-(PATH_WIDTH / 2 + 200)}
            y={centerY - bandHeight / 2}
            width={PATH_WIDTH + 400}
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

  // Place signs well outside the board + scenery zone
  const signX = -(PATH_WIDTH / 2 + 80);

  return (
    <>
      {signs.map((sign, i) => {
        const meta = getStageMeta(sign.stage);
        return (
          <g key={i} transform={`translate(${signX},${sign.y})`}>
            {/* Post */}
            <rect x={-1} y={-28} width={2} height={28} fill="#5D4037" rx={0.5} />
            {/* Sign board with shadow for readability */}
            <rect x={-44} y={-42} width={88} height={22} rx={4} fill="#00000033" />
            <rect x={-44} y={-43} width={88} height={22} rx={4} fill={meta.color} />
            <text
              x={0} y={-34}
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
              x={0} y={-25}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={6}
              fill="#FFFFFFDD"
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
// SVG Character (with combined hop + travel animation)
// ============================================================
const HOP_DURATION = 380; // ms — fits inside the 450ms step interval
const HOP_HEIGHT = 14;    // px — subtle arc height

function SvgCharacter({ player, x, y, isActive }: {
  player: Player; x: number; y: number; isActive: boolean;
}) {
  const color = PLAYER_COLORS[player.id % PLAYER_COLORS.length];
  const avatar = player.avatar;
  const topColor = TOPS.find(t => t.id === avatar.topId)?.color ?? '#4D96FF';
  const bottomColor = BOTTOMS.find(b => b.id === avatar.bottomId)?.color ?? '#3B5998';
  const shoesColor = SHOES.find(s => s.id === avatar.shoesId)?.color ?? '#FFFFFF';
  const sc = isActive ? 1 : 0.85;

  const gRef = useRef<SVGGElement>(null);
  const prevCoords = useRef({ x, y });
  const isFirstRender = useRef(true);

  useEffect(() => {
    const el = gRef.current;
    if (!el) return;

    // Skip animation on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevCoords.current = { x, y };
      return;
    }

    const oldX = prevCoords.current.x;
    const oldY = prevCoords.current.y;
    const dx = oldX - x; // delta from NEW position (since <g> is already at new x,y)
    const dy = oldY - y;

    prevCoords.current = { x, y };

    // No movement → no animation
    if (dx === 0 && dy === 0) return;

    // Animate: start offset at (dx, dy) relative to current position,
    // arc upward at midpoint, land at (0,0) = the new position.
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px)` },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - HOP_HEIGHT}px)` },
        { transform: `translate(0px, 0px)` },
      ],
      {
        duration: HOP_DURATION,
        easing: 'cubic-bezier(0.33, 0, 0.25, 1)',
        fill: 'none',
      }
    );
  }, [x, y]);

  return (
    <g transform={`translate(${x},${y})`}>
      {/* Active player ring (stays at tile center) */}
      {isActive && (
        <ellipse cx={0} cy={2} rx={10} ry={4} fill="none" stroke={color} strokeWidth={2} opacity={0.7} />
      )}

      {/* Body group — animated via Web Animations API */}
      <g ref={gRef}>
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
    </g>
  );
}

// ============================================================
// World Environment (procedural scenery along the road)
// ============================================================
const WorldEnvironmentSvg = memo(function WorldEnvironmentSvg({ board }: { board: BoardSpace[] }) {
  const maxY = Math.max(...board.map(s => tileSvgPos(s).y));

  const items = useMemo(() => {
    const elements: React.ReactElement[] = [];
    // Scenery starts well outside the board path and sign zone
    const leftEdge = PATH_WIDTH / 2 + 120; // past the signs
    const rightEdge = PATH_WIDTH / 2 + 40;
    let idx = 0;

    for (let row = -60; row <= maxY + 100; row += 80) {
      const progress = Math.max(0, Math.min(1, row / maxY));
      const seed = Math.abs(Math.sin(row * 123.456)) % 1;
      const seed2 = Math.abs(Math.cos(row * 789.012)) % 1;

      // Left side — placed past the sign column
      const lx = -(leftEdge + seed * 60);

      if (progress < 0.2) {
        if (seed > 0.5) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#FFF9C4" roofColor="#E57373" scale={0.9} />);
        } else {
          elements.push(<SvgRoundTree key={idx++} x={lx} y={row} scale={0.8 + seed * 0.5} />);
        }
        if (seed2 > 0.6) elements.push(<SvgTree key={idx++} x={lx - 35} y={row + 25} scale={0.7} />);
      } else if (progress < 0.4) {
        if (seed > 0.4) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#E3F2FD" roofColor="#1565C0" scale={1.1} />);
        }
        if (seed2 > 0.5) elements.push(<SvgFence key={idx++} x={-(leftEdge - 10)} y={row + 25} width={30} />);
      } else if (progress < 0.6) {
        if (seed > 0.3) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#ECEFF1" roofColor="#455A64" scale={1.3} />);
        }
        if (seed2 > 0.4) elements.push(<SvgRoundTree key={idx++} x={lx + 30} y={row + 15} scale={1.1} />);
      } else if (progress < 0.8) {
        if (seed > 0.3) {
          elements.push(<SvgHouse key={idx++} x={lx} y={row} wallColor="#FFF3E0" roofColor="#BF360C" scale={1.2} />);
        }
        if (seed2 > 0.5) elements.push(<SvgTree key={idx++} x={lx + 25} y={row - 20} scale={1.2} />);
        if (seed > 0.7) elements.push(<SvgFence key={idx++} x={-(leftEdge - 10)} y={row} width={35} />);
      } else {
        elements.push(<SvgRoundTree key={idx++} x={lx} y={row} scale={1.3} />);
        if (seed2 > 0.4) elements.push(<SvgTree key={idx++} x={lx - 25} y={row + 15} scale={1} />);
      }

      // Right side
      const rx = rightEdge + seed2 * 60;
      if (seed > 0.3) {
        elements.push(<SvgTree key={idx++} x={rx} y={row} scale={0.7 + seed2 * 0.8} />);
      }
      if (seed2 > 0.6) {
        elements.push(<SvgRoundTree key={idx++} x={rx + 35} y={row + 30} scale={0.9} />);
      }
      if (seed > 0.8) {
        elements.push(<SvgHouse key={idx++} x={rx + 15} y={row} wallColor="#E8EAF6" roofColor="#283593" scale={1 + seed * 0.3} />);
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

  // Compute the center of just the playable tile grid (the black tiles).
  // This is the single anchor point — always locked to viewport center.
  const tileCenter = useMemo(() => {
    if (board.length === 0) return { x: 0, y: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const space of board) {
      const { x, y } = tileSvgPos(space);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  }, [board]);

  // Compute the full bounding box of the board in SVG coordinates
  const sceneBounds = useMemo(() => {
    if (board.length === 0) return { minX: -300, minY: -100, maxX: 300, maxY: 100 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const space of board) {
      const { x, y } = tileSvgPos(space);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    // Include generous margins for scenery, signs, and decorations
    return {
      minX: minX - 350,
      minY: minY - 80,
      maxX: maxX + 350,
      maxY: maxY + 80,
    };
  }, [board]);

  const sceneW = sceneBounds.maxX - sceneBounds.minX;
  const sceneH = sceneBounds.maxY - sceneBounds.minY;

  // How much of the scene to show (in SVG units).
  // Controls zoom level — larger values = more zoomed out.
  const VIEW_WINDOW_W = 750;
  const VIEW_WINDOW_H = 620;

  // Lock the tile grid center to the screen center.
  // The SVG is at left:0, top:0, so SVG coordinate (x,y) maps to
  // pixel (x, y) within the element BEFORE the CSS transform.
  // After transform: pixel = translate + coord * scale.
  // We want tileCenter to map to (cw/2, ch/2):
  //   cw/2 = tx + tileCenter.x * zoom  →  tx = cw/2 - tileCenter.x * zoom
  //   ch/2 = ty + tileCenter.y * zoom  →  ty = ch/2 - tileCenter.y * zoom
  const applyTransform = useCallback(() => {
    const container = containerRef.current;
    const svg = svgRef.current;
    if (!container || !svg) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Uniform zoom: pick the smaller ratio so nothing stretches
    const zoom = Math.min(cw / VIEW_WINDOW_W, ch / VIEW_WINDOW_H);

    // Translate so the tile grid center maps to the screen center
    const tx = cw / 2 - tileCenter.x * zoom;
    const ty = ch / 2 - tileCenter.y * zoom;

    svg.style.transition = 'none';
    svg.style.transform = `translate(${tx}px, ${ty}px) scale(${zoom})`;
    svg.style.transformOrigin = '0 0';
  }, [tileCenter.x, tileCenter.y]);

  // Lock position on mount
  useEffect(() => { applyTransform(); }, [applyTransform]);

  // Re-lock on resize
  useEffect(() => {
    const onResize = () => applyTransform();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [applyTransform]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ background: '#87CEEB', position: 'relative', overflow: 'hidden' }}
    >
      {/*
        The SVG is placed at left:0, top:0 with no viewBox.
        SVG coordinates map 1:1 to element pixels before the CSS transform.
        Since content uses negative coordinates (board centered at x≈0),
        we need overflow:visible so everything renders.
        The CSS transform (translate + scale) handles positioning the
        tile grid center at the viewport center.
      */}
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        width={sceneW}
        height={sceneH}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          overflow: 'visible',
          display: 'block',
        }}
      >
        {/* Sky/ground fill — offset back to cover the full scene area */}
        <rect
          x={sceneBounds.minX}
          y={sceneBounds.minY}
          width={sceneW}
          height={sceneH}
          fill="#87CEEB"
        />

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
