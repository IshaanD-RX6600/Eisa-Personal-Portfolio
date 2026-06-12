'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ── Tunables ─────────────────────────────────────────────────────────────────
// Converted from the original earth.glb (its KHR_materials_pbrSpecularGlossiness
// material isn't supported by modern three.js) to metallic-roughness via
// `gltf-transform metalrough`, which preserves the embedded Earth texture.
const EARTH_MODEL_PATH = '/earth-mr.glb';
const EARTH_RADIUS = 1; // R — model is normalized to this radius on load
const SPIN_SPEED = 0.25; // radians/sec the globe spins on its axis
const CAMERA_DISTANCE = 3; // fixed camera distance; smaller = bigger globe
// ──────────────────────────────────────────────────────────────────────────────

function Earth() {
  const { scene } = useGLTF(EARTH_MODEL_PATH);
  const spinRef = useRef<THREE.Group>(null);

  // The source GLB can be any size/offset. Measure its bounding sphere, then
  // recenter to the origin and scale so its radius == EARTH_RADIUS.
  const { center, scale } = useMemo(() => {
    const sphere = new THREE.Box3()
      .setFromObject(scene)
      .getBoundingSphere(new THREE.Sphere());
    return {
      center: sphere.center.clone(),
      scale: sphere.radius > 0 ? EARTH_RADIUS / sphere.radius : 1,
    };
  }, [scene]);

  // Spin the globe in place on its vertical axis. The camera never moves.
  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.y += delta * SPIN_SPEED;
  });

  return (
    <group ref={spinRef} scale={scale}>
      <primitive object={scene} position={[-center.x, -center.y, -center.z]} />
    </group>
  );
}
useGLTF.preload(EARTH_MODEL_PATH);

/**
 * A textured Earth that sits dead-center and spins in place. The camera is
 * fixed and there is no mouse interaction.
 */
export default function EarthScene() {
  return (
    <Canvas camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} />
      <Suspense fallback={null}>
        <Earth />
      </Suspense>
    </Canvas>
  );
}
