'use client';

import { Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ── Tunables ─────────────────────────────────────────────────────────────────
// Converted from the original earth.glb (its KHR_materials_pbrSpecularGlossiness
// material isn't supported by modern three.js) to metallic-roughness via
// `gltf-transform metalrough`, which preserves the embedded Earth texture.
const EARTH_MODEL_PATH = '/earth-mr.glb';
const EARTH_RADIUS = 1; // R — model is normalized to this radius on load
const SPIN_SPEED = 0.25; // radians/sec the globe spins while idle
const CAMERA_DISTANCE = 3; // fixed idle camera distance; smaller = bigger globe
const LON_OFFSET = 0; // degrees — tune to correct the GLB texture seam
const ZOOM_DISTANCE = 1.1; // gap between camera and surface at the close-up
const ANIM_DURATION = 2.2; // seconds for the zoom-in
const CANADA: [number, number] = [56, -106]; // ~56°N, 106°W

const POINTER_MODEL_PATH = '/map_pointer_3d_icon.glb';
const KITCHENER: [number, number] = [43.45, -80.49]; // Kitchener, Ontario
const POINTER_HEIGHT = 0.12; // pin height relative to the earth radius (1)
// ──────────────────────────────────────────────────────────────────────────────

const DEG2RAD = Math.PI / 180;

// lat/lon (degrees) → point on a sphere of `radius` centered at the origin.
function latLonToVector3(
  lat: number,
  lon: number,
  radius = EARTH_RADIUS,
  lonOffset = LON_OFFSET,
): THREE.Vector3 {
  const phi = lat * DEG2RAD;
  const theta = (lon + lonOffset) * DEG2RAD;
  return new THREE.Vector3(
    radius * Math.cos(phi) * Math.cos(theta),
    radius * Math.sin(phi),
    -radius * Math.cos(phi) * Math.sin(theta),
  );
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

type EarthProps = {
  groupRef: React.RefObject<THREE.Group | null>;
  spinning: React.RefObject<boolean>;
};

function Earth({ groupRef, spinning }: EarthProps) {
  const { scene } = useGLTF(EARTH_MODEL_PATH);

  // Normalize any source GLB: recenter to the origin and scale to EARTH_RADIUS.
  // Use half the box's largest dimension as the radius (the true sphere radius);
  // a bounding *sphere* of the box would be ~1.73x too large for a globe.
  const { center, scale } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const radius = Math.max(size.x, size.y, size.z) / 2;
    return {
      center: box.getCenter(new THREE.Vector3()),
      scale: radius > 0 ? EARTH_RADIUS / radius : 1,
    };
  }, [scene]);

  // Spin in place while idle; stops once a focus animation takes over.
  useFrame((_, delta) => {
    if (spinning.current && groupRef.current) {
      groupRef.current.rotation.y += delta * SPIN_SPEED;
    }
  });

  // The rotation group stays in world units (surface at EARTH_RADIUS) so markers
  // can be placed directly via latLonToVector3; only the model is scaled.
  return (
    <group ref={groupRef}>
      <group scale={scale}>
        <primitive
          object={scene}
          position={[-center.x, -center.y, -center.z]}
        />
      </group>
      <Marker lat={KITCHENER[0]} lon={KITCHENER[1]} />
    </group>
  );
}
useGLTF.preload(EARTH_MODEL_PATH);

// A 3D pin standing on the globe's surface at a given lat/lon. Lives inside the
// rotating group, so it spins locked to its location.
function Marker({ lat, lon }: { lat: number; lon: number }) {
  const { scene } = useGLTF(POINTER_MODEL_PATH);
  const model = useMemo(() => scene.clone(true), [scene]);

  // Scale the pin to POINTER_HEIGHT and sit its base on the local origin.
  const { scale, baseOffset } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const height = size.y || Math.max(size.x, size.z) || 1;
    return {
      scale: POINTER_HEIGHT / height,
      baseOffset: new THREE.Vector3(-center.x, -box.min.y, -center.z),
    };
  }, [model]);

  // Place at the surface point and stand it up along the surface normal.
  const { position, quaternion } = useMemo(() => {
    const pos = latLonToVector3(lat, lon, EARTH_RADIUS);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      pos.clone().normalize(),
    );
    return { position: pos, quaternion: q };
  }, [lat, lon]);

  return (
    <group position={position} quaternion={quaternion}>
      <group scale={scale}>
        <primitive object={model} position={baseOffset} />
      </group>
    </group>
  );
}
useGLTF.preload(POINTER_MODEL_PATH);

