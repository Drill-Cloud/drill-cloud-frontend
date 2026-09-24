import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type TelemetryTone = 'online' | 'warning' | 'neutral';

const copper = '#d49a6a';
const copperDark = '#9d6240';
const sand = '#d7b078';
const statusColors: Record<TelemetryTone, string> = {
  online: '#45d6a3',
  warning: '#f2b354',
  neutral: '#9d725b',
};

function PanelGrid() {
  const verticals = useMemo(() => Array.from({ length: 15 }, (_, index) => -3.12 + index * 0.446), []);
  const horizontals = useMemo(() => Array.from({ length: 9 }, (_, index) => -1.4 + index * 0.35), []);

  return (
    <group position={[0, 0, -0.055]}>
      {verticals.map((x) => (
        <mesh key={`v-${x}`} position={[x, 0, 0]}>
          <boxGeometry args={[0.008, 2.92, 0.008]} />
          <meshBasicMaterial color={copper} transparent opacity={0.085} />
        </mesh>
      ))}
      {horizontals.map((y) => (
        <mesh key={`h-${y}`} position={[0, y, 0]}>
          <boxGeometry args={[6.28, 0.008, 0.008]} />
          <meshBasicMaterial color={copper} transparent opacity={0.075} />
        </mesh>
      ))}
    </group>
  );
}

function TelemetryWave({ amplitude, color, phase, y }: { amplitude: number; color: string; phase: number; y: number }) {
  const geometry = useMemo(() => {
    const positions = new Float32Array(100 * 3);
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(positions, 3));
  }, []);
  const material = useMemo(() => new THREE.LineBasicMaterial({
    blending: THREE.AdditiveBlending,
    color,
    opacity: 0.58,
    transparent: true,
  }), [color]);
  const line = useMemo(() => new THREE.Line(geometry, material), [geometry, material]);

  useEffect(() => () => {
    geometry.dispose();
    material.dispose();
  }, [geometry, material]);

  useFrame((state) => {
    const time = state.clock.elapsedTime;
    const attribute = geometry.attributes.position as THREE.BufferAttribute;

    for (let index = 0; index < 100; index += 1) {
      const x = -3.08 + index * 0.0622;
      const pulse = Math.exp(-Math.pow(((index + time * 15) % 100) - 48, 2) / 150);
      const signal = Math.sin(index * 0.19 + time * 1.1 + phase) * amplitude
        + Math.sin(index * 0.055 - time * 0.35 + phase) * amplitude * 0.35
        + pulse * amplitude * 1.9;
      attribute.setXYZ(index, x, y + signal, 0.08);
    }

    attribute.needsUpdate = true;
    material.opacity = 0.53 + Math.sin(time * 0.75 + phase) * 0.08;
  });

  return <primitive object={line} />;
}

