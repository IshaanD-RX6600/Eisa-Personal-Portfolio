'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// ─────────────────────────────────────────────────────────────────────────────
// 👉 TODO: Drop your Canada .glb file into the `public/` folder, then set its
//    path here. Paths are relative to `public/`, so `public/canada.glb`
//    becomes '/canada.glb'. Until this is set, a placeholder is shown.
const MODEL_PATH: string | null = '/Copy%20of%20Canada%20Map%20for%20Autodesk.glb';

// 👉 Color applied to the model's surfaces. Edit to taste (any CSS/hex color).
const MODEL_COLOR = '#D52B1E'; // Canada-flag red
// ─────────────────────────────────────────────────────────────────────────────

export default function CanadaModel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !MODEL_PATH) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene + camera + renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Lighting (bright enough to read the recolored surfaces clearly)
    scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(0, 10, 2);
    scene.add(keyLight);

    // Controls — stationary by default (drag to look around if desired)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = false;

    // Load the GLB model
    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;

        // Recolor every surface of the model
        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            const materials = Array.isArray(mesh.material)
              ? mesh.material
              : [mesh.material];
            materials.forEach((mat) => {
              const m = mat as THREE.MeshStandardMaterial;
              if (m.color) m.color.set(MODEL_COLOR);
            });
          }
        });

        // Center the model and frame it in view
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const distance = (maxDim / 2) / Math.tan(fov / 2);

        // Top-down view: camera directly above, looking straight down.
        camera.up.set(0, 0, -1);
        camera.position.set(0, distance * 1.6, 0);
        camera.near = distance / 100;
        camera.far = distance * 100;
        camera.updateProjectionMatrix();
        controls.target.set(0, 0, 0);
        controls.update();

        scene.add(model);
      },
      undefined,
      (error) => {
        console.error('Failed to load GLB model:', error);
      },
    );

    // Render loop
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex h-[500px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-white/25 bg-white/5"
    >
      {!MODEL_PATH && (
        <p className="px-4 text-center text-sm text-white/50">
          3D Canada model placeholder — drop a <code>.glb</code> into{' '}
          <code>public/</code> and set <code>MODEL_PATH</code> in{' '}
          <code>app/components/CanadaModel.tsx</code>.
        </p>
      )}
    </div>
  );
}
