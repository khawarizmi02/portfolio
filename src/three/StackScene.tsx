// "One person, both halves" as four slabs: Infra, Data, API, Interface.
//   explode – the slabs pull apart as the section crosses the viewport and close up again as it leaves
//   trace   – the slabs hover apart while requests fall from the UI to the database and the responses climb back up
// Hovering a row in the Stack list lifts its layer. Loaded lazily with three.js.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp01, cssColor, ease, useScene } from "./mount";
import { LAYERS, type LayerKey } from "./layers";
import { useWeather } from "../weather/WeatherProvider";

const W = 3.2,
  D = 2.2,
  T = 0.24;

// Top face artwork: label, subtitle, and a tiny glyph of what lives on that layer.
function drawFace(cv: HTMLCanvasElement, key: LayerKey, label: string, sub: string, ink: string, accent: string) {
  const x = cv.getContext("2d")!;
  const w = cv.width,
    h = cv.height;
  x.clearRect(0, 0, w, h);
  // dot grid
  x.fillStyle = ink;
  x.globalAlpha = 0.14;
  for (let gx = 40; gx < w; gx += 40) for (let gy = 40; gy < h; gy += 40) x.fillRect(gx - 2, gy - 2, 4, 4);
  x.globalAlpha = 1;

  x.font = "600 92px 'DM Sans', system-ui, sans-serif";
  x.fillStyle = ink;
  x.fillText(label, 56, h - 120);
  x.font = "500 54px 'DM Sans', system-ui, sans-serif";
  x.globalAlpha = 0.7;
  x.fillText(sub, 58, h - 58);
  x.globalAlpha = 1;

  x.strokeStyle = accent;
  x.fillStyle = accent;
  x.lineWidth = 8;
  const ox = w - 380,
    oy = 70;
  if (key === "ui") {
    x.strokeRect(ox, oy, 300, 210);
    x.fillRect(ox, oy, 300, 36);
    x.globalAlpha = 0.5;
    x.fillRect(ox + 24, oy + 64, 120, 120);
    x.fillRect(ox + 164, oy + 64, 112, 20);
    x.fillRect(ox + 164, oy + 100, 80, 20);
  } else if (key === "api") {
    for (let i = 0; i < 3; i++) {
      const y = oy + 40 + i * 70;
      x.beginPath();
      x.moveTo(ox + 20, y);
      x.lineTo(ox + 260, y);
      x.lineTo(ox + 230, y - 24);
      x.moveTo(ox + 260, y);
      x.lineTo(ox + 230, y + 24);
      x.stroke();
    }
  } else if (key === "data") {
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 3; c++) {
        x.globalAlpha = r === 0 ? 1 : 0.45;
        x.fillRect(ox + 20 + c * 96, oy + 10 + r * 52, 84, 40);
      }
  } else {
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        x.strokeRect(ox + 20 + c * 96, oy + 30 + r * 100, 80, 80);
        x.globalAlpha = 0.35;
        x.fillRect(ox + 20 + c * 96, oy + 30 + r * 100, 80, 80);
        x.globalAlpha = 1;
      }
  }
  x.globalAlpha = 1;
}

function glow(size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.3, "rgba(255,255,255,.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  sp.scale.setScalar(size);
  return sp;
}

