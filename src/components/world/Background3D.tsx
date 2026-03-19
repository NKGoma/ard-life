'use client';
import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';

// Rolling green terrain
function Terrain() {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(200, 200, 64, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Gentle rolling hills
      const height =
        Math.sin(x * 0.05) * 1.5 +
        Math.cos(y * 0.08) * 1.2 +
        Math.sin((x + y) * 0.03) * 2;
      pos.setZ(i, height);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -3, 0]} receiveShadow>
      <meshStandardMaterial color="#5a9e4b" flatShading />
    </mesh>
  );
}

// Single puffy cloud from merged spheres
function PuffyCloud({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[1.8, 0.3, 0.5]}>
        <sphereGeometry args={[1.6, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[-1.5, 0.2, -0.3]}>
        <sphereGeometry args={[1.4, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
      <mesh position={[0.5, 0.8, 0]}>
        <sphereGeometry args={[1.3, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.85} />
      </mesh>
    </group>
  );
}

// Slow-drifting clouds
function DriftingClouds() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.position.x += delta * 0.5;
      if (groupRef.current.position.x > 40) groupRef.current.position.x = -40;
    }
  });

  return (
    <group ref={groupRef}>
      <PuffyCloud position={[-15, 14, -20]} scale={1.2} />
      <PuffyCloud position={[10, 16, -30]} scale={1} />
      <PuffyCloud position={[-25, 12, -15]} scale={0.8} />
      <PuffyCloud position={[20, 18, -25]} scale={1.4} />
      <PuffyCloud position={[0, 13, -35]} scale={1.1} />
    </group>
  );
}

// Simple low-poly tree
function LowPolyTree({ position }: { position: [number, number, number] }) {
  const scale = 0.6 + Math.random() * 0.6;
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.6, 6]} />
        <meshStandardMaterial color="#6d4c30" />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 2.2, 0]}>
        <coneGeometry args={[1, 2.2, 6]} />
        <meshStandardMaterial color="#2e7d32" flatShading />
      </mesh>
      <mesh position={[0, 3, 0]}>
        <coneGeometry args={[0.7, 1.6, 6]} />
        <meshStandardMaterial color="#388e3c" flatShading />
      </mesh>
    </group>
  );
}

// Scatter trees around the scene — only in the lower/closer area
function TreeField() {
  const trees = useMemo(() => {
    const arr: [number, number, number][] = [];
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * 120;
      const z = -5 - Math.random() * 30; // keep trees close so they stay below the horizon
      const y = -2.5 +
        Math.sin(x * 0.05) * 1.5 +
        Math.cos(z * 0.08) * 1.2 +
        Math.sin((x + z) * 0.03) * 2;
      arr.push([x, y, z]);
    }
    return arr;
  }, []);

  return (
    <>
      {trees.map((pos, i) => (
        <LowPolyTree key={i} position={pos} />
      ))}
    </>
  );
}

export default function Background3D() {
  return (
    <Canvas
      camera={{ position: [0, 8, 25], fov: 55 }}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <Sky
        sunPosition={[50, 40, -30]}
        turbidity={2}
        rayleigh={0.5}
        mieCoefficient={0.005}
        mieDirectionalG={0.8}
      />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 5]} intensity={1.2} />
      <Terrain />
      <TreeField />
      <DriftingClouds />
      <fog attach="fog" args={['#b0d4f1', 30, 120]} />
    </Canvas>
  );
}
