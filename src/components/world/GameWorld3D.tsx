'use client';
import React, { useRef, useMemo, memo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import {
  BoardSpace, Player, PLAYER_COLORS, getSpaceVisual, getStageMeta,
  LifeStage, TOPS, BOTTOMS, SHOES,
} from '@/types';

// Shared geometry & material caches (created once, reused everywhere)
const _sharedVec3A = new THREE.Vector3();
const _sharedVec3B = new THREE.Vector3();
const _sharedVec3C = new THREE.Vector3();

// ============================================================
// Constants
// ============================================================
const TILE_SPACING = 2.2;
const TILE_SIZE = 1.6;
const TILE_HEIGHT = 0.25;
const BOARD_COLS = 7;
const PATH_WIDTH = BOARD_COLS * TILE_SPACING + 4;

// ============================================================
// 3D position from board col/row
// ============================================================
function tileWorldPos(space: BoardSpace): [number, number, number] {
  const x = (space.col - (BOARD_COLS - 1) / 2) * TILE_SPACING;
  const z = space.row * TILE_SPACING;
  return [x, TILE_HEIGHT / 2, z];
}

// ============================================================
// Stage colors for ground sections
// ============================================================
const STAGE_GROUND: Record<LifeStage, string> = {
  kindheit: '#7BC67E',
  jugend: '#5BA85E',
  junges_erwachsenenalter: '#4A9A4D',
  erwachsenenalter: '#5BA85E',
  alter: '#7BC67E',
};

// ============================================================
// Board Tile
// ============================================================
const BoardTile = memo(function BoardTile({ space, isActive, hasActivePulse, isLanded }: {
  space: BoardSpace; isActive: boolean; hasActivePulse: boolean; isLanded?: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  const groupRef = useRef<THREE.Group>(null!);
  const [x, , z] = tileWorldPos(space);
  const visual = getSpaceVisual(space.type);
  const stageMeta = getStageMeta(space.stage);
  const landedT = useRef(0);

  useFrame(({ clock }, delta) => {
    const t = clock.elapsedTime;
    // Glow ring
    if (glowRef.current) {
      glowRef.current.visible = hasActivePulse || !!isLanded;
      if (hasActivePulse || isLanded) {
        const speed = isLanded ? 5 : 3;
        const amplitude = isLanded ? 0.15 : 0.08;
        const s = 1 + Math.sin(t * speed) * amplitude;
        glowRef.current.scale.setScalar(s);
      }
    }
    // Tile raise
    if (meshRef.current) {
      const targetY = isLanded ? TILE_HEIGHT / 2 + 0.3 : isActive ? TILE_HEIGHT / 2 + 0.12 : TILE_HEIGHT / 2;
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, delta * 5);
    }
    // Landing scale pulse
    if (groupRef.current) {
      if (isLanded) {
        landedT.current += delta;
        const pulse = 1 + Math.sin(landedT.current * 6) * 0.06;
        groupRef.current.scale.setScalar(pulse);
      } else {
        landedT.current = 0;
        groupRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group ref={groupRef} position={[x, 0, z]}>
      {/* Tile body */}
      <mesh ref={meshRef} position={[0, TILE_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[TILE_SIZE, TILE_HEIGHT, TILE_SIZE]} />
        <meshStandardMaterial
          color={isLanded ? visual.color : isActive ? visual.color : '#2a3a50'}
          emissive={isLanded ? visual.color : isActive ? visual.color : '#000000'}
          emissiveIntensity={isLanded ? 0.8 : isActive ? 0.4 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Stage color strip on top */}
      <mesh position={[0, TILE_HEIGHT + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[TILE_SIZE * 0.9, TILE_SIZE * 0.12]} />
        <meshStandardMaterial color={stageMeta.color} emissive={stageMeta.color} emissiveIntensity={0.3} />
      </mesh>

      {/* Tile type icon as text */}
      <Text
        position={[0, TILE_HEIGHT + 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.55}
        anchorX="center"
        anchorY="middle"
      >
        {visual.icon}
      </Text>

      {/* Tile number */}
      <Text
        position={[0, TILE_HEIGHT + 0.06, TILE_SIZE * 0.32]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.15}
        color="#8899AA"
        anchorX="center"
        anchorY="middle"
      >
        {`${space.id + 1}`}
      </Text>

      {/* Milestone label */}
      {space.milestoneTitle && (
        <Text
          position={[0, TILE_HEIGHT + 0.5, 0]}
          fontSize={0.18}
          color="#FFD700"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {`⭐ ${space.milestoneTitle}`}
        </Text>
      )}

      {/* Active / landed glow ring */}
      <mesh ref={glowRef} position={[0, 0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <ringGeometry args={[TILE_SIZE * 0.55, TILE_SIZE * 0.75, 32]} />
        <meshStandardMaterial
          color={visual.color}
          emissive={visual.color}
          emissiveIntensity={isLanded ? 3 : 1.5}
          transparent
          opacity={isLanded ? 0.85 : 0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Landing burst light */}
      {isLanded && (
        <pointLight
          position={[0, 1.5, 0]}
          intensity={3}
          distance={5}
          color={visual.color}
        />
      )}
    </group>
  );
});

// ============================================================
// Thick path road
// ============================================================
const PathRoad = memo(function PathRoad({ board }: { board: BoardSpace[] }) {
  const meshes = useMemo(() => {
    const segs: { pos: [number, number, number]; rotY: number; len: number }[] = [];
    for (let i = 0; i < board.length - 1; i++) {
      const [x1, , z1] = tileWorldPos(board[i]);
      const [x2, , z2] = tileWorldPos(board[i + 1]);
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const rotY = -Math.atan2(dz, dx) + Math.PI / 2;
      segs.push({
        pos: [(x1 + x2) / 2, 0.02, (z1 + z2) / 2],
        rotY,
        len,
      });
    }
    return segs;
  }, [board]);

  return (
    <>
      {meshes.map((seg, i) => (
        <mesh key={i} position={seg.pos} rotation={[-Math.PI / 2, 0, seg.rotY]} receiveShadow>
          <planeGeometry args={[0.6, seg.len]} />
          <meshStandardMaterial color="#3a4a5e" roughness={0.8} />
        </mesh>
      ))}
    </>
  );
});

// ============================================================
// 3D Character (full human figure)
// ============================================================
function Character3D({
  player, position, isActive, targetPosition, onArrived,
}: {
  player: Player;
  position: [number, number, number];
  isActive: boolean;
  targetPosition?: [number, number, number] | null;
  onArrived?: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null!);
  const leftArmRef = useRef<THREE.Group>(null!);
  const rightArmRef = useRef<THREE.Group>(null!);
  const leftLegRef = useRef<THREE.Group>(null!);
  const rightLegRef = useRef<THREE.Group>(null!);
  // Internal animation state stored in refs (never read during render)
  const internalPos = useRef(new THREE.Vector3(...position));
  const arrived = useRef(false);
  const prevPos = useRef<[number, number, number]>(position);
  const walkT = useRef(0);
  const moving = useRef(false);

  const color = PLAYER_COLORS[player.id % PLAYER_COLORS.length];
  const avatar = player.avatar;
  const topColor = TOPS.find(t => t.id === avatar.topId)?.color ?? '#4D96FF';
  const bottomColor = BOTTOMS.find(b => b.id === avatar.bottomId)?.color ?? '#3B5998';
  const shoesColor = SHOES.find(s => s.id === avatar.shoesId)?.color ?? '#FFFFFF';

  // Cached vectors for per-frame math (avoid allocations)
  const _targetVec = useRef(new THREE.Vector3());
  const _dirVec = useRef(new THREE.Vector3());

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;

    // Detect position prop change inside useFrame
    if (prevPos.current[0] !== position[0] || prevPos.current[2] !== position[2]) {
      prevPos.current = position;
      internalPos.current.set(...position);
      arrived.current = false;
    }

    const target = _targetVec.current;
    if (targetPosition) {
      target.set(targetPosition[0], targetPosition[1], targetPosition[2]);
    } else {
      target.set(position[0], position[1], position[2]);
    }

    const dist = internalPos.current.distanceTo(target);

    if (dist > 0.05) {
      moving.current = true;
      const dir = _dirVec.current;
      dir.copy(target).sub(internalPos.current).normalize();
      const speed = 4.5;
      const step = Math.min(speed * delta, dist);
      internalPos.current.addScaledVector(dir, step);

      // Face direction of movement
      const angle = Math.atan2(dir.x, dir.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y, angle, delta * 10
      );

      // Walk phase
      walkT.current += delta * 12;
    } else {
      moving.current = false;
      walkT.current = 0;

      if (targetPosition && !arrived.current) {
        arrived.current = true;
        onArrived?.();
      }
    }

    // Update group position
    groupRef.current.position.lerp(internalPos.current, delta * 8);

    // Breathing / walk bob
    const bobY = moving.current
      ? Math.abs(Math.sin(walkT.current)) * 0.08
      : Math.sin(clock.elapsedTime * 2) * 0.02;
    groupRef.current.position.y = TILE_HEIGHT + bobY;

    // Animate limbs
    const armSwing = moving.current ? Math.sin(walkT.current) * 0.5 : 0;
    const legSwing = moving.current ? Math.sin(walkT.current) * 0.4 : 0;
    if (leftArmRef.current) leftArmRef.current.rotation.x = -armSwing;
    if (rightArmRef.current) rightArmRef.current.rotation.x = armSwing;
    if (leftLegRef.current) leftLegRef.current.rotation.x = legSwing;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -legSwing;
  });

  return (
    <group ref={groupRef} position={[position[0], TILE_HEIGHT, position[2]]}>
      {/* Scale inactive characters slightly */}
      <group scale={isActive ? 1 : 0.85}>
        {/* Shoes / Feet */}
        <mesh position={[-0.12, 0.06, 0]} castShadow>
          <boxGeometry args={[0.14, 0.08, 0.22]} />
          <meshStandardMaterial color={shoesColor} roughness={0.6} />
        </mesh>
        <mesh position={[0.12, 0.06, 0]} castShadow>
          <boxGeometry args={[0.14, 0.08, 0.22]} />
          <meshStandardMaterial color={shoesColor} roughness={0.6} />
        </mesh>

        {/* Legs */}
        <group ref={leftLegRef} position={[-0.1, 0.28, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
            <meshStandardMaterial color={bottomColor} roughness={0.5} />
          </mesh>
        </group>
        <group ref={rightLegRef} position={[0.1, 0.28, 0]}>
          <mesh position={[0, 0, 0]} castShadow>
            <capsuleGeometry args={[0.07, 0.3, 4, 8]} />
            <meshStandardMaterial color={bottomColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Torso */}
        <mesh position={[0, 0.62, 0]} castShadow>
          <capsuleGeometry args={[0.16, 0.28, 4, 8]} />
          <meshStandardMaterial color={topColor} roughness={0.4} />
        </mesh>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.26, 0.66, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
            <meshStandardMaterial color={avatar.skinColor} roughness={0.5} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.26, 0.66, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.05, 0.3, 4, 8]} />
            <meshStandardMaterial color={avatar.skinColor} roughness={0.5} />
          </mesh>
        </group>

        {/* Head */}
        <mesh position={[0, 0.96, 0]} castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color={avatar.skinColor} roughness={0.4} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 1.06, 0]} castShadow>
          <sphereGeometry args={[0.14, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
          <meshStandardMaterial color={avatar.hairColor} roughness={0.7} />
        </mesh>

        {/* Eyes */}
        <mesh position={[-0.05, 0.97, 0.14]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>
        <mesh position={[0.05, 0.97, 0.14]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshStandardMaterial color="#1a1a2e" />
        </mesh>

        {/* Name label floating above */}
        <Text
          position={[0, 1.4, 0]}
          fontSize={0.16}
          color={isActive ? '#FFFFFF' : '#AABBCC'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {player.name}
        </Text>

        {/* Active player ring glow on ground */}
        {isActive && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.35, 0.45, 32]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}
      </group>

      {/* Inactive dim filter - slight transparency */}
      {!isActive && (
        <mesh position={[0, 0.5, 0]} visible={false}>
          <boxGeometry args={[0, 0, 0]} />
          <meshStandardMaterial transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================
// Ground terrain per stage
// ============================================================
const StageGrounds = memo(function StageGrounds({ board }: { board: BoardSpace[] }) {
  const bands = useMemo(() => {
    const result: { stage: LifeStage; minZ: number; maxZ: number }[] = [];
    let current: LifeStage | null = null;
    let minZ = 0, maxZ = 0;
    for (const space of board) {
      const [, , z] = tileWorldPos(space);
      if (space.stage !== current) {
        if (current) result.push({ stage: current, minZ, maxZ });
        current = space.stage;
        minZ = z;
        maxZ = z;
      }
      maxZ = Math.max(maxZ, z);
    }
    if (current) result.push({ stage: current, minZ, maxZ });
    return result;
  }, [board]);

  return (
    <>
      {bands.map((band, i) => {
        const height = band.maxZ - band.minZ + TILE_SPACING * 2;
        const centerZ = (band.minZ + band.maxZ) / 2;
        return (
          <mesh key={i} position={[0, -0.01, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[PATH_WIDTH + 30, height]} />
            <meshStandardMaterial
              color={STAGE_GROUND[band.stage]}
              roughness={0.9}
              metalness={0}
          />
        </mesh>
        );
      })}
    </>
  );
});

// ============================================================
// Stage label signs
// ============================================================
const StageSigns = memo(function StageSigns({ board }: { board: BoardSpace[] }) {
  const signs = useMemo(() => {
    const result: { stage: LifeStage; z: number }[] = [];
    let current: LifeStage | null = null;
    for (const space of board) {
      if (space.stage !== current) {
        current = space.stage;
        const [, , z] = tileWorldPos(space);
        result.push({ stage: current, z: z - TILE_SPACING * 0.5 });
      }
    }
    return result;
  }, [board]);

  return (
    <>
      {signs.map((sign, i) => {
        const meta = getStageMeta(sign.stage);
        return (
          <group key={i} position={[-PATH_WIDTH / 2 - 2, 0, sign.z]}>
            {/* Sign post */}
            <mesh position={[0, 1, 0]} castShadow>
              <cylinderGeometry args={[0.05, 0.05, 2, 8]} />
              <meshStandardMaterial color="#5D4037" roughness={0.8} />
            </mesh>
            {/* Sign board */}
            <mesh position={[0, 2.1, 0]} castShadow>
              <boxGeometry args={[2.5, 0.7, 0.08]} />
              <meshStandardMaterial color={meta.color} roughness={0.3} />
            </mesh>
            <Text
              position={[0, 2.1, 0.05]}
              fontSize={0.22}
              color="#FFFFFF"
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {`${meta.emoji} ${meta.name}`}
            </Text>
            <Text
              position={[0, 1.85, 0.05]}
              fontSize={0.12}
              color="#FFFFFFCC"
              anchorX="center"
              anchorY="middle"
            >
              {meta.ages}
            </Text>
          </group>
        );
      })}
    </>
  );
});

// ============================================================
// Environment scenery (houses, trees, props along the road)
// ============================================================
const Tree = memo(function Tree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 1.2, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[0.6, 1.4, 8]} />
        <meshStandardMaterial color="#2E7D32" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.9, 0]} castShadow>
        <coneGeometry args={[0.45, 1, 8]} />
        <meshStandardMaterial color="#388E3C" roughness={0.7} />
      </mesh>
    </group>
  );
});

const RoundTree = memo(function RoundTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1, 6]} />
        <meshStandardMaterial color="#795548" roughness={0.8} />
      </mesh>
      <mesh position={[0, 1.3, 0]} castShadow>
        <sphereGeometry args={[0.55, 12, 12]} />
        <meshStandardMaterial color="#43A047" roughness={0.6} />
      </mesh>
    </group>
  );
});

const House = memo(function House({ position, roofColor, wallColor, scale = 1 }: {
  position: [number, number, number]; roofColor: string; wallColor: string; scale?: number;
}) {
  return (
    <group position={position} scale={scale}>
      {/* Walls */}
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 1.2, 1]} />
        <meshStandardMaterial color={wallColor} roughness={0.6} />
      </mesh>
      {/* Roof */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <coneGeometry args={[1, 0.8, 4]} />
        <meshStandardMaterial color={roofColor} roughness={0.5} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.35, 0.51]}>
        <boxGeometry args={[0.25, 0.5, 0.02]} />
        <meshStandardMaterial color="#5D4037" />
      </mesh>
      {/* Window */}
      <mesh position={[0.35, 0.7, 0.51]}>
        <boxGeometry args={[0.2, 0.2, 0.02]} />
        <meshStandardMaterial color="#BBDEFB" emissive="#BBDEFB" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
});

const Bench = memo(function Bench({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <boxGeometry args={[0.8, 0.06, 0.3]} />
        <meshStandardMaterial color="#795548" roughness={0.7} />
      </mesh>
      <mesh position={[-0.35, 0.12, 0]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.25]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[0.35, 0.12, 0]} castShadow>
        <boxGeometry args={[0.06, 0.25, 0.25]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.45, -0.12]} castShadow>
        <boxGeometry args={[0.8, 0.3, 0.04]} />
        <meshStandardMaterial color="#795548" roughness={0.7} />
      </mesh>
    </group>
  );
});

const Lamppost = memo(function Lamppost({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.2, 0]} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 2.4, 8]} />
        <meshStandardMaterial color="#37474F" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color="#FFF9C4"
          emissive="#FFE082"
          emissiveIntensity={1.5}
          transparent
          opacity={0.9}
        />
      </mesh>
      <pointLight position={[position[0], position[1] + 2.6, position[2]]} intensity={0.6} distance={6} color="#FFE082" />
    </group>
  );
});