function SignalBars() {
  const bars = useRef<Array<THREE.Mesh | null>>([]);
  const data = useMemo(() => Array.from({ length: 32 }, (_, index) => ({
    x: -2.96 + index * 0.191,
    phase: index * 0.47,
    weight: 0.16 + ((index * 7) % 9) * 0.028,
  })), []);

  useFrame((state) => {
    data.forEach((meta, index) => {
      const bar = bars.current[index];
      if (!bar) return;
      const activity = 0.12 + (Math.sin(state.clock.elapsedTime * 1.02 + meta.phase) + 1) * 0.52 + meta.weight;
      bar.scale.y = activity;
      bar.position.y = -1.34 + activity * 0.41;
      (bar.material as THREE.MeshBasicMaterial).opacity = 0.22 + activity * 0.58;
    });
  });

  return (
    <group>
      {data.map((bar, index) => (
        <mesh key={bar.x} ref={(element) => { bars.current[index] = element; }} position={[bar.x, -1.05, 0.1]}>
          <boxGeometry args={[0.04, 0.82, 0.04]} />
          <meshBasicMaterial color={index % 9 === 0 ? copperDark : index % 6 === 0 ? sand : copper} transparent opacity={0.62} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

function DepthScale() {
  const marker = useRef<THREE.Mesh | null>(null);

  useFrame((state) => {
    const progress = (state.clock.elapsedTime * 0.085) % 1;
    if (!marker.current) return;
    marker.current.position.y = 1.23 - progress * 2.46;
    (marker.current.material as THREE.MeshBasicMaterial).opacity = Math.sin(progress * Math.PI) * 0.95;
  });

  return (
    <group position={[3.18, 0, 0.1]}>
      <mesh><boxGeometry args={[0.012, 2.52, 0.012]} /><meshBasicMaterial color={copperDark} transparent opacity={0.35} /></mesh>
      {[-1.2, -0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2].map((y, index) => (
        <mesh key={y} position={[-0.1 - (index % 2) * 0.05, y, 0]}>
          <boxGeometry args={[0.16 + (index % 2) * 0.1, 0.012, 0.012]} />
          <meshBasicMaterial color={copperDark} transparent opacity={0.38} />
        </mesh>
      ))}
      <mesh ref={marker} position={[-0.14, 1.23, 0.02]}>
        <boxGeometry args={[0.31, 0.038, 0.03]} />
        <meshBasicMaterial color="#f2b354" transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

function HeroTelemetrySystem() {
  const system = useRef<THREE.Group | null>(null);

  useFrame((state) => {
    if (!system.current) return;
    system.current.rotation.x = THREE.MathUtils.lerp(system.current.rotation.x, -0.065 + state.pointer.y * 0.025, 0.035);
    system.current.rotation.y = THREE.MathUtils.lerp(system.current.rotation.y, -0.12 + state.pointer.x * 0.055, 0.035);
    system.current.position.x = THREE.MathUtils.lerp(system.current.position.x, 0.82 + state.pointer.x * 0.055, 0.03);
    system.current.position.y = 0.2 + Math.sin(state.clock.elapsedTime * 0.24) * 0.018;
  });

  return (
    <group ref={system} position={[0.82, 0.2, 0]} rotation={[-0.065, -0.12, -0.015]} scale={[1.12, 1.12, 1.12]}>
      <mesh position={[0, 0, -0.08]}><planeGeometry args={[6.72, 3.2]} /><meshBasicMaterial color="#170d08" transparent opacity={0.32} side={THREE.DoubleSide} /></mesh>
      <PanelGrid />
      <TelemetryWave y={0.9} color={copper} phase={0.2} amplitude={0.1} />
      <TelemetryWave y={0.43} color={sand} phase={1.4} amplitude={0.085} />
      <TelemetryWave y={-0.04} color={copperDark} phase={2.7} amplitude={0.095} />
      <TelemetryWave y={-0.51} color="#eba35f" phase={4.1} amplitude={0.075} />
      <SignalBars />
      <DepthScale />
    </group>
  );
}

export function TelemetryHeroScene() {
  return (
    <Canvas camera={{ position: [0, 0.2, 6.8], fov: 39 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.6]}>
      <ambientLight intensity={0.48} />
      <pointLight position={[2.6, 2.4, 4]} intensity={15} color={copper} distance={10} />
      <pointLight position={[-2, -1, 3]} intensity={8} color={copperDark} distance={8} />
      <HeroTelemetrySystem />
      <fog attach="fog" args={['#080503', 6.5, 10]} />
    </Canvas>
  );
}

function CompactTelemetryField({ tone }: { tone: TelemetryTone }) {
  const bars = useRef<Array<THREE.Mesh | null>>([]);
  const cursor = useRef<THREE.Mesh | null>(null);
  const color = statusColors[tone];
  const data = useMemo(() => Array.from({ length: 9 }, (_, index) => ({ x: -0.72 + index * 0.18, phase: index * 0.72 })), []);

  useFrame((state) => {
    data.forEach((meta, index) => {
      const bar = bars.current[index];
      if (!bar) return;
      const activity = 0.4 + (Math.sin(state.clock.elapsedTime * 1.45 + meta.phase) + 1) * 0.28;
      bar.scale.y = activity;
      bar.position.y = -0.33 + activity * 0.38;
      (bar.material as THREE.MeshBasicMaterial).opacity = 0.3 + activity * 0.7;
    });
    if (cursor.current) cursor.current.position.x = -0.75 + ((state.clock.elapsedTime * 0.32) % 1.5);
  });

  return (
    <group rotation={[0.08, -0.12, 0]}>
      <mesh position={[0, -0.36, 0]}><boxGeometry args={[1.75, 0.018, 0.7]} /><meshBasicMaterial color={copper} transparent opacity={0.25} /></mesh>
      {data.map((item, index) => (
        <mesh key={item.x} ref={(element) => { bars.current[index] = element; }} position={[item.x, -0.1, ((index % 3) - 1) * 0.15]}>
          <boxGeometry args={[0.045, 0.76, 0.045]} />
          <meshBasicMaterial color={index % 4 === 0 ? copper : color} transparent opacity={0.72} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      <mesh ref={cursor} position={[-0.75, -0.36, 0.22]}><boxGeometry args={[0.08, 0.035, 0.08]} /><meshBasicMaterial color={color} /></mesh>
    </group>
  );
}

export function TelemetryStatusScene({ tone }: { tone: TelemetryTone }) {
  return (
    <Canvas camera={{ position: [0, 0.1, 4.1], fov: 44 }} gl={{ alpha: true, antialias: true }} dpr={[1, 1.4]}>
      <ambientLight intensity={0.58} />
      <pointLight position={[2, 2, 3]} intensity={10} color={statusColors[tone]} />
      <CompactTelemetryField tone={tone} />
    </Canvas>
  );
}
