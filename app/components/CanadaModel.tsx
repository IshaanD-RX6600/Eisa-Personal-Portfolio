'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const MODEL_PATH: string | null = '/Copy%20of%20Canada%20Map%20for%20Autodesk.glb';
const MODEL_COLOR = '#FFFFFF';

const POINTER_PATH = '/map_pointer_3d_icon.glb';
const POINTER_COLOR = '#D52B1E';

// Degrees to lean each pin off-vertical toward the viewer.
const PIN_TILT_DEG = 45;

interface PinSpot {
  // Fractions of the model bounding box:
  //   fx 0 = western edge, 1 = eastern edge
  //   fz 0 = northern edge, 1 = southern edge
  fx: number;
  fz: number;
  label: string;
}

// Positions are tuned visually against the rendered model rather than raw
// lat/long, since the GLB's projection doesn't map linearly to geography.
//   fx 0 = west edge, 1 = east edge
//   fz 0 = north edge, 1 = south edge
const PIN_SPOTS: PinSpot[] = [
  { fx: 0.15, fz: 0.74, label: 'Whistler' },        // southwestern BC (~50.1°N, 122.96°W)
  { fx: 0.71, fz: 0.84, label: 'Ottawa' },          // Ontario/Quebec border (~45.4°N, 75.7°W)
  { fx: 0.67, fz: 0.90, label: 'Toronto' },         // southern Ontario, near Lake Ontario (~43.7°N, 79.4°W)
  { fx: 0.35, fz: 0.57, label: 'Healing Lodge' },   // northern Saskatchewan (~58°N, 106°W)
];

function makeLabel(text: string, pinHeight: number): THREE.Sprite {
  const W = 220;
  const H = 48;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  ctx.fillRect(0, 0, W, H);

  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, H / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(pinHeight * (W / H) * 1.1, pinHeight * 1.1, 1);
  return sprite;
}

export default function CanadaModel() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !MODEL_PATH) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.45));
    scene.add(new THREE.HemisphereLight(0xffffff, 0x555555, 0.55));
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.85);
    keyLight.position.set(2, 10, 3);
    scene.add(keyLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = false;

    // Map footprint, filled in once the model loads, so the camera can be
    // re-framed on resize as well as on first load.
    let mapW = 0; // east-west extent (size.x)
    let mapD = 0; // north-south extent (size.z)

    // Pull the camera back just far enough that the whole map fills the frame:
    // the east-west span must fit the horizontal FOV and the north-south span
    // the vertical FOV. Use the tighter of the two, plus a small margin so the
    // pin labels at the edges aren't clipped.
    const frameCamera = () => {
      if (!mapW || !mapD) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const fovV = camera.fov * (Math.PI / 180);
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * (w / h));
      const distForWidth = mapW / 2 / Math.tan(fovH / 2);
      const distForDepth = mapD / 2 / Math.tan(fovV / 2);
      const distance = Math.max(distForWidth, distForDepth) * 1.08;

      camera.up.set(0, 0, -1);
      camera.position.set(0, distance, 0);
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    };

    const loader = new GLTFLoader();
    loader.load(
      MODEL_PATH,
      (gltf) => {
        const model = gltf.scene;

        const surface = new THREE.MeshStandardMaterial({
          color: new THREE.Color(MODEL_COLOR),
          metalness: 0,
          roughness: 0.65,
        });
        model.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) mesh.material = surface;
        });

        // Center and frame the model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        model.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);

        // Record the footprint and frame the camera to fill the view.
        mapW = size.x;
        mapD = size.z;
        frameCamera();

        scene.add(model);
        model.updateMatrixWorld(true);

        // Pin dimensions
        const pinHeight = maxDim * 0.08;
        // After centering, the model top surface is at y = +size.y / 2
        const surfaceY = size.y / 2;

        const pinLoader = new GLTFLoader();
        pinLoader.load(POINTER_PATH, (pin) => {
          const pinMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(POINTER_COLOR),
            metalness: 0,
            roughness: 0.5,
          });
          pin.scene.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) mesh.material = pinMaterial;
          });

          PIN_SPOTS.forEach(({ fx, fz, label }) => {
            // Map [0,1] fractions to centered model coordinates:
            //   fx 0.5 → x=0 (model center east-west)
            //   fz 0.5 → z=0 (model center north-south)
            const x = (fx - 0.5) * size.x;
            const z = (fz - 0.5) * size.z;

            const marker = pin.scene.clone(true);

            // Scale pin relative to map
            const pBox = new THREE.Box3().setFromObject(marker);
            const pSize = pBox.getSize(new THREE.Vector3());
            marker.scale.setScalar(pinHeight / pSize.y);

            // Seat the tip (bounding-box minimum) at y=0 of the group
            const pBoxScaled = new THREE.Box3().setFromObject(marker);
            const pCenter = pBoxScaled.getCenter(new THREE.Vector3());
            marker.position.x -= pCenter.x;
            marker.position.z -= pCenter.z;
            marker.position.y -= pBoxScaled.min.y;

            const group = new THREE.Group();
            group.add(marker);

            // Label floats above the pin body
            const sprite = makeLabel(label, pinHeight * 0.7);
            sprite.position.set(0, pinHeight * 1.7, 0);
            group.add(sprite);

            // Place on the map surface and tilt toward viewer
            group.position.set(x, surfaceY, z);
            group.rotation.x = THREE.MathUtils.degToRad(-PIN_TILT_DEG);
            scene.add(group);
          });
        });
      },
      undefined,
      (error) => {
        console.error('Failed to load GLB model:', error);
      },
    );

    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      frameCamera();
    };
    window.addEventListener('resize', handleResize);

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
      className="relative flex h-[75vh] min-h-[500px] w-full items-center justify-center overflow-hidden"
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