const Fence = memo(function Fence({ position, length = 3, rotation = 0 }: {
  position: [number, number, number]; length?: number; rotation?: number;
}) {
  const posts = Math.floor(length / 0.5);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Horizontal rail */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[length, 0.04, 0.04]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.7} />
      </mesh>
      {/* Posts */}
      {Array.from({ length: posts + 1 }).map((_, i) => (
        <mesh key={i} position={[-length / 2 + i * (length / posts), 0.2, 0]} castShadow>
          <boxGeometry args={[0.06, 0.4, 0.06]} />
          <meshStandardMaterial color="#6D4C41" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
});

// Full environment decoration
const WorldEnvironment = memo(function WorldEnvironment({ board }: { board: BoardSpace[] }) {
  const maxZ = Math.max(...board.map(s => tileWorldPos(s)[2]));

  // Generate procedural scenery along the board
  const items = useMemo(() => {
    const elements: React.ReactElement[] = [];
    const side = PATH_WIDTH / 2 + 2;
    let idx = 0;

    for (let z = -2; z <= maxZ + 4; z += 2.5) {
      const progress = z / maxZ; // 0→1 life progression
      const seed = Math.sin(z * 123.456) * 0.5 + 0.5;
      const seed2 = Math.cos(z * 789.012) * 0.5 + 0.5;

      // Left side scenery
      const lx = -(side + 1 + seed * 4);

      if (progress < 0.2) {
        // Childhood: playground, small houses, lots of trees
        if (seed > 0.5) {
          elements.push(<House key={idx++} position={[lx, 0, z]} wallColor="#FFF9C4" roofColor="#E57373" scale={0.9} />);
        } else {
          elements.push(<RoundTree key={idx++} position={[lx, 0, z]} scale={0.8 + seed * 0.5} />);
        }
        if (seed2 > 0.6) elements.push(<Tree key={idx++} position={[lx - 2, 0, z + 1]} scale={0.7} />);
      } else if (progress < 0.4) {
        // Youth: schools, bus stops, more urban
        if (seed > 0.4) {
          elements.push(<House key={idx++} position={[lx, 0, z]} wallColor="#E3F2FD" roofColor="#1565C0" scale={1.1} />);
        }
        elements.push(<Lamppost key={idx++} position={[-(side + 0.5), 0, z]} />);
        if (seed2 > 0.5) elements.push(<Bench key={idx++} position={[-(side + 0.3), 0, z + 1.2]} rotation={Math.PI / 2} />);
      } else if (progress < 0.6) {
        // Young adulthood: apartments, cafés
        if (seed > 0.3) {
          elements.push(<House key={idx++} position={[lx, 0, z]} wallColor="#ECEFF1" roofColor="#455A64" scale={1.3} />);
        }
        if (seed2 > 0.4) elements.push(<RoundTree key={idx++} position={[lx + 2, 0, z + 0.5]} scale={1.1} />);
        elements.push(<Lamppost key={idx++} position={[-(side + 0.5), 0, z]} />);
      } else if (progress < 0.8) {
        // Adulthood: family homes, offices
        if (seed > 0.3) {
          elements.push(<House key={idx++} position={[lx, 0, z]} wallColor="#FFF3E0" roofColor="#BF360C" scale={1.2} />);
        }
        if (seed2 > 0.5) elements.push(<Tree key={idx++} position={[lx + 1.5, 0, z - 1]} scale={1.2} />);
        if (seed > 0.7) elements.push(<Fence key={idx++} position={[-(side + 0.2), 0, z]} length={2} rotation={0} />);
      } else {
        // Later life: parks, gardens, calm
        elements.push(<RoundTree key={idx++} position={[lx, 0, z]} scale={1.3} />);
        if (seed > 0.6) elements.push(<Bench key={idx++} position={[-(side + 0.5), 0, z + 1]} rotation={Math.PI / 2} />);
        if (seed2 > 0.4) elements.push(<Tree key={idx++} position={[lx - 1.5, 0, z + 0.8]} scale={1} />);
      }

      // Right side scenery (mirrored, less dense)
      const rx = side + 1 + seed2 * 4;
      if (seed > 0.3) {
        elements.push(<Tree key={idx++} position={[rx, 0, z]} scale={0.7 + seed2 * 0.8} />);
      }
      if (seed2 > 0.6) {
        elements.push(<RoundTree key={idx++} position={[rx + 2, 0, z + 1.5]} scale={0.9} />);
      }
      if (progress > 0.2 && progress < 0.8 && seed > 0.7) {
        elements.push(<Lamppost key={idx++} position={[side + 0.5, 0, z]} />);
      }
      if (seed > 0.8) {
        elements.push(<House key={idx++} position={[rx + 1, 0, z]} wallColor="#E8EAF6" roofColor="#283593" scale={1 + seed * 0.3} />);
      }
    }

    return elements;
  }, [maxZ]);

  return <>{items}</>;
});

// ============================================================
// Follow camera
// ============================================================
const FollowCamera = memo(function FollowCamera({ target }: { target: [number, number, number] }) {
  const { camera } = useThree();
  const smoothTarget = useRef(new THREE.Vector3(...target));
  const smoothCamPos = useRef(new THREE.Vector3(0, 18, -10));
  // Cached vectors to avoid per-frame allocations
  const _tVec = useRef(new THREE.Vector3());
  const _camPosVec = useRef(new THREE.Vector3());
  const _lookAtVec = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    _tVec.current.set(target[0], target[1], target[2]);
    smoothTarget.current.lerp(_tVec.current, delta * 2.0);

    // Near bird's-eye: high above, slightly offset, angled down
    _camPosVec.current.set(
      smoothTarget.current.x + 0.5,
      smoothTarget.current.y + 16,
      smoothTarget.current.z - 8
    );

    smoothCamPos.current.lerp(_camPosVec.current, delta * 2.0);
    camera.position.copy(smoothCamPos.current);

    _lookAtVec.current.set(smoothTarget.current.x, 0, smoothTarget.current.z);
    camera.lookAt(_lookAtVec.current);
  });

  return null;
});

