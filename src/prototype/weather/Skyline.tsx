// PROTOTYPE (throwaway): low-poly 3D Kuala Lumpur skyline (Petronas Twin Towers + Menara KL) that wears the
// current weather. Colours come from the live palette tokens on :root, so it always matches the page.
// Loaded lazily so three.js stays out of the main bundle.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Condition } from "./useKLWeather";

/* ── palette bridge: CSS oklch() tokens → THREE.Color via a 1×1 canvas ── */
const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
function cssColor(varName: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || "#888";
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = v;
  probe.fillRect(0, 0, 1, 1);
  const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
  return new THREE.Color(r / 255, g / 255, b / 255);
}

/* ── geometry ── */
// Petronas floor plan: two overlaid squares → 8-point star, extruded into one tier.
function starTier(r: number, h: number) {
  const shape = new THREE.Shape();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const rr = i % 2 === 0 ? r : r * 0.8;
    const x = Math.cos(a) * rr,
      y = Math.sin(a) * rr;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  return g;
}

function petronasTower(mat: THREE.Material, tipMat: THREE.Material) {
  const tower = new THREE.Group();
  const tiers = [
    [0.55, 1.6],
    [0.5, 0.9],
    [0.45, 0.6],
    [0.4, 0.45],
    [0.34, 0.35],
    [0.27, 0.3],
    [0.2, 0.25],
    [0.13, 0.25],
  ];
  let y = 0;
  for (const [r, h] of tiers) {
    const m = new THREE.Mesh(starTier(r, h), mat);
    m.position.y = y;
    tower.add(m);
    y += h;
  }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.045, 1.2, 6), tipMat);
  spire.position.y = y + 0.6;
  tower.add(spire);
  tower.userData.tip = new THREE.Vector3(0, y + 1.2, 0);
  return tower;
}

function menaraKL(mat: THREE.Material, podMat: THREE.Material, tipMat: THREE.Material) {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  hill.scale.y = 0.35;
  g.add(hill);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 3.6, 10), mat);
  shaft.position.y = 0.4 + 1.8;
  g.add(shaft);
  const profile = [
    [0.1, 0],
    [0.28, 0.08],
    [0.42, 0.25],
    [0.44, 0.38],
    [0.34, 0.5],
    [0.16, 0.6],
    [0.1, 0.62],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const pod = new THREE.Mesh(new THREE.LatheGeometry(profile, 14), podMat);
  pod.position.y = 3.85;
  g.add(pod);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.035, 1.5, 5), tipMat);
  mast.position.y = 4.47 + 0.75;
  g.add(mast);
  g.userData.tip = new THREE.Vector3(0, 5.97, 0);
  return g;
}

function windowTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, 64, 128);
  for (let row = 0; row < 16; row++)
    for (let col = 0; col < 6; col++) {
      if (Math.random() < 0.45) continue;
      x.fillStyle = `rgba(255,${200 + Math.random() * 40},${130 + Math.random() * 60},${0.6 + Math.random() * 0.4})`;
      x.fillRect(4 + col * 10, 4 + row * 8, 5, 4);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── per-weather lighting recipe ── */
type Recipe = {
  hemi: number;
  sun: number;
  sunColor: string;
  sunPos: [number, number, number];
  fog: number;
  windows: number;
  clouds: "none" | "light" | "dark" | "storm";
  rain: number;
};
function recipe(cond: Condition, isDay: boolean): Recipe {
  const night = !isDay;
  switch (cond) {
    case "clear":
      return isDay
        ? { hemi: 1.1, sun: 2.4, sunColor: "#ffd49a", sunPos: [6, 9, 5], fog: 0.035, windows: 0, clouds: "none", rain: 0 }
        : { hemi: 0.45, sun: 0.7, sunColor: "#b9c8ff", sunPos: [-5, 8, 4], fog: 0.03, windows: 1, clouds: "none", rain: 0 };
    case "cloudy":
      return { hemi: night ? 0.45 : 1.0, sun: night ? 0.2 : 0.5, sunColor: "#dfe6ef", sunPos: [3, 9, 6], fog: 0.05, windows: night ? 1 : 0.15, clouds: "light", rain: 0 };
    case "rain":
      return { hemi: night ? 0.4 : 0.7, sun: 0.2, sunColor: "#cfe8e8", sunPos: [2, 9, 6], fog: 0.06, windows: night ? 1 : 0.4, clouds: "dark", rain: 500 };
    case "storm":
      return { hemi: night ? 0.3 : 0.45, sun: 0.12, sunColor: "#c9c0ff", sunPos: [2, 9, 6], fog: 0.06, windows: night ? 1 : 0.55, clouds: "storm", rain: 900 };
    case "haze":
      return { hemi: night ? 0.5 : 0.95, sun: night ? 0.2 : 0.6, sunColor: "#ffcf8a", sunPos: [5, 6, 5], fog: 0.1, windows: night ? 0.8 : 0, clouds: "none", rain: 0 };
  }
}

export default function Skyline({ cond, isDay }: { cond: Condition; isDay: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const applyRef = useRef<(c: Condition, d: boolean) => void>(() => {});

  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.04);
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

    const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
    const sun = new THREE.DirectionalLight(0xffffff, 1);
    const flash = new THREE.PointLight(0xe8e6ff, 0, 30, 1.2);
    flash.position.set(0, 9, 2);
    scene.add(hemi, sun, flash);

    const bodyMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85 });
    const steelMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.35, metalness: 0.6 });
    const tipMat = new THREE.MeshStandardMaterial({ flatShading: true, emissiveIntensity: 0 });
    const winTex = windowTexture();
    const fillerMat = new THREE.MeshStandardMaterial({
      flatShading: true,
      roughness: 0.9,
      emissive: 0xffffff,
      emissiveMap: winTex,
      emissiveIntensity: 0,
    });
    const groundMat = new THREE.MeshStandardMaterial({ roughness: 1 });

    // landmarks
    const twinL = petronasTower(steelMat, tipMat);
    const twinR = petronasTower(steelMat, tipMat);
    twinL.position.x = -0.85;
    twinR.position.x = 0.85;
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.18), steelMat);
    bridge.position.y = 2.25;
    const legs = [-1, 1].map((s) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4), steelMat);
      leg.position.set(s * 0.32, 1.85, 0);
      leg.rotation.z = s * 0.75;
      return leg;
    });
    const klcc = new THREE.Group();
    klcc.add(twinL, twinR, bridge, ...legs);
    const menara = menaraKL(bodyMat, steelMat, tipMat);
    menara.position.set(3.6, 0, -2.2);
    scene.add(klcc, menara);

    // filler city, deterministic-ish so it doesn't reshuffle on every mount
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < 70; i++) {
      const x = (rnd() - 0.5) * 14,
        z = -5 + rnd() * 7.5;
      if (Math.abs(x) < 1.7 && z > -1.5) continue; // keep KLCC clear
      if (Math.hypot(x - 3.6, z + 2.2) < 1.3) continue; // and the hill
      const h = 0.3 + rnd() ** 2 * 2.4;
      const b = new THREE.Mesh(box, fillerMat);
      b.scale.set(0.3 + rnd() * 0.6, h, 0.3 + rnd() * 0.6);
      b.position.set(x, h / 2, z);
      scene.add(b);
    }
    const ground = new THREE.Mesh(new THREE.CircleGeometry(16, 32), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // clouds: clusters of squashed icosahedrons
    const cloudMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1, transparent: true, opacity: 0.92 });
    const clouds = new THREE.Group();
    const ico = new THREE.IcosahedronGeometry(1, 0);
    for (let i = 0; i < 7; i++) {
      const cl = new THREE.Group();
      for (let j = 0; j < 5; j++) {
        const p = new THREE.Mesh(ico, cloudMat);
        const s = 0.5 + rnd() * 0.6;
        p.scale.set(s * 1.4, s * 0.6, s);
        p.position.set((rnd() - 0.5) * 2.2, rnd() * 0.3, (rnd() - 0.5) * 0.8);
        cl.add(p);
      }
      cl.position.set(-8 + i * 2.6, 5.4 + rnd() * 1.2, -2.5 + rnd() * 2.5);
      cl.userData.speed = 0.15 + rnd() * 0.2;
      clouds.add(cl);
    }
    scene.add(clouds);

    // rain inside the scene
    const MAX_DROPS = 900;
    const rainPos = new Float32Array(MAX_DROPS * 6);
    for (let i = 0; i < MAX_DROPS; i++) {
      const x = (rnd() - 0.5) * 14,
        y = rnd() * 9,
        z = (rnd() - 0.5) * 8;
      rainPos.set([x, y, z, x - 0.05, y - 0.35, z], i * 6);
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
    const rainMat = new THREE.LineBasicMaterial({ transparent: true, opacity: 0.35 });
    const rain = new THREE.LineSegments(rainGeo, rainMat);
    scene.add(rain);

    // lightning bolt: jagged line from the clouds to a landmark tip
    const boltMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
    const bolt = new THREE.Line(new THREE.BufferGeometry(), boltMat);
    scene.add(bolt);
    let boltUntil = 0;
    const strike = () => {
      const target = rnd() < 0.5 ? twinR : menara;
      const tip = target.userData.tip.clone().add(target.position);
      const pts: THREE.Vector3[] = [];
      for (let k = 0, y = 9.5; y > tip.y; k++, y -= 0.45 + rnd() * 0.35)
        pts.push(new THREE.Vector3(tip.x + (k === 0 ? 0 : (rnd() - 0.5) * 0.8), y, tip.z));
      pts.push(tip);
      bolt.geometry.dispose();
      bolt.geometry = new THREE.BufferGeometry().setFromPoints(pts);
      flash.position.set(tip.x, tip.y + 1.5, tip.z + 1);
      boltUntil = performance.now() + 260;
    };
    window.addEventListener("wx:strike", strike);

    let state = recipe("cloudy", true);
    let mode: Condition = "cloudy";
    const apply = (c: Condition, day: boolean) => {
      mode = c;
      state = recipe(c, day);
      const bg = cssColor("--color-bg"),
        text = cssColor("--color-text"),
        accent = cssColor("--color-accent");
      (scene.fog as THREE.FogExp2).color.copy(c === "haze" ? bg.clone().lerp(new THREE.Color("#9c7a48"), 0.12) : bg);
      (scene.fog as THREE.FogExp2).density = state.fog;
      hemi.color.copy(bg.clone().lerp(new THREE.Color(0xffffff), 0.6));
      hemi.groundColor.copy(bg);
      hemi.intensity = state.hemi;
      sun.color.set(state.sunColor);
      sun.intensity = state.sun;
      sun.position.set(...state.sunPos);
      bodyMat.color.copy(bg.clone().lerp(text, 0.28));
      steelMat.color.copy(bg.clone().lerp(text, 0.62));
      fillerMat.color.copy(bg.clone().lerp(text, 0.18));
      fillerMat.emissiveIntensity = state.windows * 1.4;
      fillerMat.emissive.copy(accent.clone().lerp(new THREE.Color("#ffd9a0"), 0.6));
      tipMat.color.copy(accent);
      tipMat.emissive.copy(accent);
      tipMat.emissiveIntensity = day ? 0.15 : 1.2;
      // Petronas glows silver at night
      steelMat.emissive.copy(text.clone().lerp(new THREE.Color("#dfe8ff"), 0.5));
      steelMat.emissiveIntensity = day ? 0 : 0.22;
      groundMat.color.copy(bg.clone().lerp(text, 0.08));
      cloudMat.color.copy(
        bg.clone().lerp(text, state.clouds === "light" ? 0.55 : state.clouds === "dark" ? 0.32 : 0.22),
      );
      clouds.visible = state.clouds !== "none";
      rainMat.color.copy(text);
      rainGeo.setDrawRange(0, state.rain * 2);
      rain.visible = state.rain > 0;
    };
    applyRef.current = apply;

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    let mx = 0,
      my = 0;
    const onMove = (e: PointerEvent) => {
      mx = (e.clientX / window.innerWidth - 0.5) * 2;
      my = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onMove);

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let raf = 0,
      last = performance.now(),
      camX = 0,
      camY = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      camX += ((reduce ? 0 : Math.sin(t * 0.08) * 1.4) + mx * 1.1 - camX) * 0.04;
      camY += (my * -0.5 - camY) * 0.04;
      camera.position.set(camX, 2.6 + camY, 15);
      camera.lookAt(0.9, 2.6, -0.5);

      if (clouds.visible)
        clouds.children.forEach((cl) => {
          cl.position.x += cl.userData.speed * dt;
          if (cl.position.x > 9) cl.position.x = -9;
        });
      if (rain.visible && !reduce) {
        const fall = (mode === "storm" ? 11 : 7) * dt;
        for (let i = 0; i < state.rain; i++) {
          const o = i * 6;
          rainPos[o + 1] -= fall;
          rainPos[o + 4] -= fall;
          if (rainPos[o + 4] < 0) {
            rainPos[o + 1] += 9;
            rainPos[o + 4] += 9;
          }
        }
        rainGeo.attributes.position.needsUpdate = true;
      }
      const striking = now < boltUntil;
      boltMat.opacity = striking ? 1 : 0;
      flash.intensity = striking ? 60 * (0.5 + 0.5 * Math.sin(now / 15)) : 0;
      renderer.render(scene, camera);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("wx:strike", strike);
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    applyRef.current(cond, isDay);
  }, [cond, isDay]);

  return <div ref={host} style={{ width: "100%", height: "100%", minHeight: 380 }} aria-hidden />;
}
