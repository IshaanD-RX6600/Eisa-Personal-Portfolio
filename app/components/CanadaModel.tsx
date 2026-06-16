'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import PinPopup from './PinPopup';

// Provinces are generated from this GeoJSON (one extruded mesh per province),
// which makes them individually hoverable. Pins are still a small GLB.
const GEOJSON_PATH = '/canada-provinces.geojson';
const POINTER_PATH = '/map_pointer_3d_icon.glb';
const POINTER_COLOR = '#D52B1E';

// Degrees to lean each pin off-vertical toward the viewer.
const PIN_TILT_DEG = 45;

const DEG2RAD = Math.PI / 180;

// ─────────────────────────────────────────────────────────────────────────────
// THEME — atmosphere + landmass look (Steps 1–3). All tweakable here.
// ─────────────────────────────────────────────────────────────────────────────
const THEME = {
  bgTop: '#0b0f17',
  bgBottom: '#05070a',
  poolLight: 'rgba(126, 152, 188, 0.12)',
  vignette: 'rgba(0, 0, 0, 0.55)',
  noiseOpacity: 0.04,

  // Elevation ramp (extrusion base → top faces): teal → sage → tan → pale ochre.
  ramp: [
    { t: 0.0, color: '#1c3a39' },
    { t: 0.4, color: '#566b50' },
    { t: 0.72, color: '#b59f73' },
    { t: 1.0, color: '#ece2c9' },
  ] as { t: number; color: string }[],
  sideShadeMin: 0.82,

  ambientColor: '#aeb9cc',
  ambientIntensity: 0.5,
  hemiSky: '#9fb0c8',
  hemiGround: '#191c22',
  hemiIntensity: 0.55,
  keyColor: '#fff3df',
  keyIntensity: 1.25,
  keyDir: [-3, 5, -2] as [number, number, number],

  exposure: 1.05,
};

// MAP — geometry + camera framing for the generated landmass.
const MAP = {
  targetSize: 4, //      world units for the map's largest footprint dimension
  extrudeDepth: 0.16, // province extrusion height
  provinceInset: 0.004, // shrink each province slightly → thin borders, no z-fight
  cameraTiltDeg: 26, //  0 = straight top-down; >0 reveals the 3D depth
  frameMargin: 1.12, //  padding around the map
};

// INTERACTION — hover/selection tuning (Group A onward).
const INTERACTION = {
  // pins (A2)
  pinHoverScale: 1.2,
  pinHoverEmissive: 0.6,
  haloRestScale: 1.1,
  haloHoverScale: 1.9,
  haloHoverOpacity: 0.5,
  labelHoverScale: 1.12,
  hoverLerp: 0.18,
  pinGlowColor: '#e23b3b',
  // provinces (A1)
  provinceLift: 0.04, //  hover lift (× map size)
  provinceLerp: 0.16,
};
// ─────────────────────────────────────────────────────────────────────────────

// Lambert conformal conic projection tuned for Canada (classic fan-out shape).
const LCC = (() => {
  const phi1 = 49 * DEG2RAD;
  const phi2 = 77 * DEG2RAD;
  const phi0 = 49 * DEG2RAD;
  const lam0 = -95 * DEG2RAD;
  const n =
    Math.log(Math.cos(phi1) / Math.cos(phi2)) /
    Math.log(
      Math.tan(Math.PI / 4 + phi2 / 2) / Math.tan(Math.PI / 4 + phi1 / 2),
    );
  const F = (Math.cos(phi1) * Math.pow(Math.tan(Math.PI / 4 + phi1 / 2), n)) / n;
  const rho0 = F / Math.pow(Math.tan(Math.PI / 4 + phi0 / 2), n);
  return { n, F, rho0, lam0 };
})();