// ============================================================
// Sky dome
// ============================================================
const SkyDome = memo(function SkyDome() {
  return (
    <>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4a7c59" roughness={1} />
      </mesh>
      <fog attach="fog" args={['#87CEEB', 40, 120]} />
      <color attach="background" args={['#87CEEB']} />
    </>
  );
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

function Scene({ board, players, activePlayerIndex, animatingToPosition, landedTileId, onAnimationComplete }: GameWorld3DProps) {
  const activePlayer = players[activePlayerIndex];
  const activeSpace = board[activePlayer?.position ?? 0];
  const activeWorldPos = activeSpace ? tileWorldPos(activeSpace) : [0, 0, 0] as [number, number, number];

  return (
    <>
      <SkyDome />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 20, -10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-far={60}
        shadow-bias={-0.001}
      />
      <hemisphereLight args={['#87CEEB', '#4a7c59', 0.4]} />

      {/* Ground planes per stage */}
      <StageGrounds board={board} />

      {/* Path road between tiles */}
      <PathRoad board={board} />

      {/* Tiles */}
      {board.map((space) => (
        <BoardTile
          key={space.id}
          space={space}
          isActive={activePlayer?.position === space.id}
          hasActivePulse={activePlayer?.position === space.id}
          isLanded={landedTileId === space.id}
        />
      ))}

      {/* Stage signs */}
      <StageSigns board={board} />

      {/* World scenery */}
      <WorldEnvironment board={board} />

      {/* Players */}
      {players.map((player) => {
        const space = board[player.position] ?? board[0];
        const pos = tileWorldPos(space);
        const isActive = player.id === activePlayer?.id;

        // Offset multiple players on same tile
        const samePos = players.filter(p => p.position === player.position);
        const myIdx = samePos.findIndex(p => p.id === player.id);
        const offset = myIdx * 0.4 - (samePos.length - 1) * 0.2;
        const adjustedPos: [number, number, number] = [pos[0] + offset, pos[1], pos[2]];

        let targetPos: [number, number, number] | null = null;
        if (isActive && animatingToPosition !== null) {
          const targetSpace = board[animatingToPosition];
          if (targetSpace) {
            targetPos = tileWorldPos(targetSpace);
          }
        }

        return (
          <Character3D
            key={player.id}
            player={player}
            position={adjustedPos}
            isActive={isActive}
            targetPosition={targetPos}
            onArrived={isActive ? onAnimationComplete : undefined}
          />
        );
      })}

      {/* Camera */}
      <FollowCamera target={activeWorldPos} />
    </>
  );
}

export default function GameWorld3D(props: GameWorld3DProps) {
  return (
    <div className="w-full h-full overflow-hidden">
      <Canvas
        shadows
        camera={{ position: [0, 18, -10], fov: 48, near: 0.1, far: 150 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        flat
      >
        <Scene {...props} />
      </Canvas>
    </div>
  );
}
