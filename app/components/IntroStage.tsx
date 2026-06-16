'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { loadModel } from '../lib/loadModel';

interface IntroStageProps {
  /** Model to display, or null for a text-only scene. */
  modelUrl: string | null;
  /** Auto-rotate (disabled for reduced-motion). */
  spin: boolean;
}

// A single persistent WebGL stage that shows one GLB at a time, centred, framed
// and slowly rotating under studio-ish lighting. Models are swapped (not the
// renderer) as the active scene changes.
export default function IntroStage({ modelUrl, spin }: IntroStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const currentRef = useRef<THREE.Object3D | null>(null);
  const spinRef = useRef(spin);

  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  // One-time renderer / scene / camera / lights.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.01, 100);
    camera.position.set(0, 0.4, 4.4);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Image-based lighting so metallic surfaces (the car) read properly.
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
    group.position.y = 0.25;
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
    };
  }, []);

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

        // Centre on origin and scale the largest dimension to a fixed size.
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        model.scale.setScalar(2.4 / maxDim);

        groupRef.current.add(model);
        currentRef.current = model;
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [modelUrl]);

  return <div ref={containerRef} className="pointer-events-none absolute inset-0" />;
}
