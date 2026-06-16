import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Module-level cache so each model is fetched/parsed once and reused. This also
// lets a heavy model (the Supra) be preloaded ahead of the scene that needs it.
// Consumers should clone `gltf.scene` rather than mutate the shared instance.
const cache = new Map<string, Promise<GLTF>>();

export function loadModel(
  url: string,
  onProgress?: (fraction: number) => void,
): Promise<GLTF> {
  const existing = cache.get(url);
  if (existing) return existing;

  const loader = new GLTFLoader();
  const promise = new Promise<GLTF>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => resolve(gltf),
      (event) => {
        if (onProgress && event.total > 0) onProgress(event.loaded / event.total);
      },
      (err) => reject(err),
    );
  });

  cache.set(url, promise);
  return promise;
}