export default function StackScene({ mode, active }: { mode: "explode" | "trace"; active: LayerKey | null }) {
  const { cond, isDay } = useWeather();
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const host = useScene(({ el, scene, camera, pointer, reduce }) => {
    scene.add(new THREE.HemisphereLight(0xffffff, 0x333333, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(4, 8, 5);
    scene.add(sun);

    const stack = new THREE.Group();
    scene.add(stack);
    const slabGeo = new RoundedBoxGeometry(W, T, D, 3, 0.07);
    const edgeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(W - 0.04, T, D - 0.04));

    const layers = LAYERS.map((L, i) => {
      const g = new THREE.Group();
      const mat = new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0.15, transparent: true });
      const slab = new THREE.Mesh(slabGeo, mat);
      const edge = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ transparent: true }));
      const cv = document.createElement("canvas");
      cv.width = 1024;
      cv.height = 704;
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 8;
      const face = new THREE.Mesh(
        new THREE.PlaneGeometry(W - 0.12, D - 0.12),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
      );
      face.rotation.x = -Math.PI / 2;
      face.position.y = T / 2 + 0.002;
      g.add(slab, edge, face);
      stack.add(g);
      return { ...L, i, g, mat, edge, cv, tex, heat: 0, lift: 0 };
    });

    // trace packets: requests fall from the UI to the data layer, responses climb back
    const packets = Array.from({ length: 5 }, (_, k) => {
      const sp = glow(0.5);
      const core = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), new THREE.MeshBasicMaterial());
      const p = new THREE.Group();
      p.add(sp, core);
      p.userData = { phase: k / 5, x: -0.9 + (k % 3) * 0.9, z: -0.5 + (k % 2) * 0.8 };
      p.visible = mode === "trace";
      stack.add(p);
      return { p, sp, core };
    });

    let accent = new THREE.Color(),
      accent2 = new THREE.Color();
    const retheme = () => {
      const bg = cssColor("--color-bg"),
        text = cssColor("--color-text");
      accent = cssColor("--color-accent");
      accent2 = cssColor("--color-accent-2");
      const css = (c: THREE.Color) => `#${c.getHexString()}`;
      layers.forEach((L) => {
        // the interface layer wears the accent; the deeper layers sink toward the background
        const base = bg.clone().lerp(text, 0.1 + L.i * 0.05);
        L.mat.color.copy(L.key === "ui" ? base.lerp(accent, 0.35) : base);
        L.mat.emissive.copy(accent);
        (L.edge.material as THREE.LineBasicMaterial).color.copy(accent);
        drawFace(L.cv, L.key, L.label, L.sub, css(text), css(accent));
        L.tex.needsUpdate = true;
      });
      packets.forEach(({ sp, core }) => {
        sp.material.color.copy(accent);
        (core.material as THREE.MeshBasicMaterial).color.copy(accent.clone().lerp(new THREE.Color(0xffffff), 0.5));
      });
    };

    const yOf = (i: number, gap: number) => i * (T + gap);

    return {
      retheme,
      tick: (t, dt) => {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // 0 entering, 0.5 centred, 1 leaving
        const s = clamp01((vh - r.top) / (vh + r.height));
        const gap = mode === "trace" || reduce ? 0.62 : 0.05 + 0.85 * ease(clamp01(Math.sin(Math.PI * s) * 1.25));

        layers.forEach((L) => {
          const on = activeRef.current === L.key;
          L.lift += ((on ? 0.28 : 0) - L.lift) * 0.12;
          L.heat = Math.max(0, L.heat - dt * 2.2);
          L.g.position.y = yOf(L.i, gap) + L.lift;
          L.g.rotation.y = reduce ? 0 : Math.sin(t * 0.5 + L.i) * 0.02 * gap;
          const dim = activeRef.current && !on ? 0.55 : 1;
          L.mat.opacity += (dim - L.mat.opacity) * 0.1;
          L.mat.emissiveIntensity = (on ? 0.35 : 0) + L.heat * 0.5;
          (L.edge.material as THREE.LineBasicMaterial).opacity = 0.25 + (on ? 0.6 : 0) + L.heat * 0.6;
        });

        const top = yOf(3, gap) + T,
          bottom = yOf(1, gap);
        packets.forEach(({ p, sp }) => {
          if (!p.visible) return;
          const u = (t * 0.32 + p.userData.phase) % 1;
          // first half down (request), second half up (response)
          const k = u < 0.5 ? u * 2 : 2 - u * 2;
          const y = top + 0.4 - ease(k) * (top + 0.4 - bottom);
          p.position.set(p.userData.x, y, p.userData.z);
          sp.material.color.copy(u < 0.5 ? accent : accent2);
          layers.forEach((L) => {
            if (Math.abs(L.g.position.y + T / 2 - y) < 0.05) L.heat = 1;
          });
        });

        stack.position.y = -yOf(3, gap) / 2;
        stack.rotation.y = -0.62 + pointer.x * 0.28 + (reduce ? 0 : Math.sin(t * 0.25) * 0.06);
        stack.rotation.x = pointer.y * 0.06;
        camera.position.set(0, 6.2, 11.2);
        camera.lookAt(0, -0.1, 0);
      },
    };
  }, `${cond}-${isDay}`);

  return <div ref={host} style={{ width: "100%", height: "100%" }} aria-hidden />;
}