type TweenState = {
  active: boolean;
  elapsed: number;
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
};

type CameraFocusProps = {
  earthRef: React.RefObject<THREE.Group | null>;
  spinning: React.RefObject<boolean>;
  focusRegion: [number, number] | null;
  resetSignal: number;
};

function CameraFocus({
  earthRef,
  spinning,
  focusRegion,
  resetSignal,
}: CameraFocusProps) {
  const camera = useThree((s) => s.camera);
  const tween = useRef<TweenState | null>(null);
  const lookAt = useRef(new THREE.Vector3(0, 0, 0)); // camera starts looking at origin

  const focusOnRegion = (lat: number, lon: number) => {
    // Freeze the globe so it doesn't carry the region out of frame.
    spinning.current = false;

    // The region's point in the globe's current world orientation.
    const local = latLonToVector3(lat, lon);
    const world =
      earthRef.current?.quaternion != null
        ? local.clone().applyQuaternion(earthRef.current.quaternion)
        : local;

    // Camera ends up along that point's surface normal, pulled out by the gap.
    const toPos = world
      .clone()
      .normalize()
      .multiplyScalar(EARTH_RADIUS + ZOOM_DISTANCE);

    tween.current = {
      active: true,
      elapsed: 0,
      fromPos: camera.position.clone(),
      toPos,
      fromTarget: lookAt.current.clone(),
      toTarget: world,
    };
  };

  // Fly back to the opening view and resume the idle spin.
  const resetView = () => {
    spinning.current = true;
    tween.current = {
      active: true,
      elapsed: 0,
      fromPos: camera.position.clone(),
      toPos: new THREE.Vector3(0, 0, CAMERA_DISTANCE),
      fromTarget: lookAt.current.clone(),
      toTarget: new THREE.Vector3(0, 0, 0),
    };
  };

  useFrame((_, delta) => {
    const t = tween.current;
    if (!t || !t.active) return;

    t.elapsed += delta;
    const progress = Math.min(t.elapsed / ANIM_DURATION, 1);
    const e = easeInOutCubic(progress);

    camera.position.lerpVectors(t.fromPos, t.toPos, e);
    lookAt.current.lerpVectors(t.fromTarget, t.toTarget, e);
    camera.lookAt(lookAt.current);

    if (progress >= 1) t.active = false;
  });

  // Kick off the zoom when the page hands us a region (e.g. on button click).
  useEffect(() => {
    if (focusRegion) focusOnRegion(focusRegion[0], focusRegion[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRegion]);

  // Reset to the opening view when the signal increments (skip initial mount).
  useEffect(() => {
    if (resetSignal > 0) resetView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return null;
}

type EarthSceneProps = {
  /** Set to a [lat, lon] to fly the camera in and zoom on that region. */
  focusRegion?: [number, number] | null;
  /** Increment to fly the camera back to the opening view. */
  resetSignal?: number;
};

/**
 * Spinning Earth that zooms onto a region when `focusRegion` is provided, and
 * flies back to the opening view when `resetSignal` increments.
 */
export default function EarthScene({
  focusRegion = null,
  resetSignal = 0,
}: EarthSceneProps) {
  const earthRef = useRef<THREE.Group>(null);
  const spinning = useRef(true);

  return (
    <Canvas camera={{ position: [0, 0, CAMERA_DISTANCE], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 3, 5]} intensity={1.4} />
      <Suspense fallback={null}>
        <Earth groupRef={earthRef} spinning={spinning} />
      </Suspense>
      <CameraFocus
        earthRef={earthRef}
        spinning={spinning}
        focusRegion={focusRegion}
        resetSignal={resetSignal}
      />
    </Canvas>
  );
}

export { CANADA };
