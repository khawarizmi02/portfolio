// Shared plumbing for the small three.js scenes: renderer, resize, pointer, scroll progress, and a render loop
// that sleeps while the canvas is off screen. Scenes only describe what they draw.
import { useEffect, useRef } from "react";
import * as THREE from "three";

/* palette bridge: CSS oklch() tokens → THREE.Color via a 1×1 canvas */
const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
export function cssColor(varName: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#888";
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = v;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return new THREE.Color(r / 255, g / 255, b / 255);
}

// 0 when the element's top enters the bottom of the viewport, 1 when its bottom reaches the bottom of the viewport.
export function scrollProgress(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  const vh = window.innerHeight;
  return Math.min(1, Math.max(0, (vh - r.top) / Math.max(1, r.height)));
}

export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export type SceneCtx = {
  el: HTMLElement;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  // pointer relative to the canvas centre, -1..1, smoothed
  pointer: { x: number; y: number };
  reduce: boolean;
};

export type SceneHooks = {
  tick: (t: number, dt: number, progress: number) => void;
  retheme?: () => void;
  dispose?: () => void;
};

export function mountScene(el: HTMLElement, setup: (ctx: SceneCtx) => SceneHooks, fov = 30) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  const hooks = setup({ el, scene, camera, renderer, pointer, reduce });

  const resize = () => {
    const { width, height } = el.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(el);
  resize();

  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    target.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2));
    target.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
  };
  if (!reduce) window.addEventListener("pointermove", onMove);

  let visible = false;
  const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "100px" });
  io.observe(el);

  let raf = 0,
    last = performance.now();
  const loop = (now: number) => {
    raf = requestAnimationFrame(loop);
    if (!visible) {
      last = now;
      return;
    }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    pointer.x += (target.x - pointer.x) * 0.06;
    pointer.y += (target.y - pointer.y) * 0.06;
    hooks.tick(now / 1000, dt, scrollProgress(el));
    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(loop);

  return {
    retheme: () => hooks.retheme?.(),
    destroy: () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      hooks.dispose?.();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
        mats.forEach((mat) => {
          Object.values(mat).forEach((v) => v instanceof THREE.Texture && v.dispose());
          mat.dispose();
        });
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// React wrapper: mounts once, re-reads the palette whenever `themeKey` changes (the weather provider has already
// written the new tokens by then). Props that change later should be passed through refs.
export function useScene(setup: (ctx: SceneCtx) => SceneHooks, themeKey: string, fov?: number) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<ReturnType<typeof mountScene> | null>(null);
  useEffect(() => {
    const h = mountScene(host.current!, setup, fov);
    handle.current = h;
    return () => h.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => handle.current?.retheme(), [themeKey]);
  return host;
}