function project(lon: number, lat: number): [number, number] {
  const phi = lat * DEG2RAD;
  const lam = lon * DEG2RAD;
  const rho = LCC.F / Math.pow(Math.tan(Math.PI / 4 + phi / 2), LCC.n);
  const x = rho * Math.sin(LCC.n * (lam - LCC.lam0));
  const y = LCC.rho0 - rho * Math.cos(LCC.n * (lam - LCC.lam0));
  return [x, y]; // x = east+, y = north+
}

// Build a 1×256 horizontal gradient texture from the ramp stops.
function makeRampTexture(stops: { t: number; color: string }[]): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 1;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 256, 0);
  stops.forEach((s) => grad.addColorStop(s.t, s.color));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

// A landmass material: matte PBR coloured by a height ramp, with vertical faces
// shaded down and a per-material `uHighlight` (0..1) used for province hover.
function makeLandMaterial(
  ramp: THREE.Texture,
  yMin: number,
  yMax: number,
): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.7,
    side: THREE.DoubleSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uRamp = { value: ramp };
    shader.uniforms.uYMin = { value: yMin };
    shader.uniforms.uYMax = { value: yMax };
    shader.uniforms.uSideShadeMin = { value: THEME.sideShadeMin };
    shader.uniforms.uHighlight = { value: 0 };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vElev;
        varying float vWorldNy;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vElev = transformed.y;`, // local height (0..depth), unaffected by lift
      )
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        vWorldNy = normalize( mat3( modelMatrix ) * objectNormal ).y;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying float vElev;
        varying float vWorldNy;
        uniform sampler2D uRamp;
        uniform float uYMin;
        uniform float uYMax;
        uniform float uSideShadeMin;
        uniform float uHighlight;`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        {
          float elevT = clamp( ( vElev - uYMin ) / max( uYMax - uYMin, 1e-5 ), 0.0, 1.0 );
          vec3 rampCol = texture2D( uRamp, vec2( elevT, 0.5 ) ).rgb;
          float sideShade = mix( uSideShadeMin, 1.0, clamp( abs( vWorldNy ), 0.0, 1.0 ) );
          vec3 base = rampCol * sideShade;
          diffuseColor.rgb = base * ( 1.0 + uHighlight * 0.7 ) + uHighlight * 0.04;
        }`,
      );

    material.userData.shader = shader; // so the render loop can set uHighlight
  };
  return material;
}

// Soft radial halo used as the glow behind each pin (additive-blended sprite).
function makeHaloTexture(hex: string): THREE.CanvasTexture {
  const int = parseInt(hex.replace('#', ''), 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2,
  );
  grad.addColorStop(0, `rgba(${r},${g},${b},0.9)`);
  grad.addColorStop(0.4, `rgba(${r},${g},${b},0.45)`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Per-pin handles so the render loop can animate hover cheaply.
interface PinHandle {
  index: number;
  pivot: THREE.Group;
  halo: THREE.Sprite;
  label: THREE.Sprite;
  material: THREE.MeshStandardMaterial;
  labelBaseScale: THREE.Vector3;
  haloRest: number;
  haloHover: number;
  hover: number;
}

// Per-province handles for hover lift + brighten (A1).
interface ProvinceHandle {
  index: number;
  name: string;
  mesh: THREE.Mesh;
  material: THREE.MeshStandardMaterial;
  hover: number;
}

interface PinSpot {
  lat: number;
  lon: number;
  label: string;
}

// Pins now placed by real geography (projected with the same LCC as the map).
const PIN_SPOTS: PinSpot[] = [
  { lat: 50.1163, lon: -122.9574, label: 'Whistler' },
  { lat: 45.4215, lon: -75.6972, label: 'Ottawa' },
  { lat: 43.6532, lon: -79.3832, label: 'Toronto' },
  { lat: 57.5, lon: -105.5, label: 'Saskatchewan' }, // northern Saskatchewan (approx.)
];

// Optional popup content per pin (keyed by label). Pins without an entry show a
// blank body. Drop your photo at the image path to replace the placeholder.
const PIN_CONTENT: Record<string, { image?: string; body?: string }> = {};

// Pins that navigate to a dedicated page on click instead of opening the popup.
const PIN_ROUTES: Record<string, string> = {
  'Saskatchewan': '/healing-lodge',
  Ottawa: '/ottawa',
  Toronto: '/toronto',
  Whistler: '/whistler',
};

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

  // Which pin's popup is open (null = none). Updated from the Three.js click
  // handler via a ref bridge so the imperative scene can drive React state.
  const [selectedPin, setSelectedPin] = useState<number | null>(null);
  const onSelectRef = useRef<(i: number | null) => void>(() => {});
  const handleClose = useCallback(() => setSelectedPin(null), []);

  // Router + select setter are kept in refs so the imperative Three.js click
  // handler (wired once on mount) always reaches the current instances. Refs are
  // updated in an effect rather than during render.
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    onSelectRef.current = setSelectedPin;
    routerRef.current = router;
  }, [router]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = THEME.exposure;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.zIndex = '10';
    container.appendChild(renderer.domElement);

    scene.add(
      new THREE.AmbientLight(new THREE.Color(THEME.ambientColor), THEME.ambientIntensity),
    );
    scene.add(
      new THREE.HemisphereLight(
        new THREE.Color(THEME.hemiSky),
        new THREE.Color(THEME.hemiGround),
        THEME.hemiIntensity,
      ),
    );
    const keyLight = new THREE.DirectionalLight(
      new THREE.Color(THEME.keyColor),
      THEME.keyIntensity,
    );
    keyLight.position.set(...THEME.keyDir);
    scene.add(keyLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableRotate = false;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.autoRotate = false;

    const rampTexture = makeRampTexture(THEME.ramp);
    const haloTexture = makeHaloTexture(INTERACTION.pinGlowColor);

    // ── Interaction state (Group A) ──────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const pickMeshes: THREE.Mesh[] = []; //   pin meshes
    const provincePickMeshes: THREE.Mesh[] = [];
    const pins: PinHandle[] = [];
    const provinces: ProvinceHandle[] = [];
    let pointerInside = false;
    let pointerDirty = false;
    let hoveredPin = -1;
    let hoveredProvince = -1;
    let liftHeight = 0;

    // Map footprint, filled once geometry is built (for camera framing).
    let mapW = 0;
    let mapD = 0;

    const frameCamera = () => {
      if (!mapW || !mapD) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      const fovV = camera.fov * (Math.PI / 180);
      const fovH = 2 * Math.atan(Math.tan(fovV / 2) * (w / h));
      const distForWidth = mapW / 2 / Math.tan(fovH / 2);
      const distForDepth = mapD / 2 / Math.tan(fovV / 2);
      let distance = Math.max(distForWidth, distForDepth) * MAP.frameMargin;

      const tilt = MAP.cameraTiltDeg * DEG2RAD;
      if (tilt < 0.02) {
        camera.up.set(0, 0, -1); // pure top-down: north toward screen top
        camera.position.set(0, distance, 0);
      } else {
        distance *= 1 + 0.5 * Math.sin(tilt); // a little extra room when tilted
        camera.up.set(0, 1, 0);
        camera.position.set(0, distance * Math.cos(tilt), distance * Math.sin(tilt));
      }
      camera.near = distance / 100;
      camera.far = distance * 100;
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      controls.target.set(0, 0, 0);
      controls.update();
    };

    // ── Build the landmass from GeoJSON ──────────────────────────────────────
    const geometries: THREE.BufferGeometry[] = [];

    const buildProvinces = (
      features: { properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }[],
    ) => {
      const land = new THREE.Group();

      // Pass 1 — projected bounds, to centre + scale the whole map.
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      const eachCoord = (
        geom: { type: string; coordinates: number[][][] | number[][][][] },
        cb: (lon: number, lat: number) => void,
      ) => {
        const polys =
          geom.type === 'Polygon'
            ? [geom.coordinates as number[][][]]
            : (geom.coordinates as number[][][][]);
        for (const poly of polys) for (const ring of poly) for (const c of ring) cb(c[0], c[1]);
      };
      for (const f of features) {
        eachCoord(f.geometry, (lon, lat) => {
          const [px, py] = project(lon, lat);
          if (px < minX) minX = px;
          if (px > maxX) maxX = px;
          if (py < minY) minY = py;
          if (py > maxY) maxY = py;
        });
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      const scale = MAP.targetSize / Math.max(maxX - minX, maxY - minY);

      // shape-space coords (x = east, y = north); rotateX later maps y → -worldZ.
      const toShape = (lon: number, lat: number): THREE.Vector2 => {
        const [px, py] = project(lon, lat);
        return new THREE.Vector2((px - cx) * scale, (py - cy) * scale);
      };

      // Pass 2 — one extruded mesh per province.
      features.forEach((f, index) => {
        const geom = f.geometry;
        const polys =
          geom.type === 'Polygon'
            ? [geom.coordinates as number[][][]]
            : (geom.coordinates as number[][][][]);

        const shapes: THREE.Shape[] = [];
        for (const poly of polys) {
          const [outer, ...holes] = poly;
          const shape = new THREE.Shape(outer.map((c) => toShape(c[0], c[1])));
          for (const h of holes) {
            shape.holes.push(new THREE.Path(h.map((c) => toShape(c[0], c[1]))));
          }
          shapes.push(shape);
        }

        const geo = new THREE.ExtrudeGeometry(shapes, {
          depth: MAP.extrudeDepth,
          bevelEnabled: false,
        });
        geo.rotateX(-Math.PI / 2); // shape XY → world XZ, extrude depth → +Y

        // Inset slightly about the province centre → thin borders, no z-fighting.
        geo.computeBoundingBox();
        const bb = geo.boundingBox!;
        const bcx = (bb.min.x + bb.max.x) / 2;
        const bcz = (bb.min.z + bb.max.z) / 2;
        const s = 1 - MAP.provinceInset;
        geo.translate(-bcx, 0, -bcz);
        geo.scale(s, 1, s);
        geo.translate(bcx, 0, bcz);
        geo.computeVertexNormals();
        geometries.push(geo);

        const material = makeLandMaterial(rampTexture, 0, MAP.extrudeDepth);
        const mesh = new THREE.Mesh(geo, material);
        mesh.userData.provinceIndex = index;
        mesh.userData.name = f.properties.name;
        provincePickMeshes.push(mesh);
        land.add(mesh);

        provinces.push({ index, name: f.properties.name, mesh, material, hover: 0 });
      });

      scene.add(land);

      const box = new THREE.Box3().setFromObject(land);
      const size = box.getSize(new THREE.Vector3());
      mapW = size.x;
      mapD = size.z;
      const maxDim = Math.max(size.x, size.y, size.z);
      liftHeight = maxDim * INTERACTION.provinceLift;
      frameCamera();

      return { toShape, maxDim };
    };

    // ── Pins (placed by lat/lon via the same projection) ─────────────────────
    const buildPins = (toShape: (lon: number, lat: number) => THREE.Vector2, maxDim: number) => {
      const pinHeight = maxDim * 0.08;
      const surfaceY = MAP.extrudeDepth; // pins sit on the top surface

      const pinLoader = new GLTFLoader();
      pinLoader.load(POINTER_PATH, (pin) => {
        if (disposed) return;
        PIN_SPOTS.forEach(({ lat, lon, label }, index) => {
          const p = toShape(lon, lat); // p.x = east, p.y = north
          const x = p.x;
          const z = -p.y; // north → -z

          const marker = pin.scene.clone(true);

          const pinMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(POINTER_COLOR),
            emissive: new THREE.Color(INTERACTION.pinGlowColor),
            emissiveIntensity: 0,
            metalness: 0,
            roughness: 0.5,
          });
          marker.traverse((child) => {
            const mesh = child as THREE.Mesh;
            if (mesh.isMesh) {
              mesh.material = pinMaterial;
              mesh.userData.pinIndex = index;
              pickMeshes.push(mesh);
            }
          });

          const pBox = new THREE.Box3().setFromObject(marker);
          const pSize = pBox.getSize(new THREE.Vector3());
          marker.scale.setScalar(pinHeight / pSize.y);

          const pBoxScaled = new THREE.Box3().setFromObject(marker);
          const pCenter = pBoxScaled.getCenter(new THREE.Vector3());
          marker.position.x -= pCenter.x;
          marker.position.z -= pCenter.z;
          marker.position.y -= pBoxScaled.min.y;

          const pivot = new THREE.Group();
          pivot.add(marker);

          const halo = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: haloTexture,
              color: new THREE.Color(INTERACTION.pinGlowColor),
              transparent: true,
              opacity: 0,
              depthTest: false,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            }),
          );
          const haloRest = pinHeight * INTERACTION.haloRestScale;
          const haloHover = pinHeight * INTERACTION.haloHoverScale;
          halo.scale.setScalar(haloRest);

          const sprite = makeLabel(label, pinHeight * 0.7);
          sprite.position.set(0, pinHeight * 1.7, 0);

          const group = new THREE.Group();
          group.add(halo);
          group.add(pivot);
          group.add(sprite);
          group.position.set(x, surfaceY, z);
          group.rotation.x = THREE.MathUtils.degToRad(-PIN_TILT_DEG);
          scene.add(group);

          pins.push({
            index,
            pivot,
            halo,
            label: sprite,
            material: pinMaterial,
            labelBaseScale: sprite.scale.clone(),
            haloRest,
            haloHover,
            hover: 0,
          });
        });
      });
    };

    fetch(GEOJSON_PATH)
      .then((res) => res.json())
      .then((data: { features: { properties: { name: string }; geometry: { type: string; coordinates: number[][][] | number[][][][] } }[] }) => {
        if (disposed) return;
        const { toShape, maxDim } = buildProvinces(data.features);
        buildPins(toShape, maxDim);
      })
      .catch((err) => console.error('Failed to load Canada GeoJSON:', err));

    // ── Render loop ──────────────────────────────────────────────────────────
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);

      // A3 — resolve hover once per frame. Pins take priority over provinces.
      if (pointerDirty) {
        pointerDirty = false;
        hoveredPin = -1;
        hoveredProvince = -1;
        if (pointerInside) {
          raycaster.setFromCamera(pointer, camera);
          const pinHits = pickMeshes.length
            ? raycaster.intersectObjects(pickMeshes, false)
            : [];
          if (pinHits.length) {
            hoveredPin = pinHits[0].object.userData.pinIndex as number;
          } else {
            const provHits = provincePickMeshes.length
              ? raycaster.intersectObjects(provincePickMeshes, false)
              : [];
            if (provHits.length) {
              hoveredProvince = provHits[0].object.userData.provinceIndex as number;
            }
          }
        }
        renderer.domElement.style.cursor =
          hoveredPin >= 0 || hoveredProvince >= 0 ? 'pointer' : 'default';
      }

      // A1 — provinces ease toward lift + brighten.
      for (const pr of provinces) {
        const target = pr.index === hoveredProvince ? 1 : 0;
        pr.hover += (target - pr.hover) * INTERACTION.provinceLerp;
        pr.mesh.position.y = pr.hover * liftHeight;
        const sh = pr.material.userData.shader as
          | { uniforms: { uHighlight: { value: number } } }
          | undefined;
        if (sh) sh.uniforms.uHighlight.value = pr.hover;
      }

      // A2 — pins ease toward scale + glow + halo + label highlight.
      for (const p of pins) {
        const target = p.index === hoveredPin ? 1 : 0;
        p.hover += (target - p.hover) * INTERACTION.hoverLerp;

        p.pivot.scale.setScalar(1 + p.hover * (INTERACTION.pinHoverScale - 1));
        p.material.emissiveIntensity = p.hover * INTERACTION.pinHoverEmissive;
        p.halo.scale.setScalar(p.haloRest + p.hover * (p.haloHover - p.haloRest));
        (p.halo.material as THREE.SpriteMaterial).opacity =
          p.hover * INTERACTION.haloHoverOpacity;
        const ls = 1 + p.hover * (INTERACTION.labelHoverScale - 1);
        p.label.scale.set(p.labelBaseScale.x * ls, p.labelBaseScale.y * ls, 1);
      }

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

    const onPointerMove = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      pointerInside = true;
      pointerDirty = true;
    };
    const onPointerLeave = () => {
      pointerInside = false;
      pointerDirty = true;
    };
    renderer.domElement.addEventListener('pointermove', onPointerMove);
    renderer.domElement.addEventListener('pointerleave', onPointerLeave);

    // Click → select a pin (or deselect on empty/province). A small movement
    // threshold rejects drags so this stays click-only once OrbitControls land.
    let downX = 0;
    let downY = 0;
    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };
    const onClick = (e: MouseEvent) => {
      if (Math.hypot(e.clientX - downX, e.clientY - downY) > 5) return; // drag
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = pickMeshes.length
        ? raycaster.intersectObjects(pickMeshes, false)
        : [];
      const hitIndex = hits.length
        ? (hits[0].object.userData.pinIndex as number)
        : null;

      // Pins with a route navigate to their page; the rest open the popup.
      if (hitIndex !== null) {
        const route = PIN_ROUTES[PIN_SPOTS[hitIndex].label];
        if (route) {
          routerRef.current.push(route);
          return;
        }
      }
      onSelectRef.current(hitIndex);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('click', onClick);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerleave', onPointerLeave);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('click', onClick);
      rampTexture.dispose();
      haloTexture.dispose();
      geometries.forEach((g) => g.dispose());
      provinces.forEach((pr) => pr.material.dispose());
      pins.forEach((p) => {
        p.material.dispose();
        (p.halo.material as THREE.SpriteMaterial).dispose();
      });
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
      className="relative h-[75vh] min-h-[500px] w-full overflow-hidden rounded-2xl ring-1 ring-white/5"
      style={{
        background: `linear-gradient(180deg, ${THEME.bgTop} 0%, ${THEME.bgBottom} 100%)`,
      }}
    >
      {/* soft pool of light the map sits in (behind the canvas) */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 42%, ${THEME.poolLight} 0%, transparent 70%)`,
        }}
      />

      {/* canvas is injected here at z-10 */}

      {/* vignette so the map doesn't float in a void (over the canvas) */}
      <div
        className="pointer-events-none absolute inset-0 z-20"
        style={{
          background: `radial-gradient(ellipse 85% 85% at 50% 50%, transparent 55%, ${THEME.vignette} 100%)`,
        }}
      />

      {/* faint grain to kill gradient banding */}
      <div
        className="pointer-events-none absolute inset-0 z-30 mix-blend-soft-light"
        style={{
          opacity: THEME.noiseOpacity,
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Pin detail popup (full-viewport modal layered above the canvas) */}
      <PinPopup
        pinIndex={selectedPin}
        label={selectedPin !== null ? PIN_SPOTS[selectedPin].label : ''}
        image={
          selectedPin !== null
            ? PIN_CONTENT[PIN_SPOTS[selectedPin].label]?.image
            : undefined
        }
        body={
          selectedPin !== null
            ? PIN_CONTENT[PIN_SPOTS[selectedPin].label]?.body
            : undefined
        }
        onClose={handleClose}
      />
    </div>
  );
}
