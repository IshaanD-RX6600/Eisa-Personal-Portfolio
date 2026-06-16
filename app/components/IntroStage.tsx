'use client';

import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadModel } from '../lib/loadModel';

interface IntroStageProps {
  /** Model to display, or null for a text-only scene. */
  modelUrl: string | null;
  /** Auto-rotate (disabled for reduced-motion). */
  spin: boolean;
}

const TARGET_SIZE = 2.4; // largest model dimension, in world units
const FIT_MARGIN = 1.25; // breathing room around the framed model

// A single persistent WebGL stage that shows one GLB at a time, centred, framed
// to fit (at any Y-rotation) and slowly rotating under studio-ish lighting.
// Models are swapped (not the renderer) as the active scene changes.
export default function IntroStage({ modelUrl, spin }: IntroStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const currentRef = useRef<THREE.Object3D | null>(null);
  const sizeRef = useRef(new THREE.Vector3(1, 1, 1)); // unrotated size of current model
  const spinRef = useRef(spin);

  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  // Frame the camera to the current model's size with margin. Uses the stored
  // (unrotated) size so spinning doesn't cause the framing to drift, and the
  // widest horizontal extent so the model never clips as it turns.
  const frame = useCallback(() => {
    const cam = cameraRef.current;
    if (!cam || !currentRef.current) return;
    const size = sizeRef.current;
    const fovV = (cam.fov * Math.PI) / 180;
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * cam.aspect);
    const horiz = Math.max(size.x, size.z); // x and z swap as it rotates
    const distForWidth = horiz / 2 / Math.tan(fovH / 2);
    const distForHeight = size.y / 2 / Math.tan(fovV / 2);
    const dist = Math.max(distForWidth, distForHeight) * FIT_MARGIN + horiz / 2;

    cam.position.set(0, size.y * 0.1, dist);
    cam.lookAt(0, -size.y * 0.05, 0);
    cam.near = Math.max(0.01, dist / 100);
    cam.far = dist * 100;
    cam.updateProjectionMatrix();
  }, []);

  // One-time renderer / scene / camera / lights.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 100);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Image-based lighting so metallic surfaces (the car, the cradle) read well.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xfff1da, 1.5);
    key.position.set(3, 5, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6f9bdd, 0.7);
    rim.position.set(-4, 1.5, -3);
    scene.add(rim);

    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;

    const clock = new THREE.Clock();
    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      if (spinRef.current && currentRef.current) group.rotation.y += dt * 0.5;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const w = container.clientWidth || 1;
      const h = container.clientHeight || 1;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      frame();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      groupRef.current = null;
      currentRef.current = null;
      cameraRef.current = null;
    };
  }, [frame]);

  // Swap the displayed model when the active scene changes.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    let cancelled = false;

    if (currentRef.current) {
      group.remove(currentRef.current);
      currentRef.current = null;
    }
    group.rotation.set(0, 0, 0);

    if (!modelUrl) return;

    loadModel(modelUrl)
      .then((gltf) => {
        if (cancelled || !groupRef.current) return;
        const model = gltf.scene.clone(true);

        // 1) Scale so the largest dimension is TARGET_SIZE.
        const size0 = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
        const maxDim = Math.max(size0.x, size0.y, size0.z) || 1;
        model.scale.setScalar(TARGET_SIZE / maxDim);
        model.updateMatrixWorld(true);

        // 2) Re-measure AFTER scaling and translate the centre to the origin.
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        model.updateMatrixWorld(true);

        // 3) Store the now-centred size for framing.
        new THREE.Box3().setFromObject(model).getSize(sizeRef.current);

        groupRef.current.add(model);
        currentRef.current = model;
        frame();
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [modelUrl, frame]);

  return <div ref={containerRef} className="pointer-events-none absolute inset-0" />;
}
