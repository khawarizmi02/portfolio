// Low-poly 3D Kuala Lumpur skyline (Merdeka 118, Petronas Twin Towers, Menara KL, Sultan Abdul Samad) that wears the current weather.
// Colours come from the live palette tokens on :root, so it always matches the page.
// Loaded lazily so three.js stays out of the main bundle.
import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { Condition } from "./useKLWeather";
import { buildSouth } from "./southScene";

// hero      – the original framing beside the headline
// panorama  – wide, low strip for the footer, showing KLIA and Sepang instead of the city centre
// flyover   – the same strip, but the camera descends from an aerial view as you reach the bottom
// rooftop   – a figure on a rooftop in the foreground, looking out at the city (About). Drop a model at
//             public/me.glb and it replaces the placeholder figure.
export type SkylineView = "hero" | "panorama" | "flyover" | "rooftop";

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

function menaraKL(mat: THREE.Material, shaftMat: THREE.Material, podMat: THREE.Material, tipMat: THREE.Material) {
  const g = new THREE.Group();
  const hill = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat);
  hill.scale.y = 0.35;
  g.add(hill);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.17, 3.6, 10), shaftMat);
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

// Merdeka 118: a slim glass shaft of three stacked segments. Alternate rings are rotated half a step and
// pushed in or out, so every segment is a band of big triangular facets (the songket diamonds) and the
// silhouette kinks slightly where they meet. The roof is cut on a slant and the spire rises off its high edge.
function merdeka118(glassMat: THREE.Material, tipMat: THREE.Material) {
  const g = new THREE.Group();
  const S = 6,
    H = 6.2;
  // [height fraction, radius, sideways drift]
  const rings = [
    [0, 0.6, 0],
    [0.34, 0.64, -0.03],
    [0.64, 0.56, 0.03],
    [0.88, 0.58, -0.02],
  ];
  const SLANT = 0.55; // how much higher the roof is at its -x edge
  const ring = (k: number) => {
    const [t, r, dx] = rings[k];
    return Array.from({ length: S }, (_, i) => {
      const a = ((i + (k % 2) * 0.5) / S) * Math.PI * 2 + Math.PI;
      const x = Math.cos(a) * r,
        z = Math.sin(a) * r * 0.85;
      // the top ring follows the slanted roof
      const y = k === rings.length - 1 ? t * H + ((-x / r + 1) / 2) * SLANT : t * H;
      return new THREE.Vector3(x + dx, y, z);
    });
  };
  const pos: number[] = [];
  const push = (...vs: THREE.Vector3[]) => vs.forEach((v) => pos.push(v.x, v.y, v.z));
  for (let k = 0; k < rings.length - 1; k++) {
    const A = ring(k),
      B = ring(k + 1);
    for (let i = 0; i < S; i++) {
      const a0 = A[i],
        a1 = A[(i + 1) % S],
        b0 = B[i],
        b1 = B[(i + 1) % S];
      // even rings sit half a step behind the next: pick the diagonal that follows the shift
      if (k % 2 === 0) push(a0, b0, a1, a1, b0, b1);
      else push(a0, b0, b1, a0, b1, a1);
    }
  }
  // slanted roof: fan from the centre of the top ring
  const top = ring(rings.length - 1);
  const c = top.reduce((m, v) => m.add(v), new THREE.Vector3()).divideScalar(S);
  for (let i = 0; i < S; i++) push(c, top[(i + 1) % S], top[i]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const body = new THREE.Mesh(geo, glassMat);
  (body.material as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
  g.add(body);
  // spire: a thin faceted needle continuing the high edge of the roof
  const high = top.reduce((m, v) => (v.y > m.y ? v : m));
  const base = high.clone().lerp(c, 0.35);
  const SPIRE = 1.9;
  const spire = new THREE.Mesh(new THREE.ConeGeometry(0.06, SPIRE, 4), tipMat);
  spire.position.set(base.x, base.y + SPIRE / 2 - 0.05, base.z);
  g.add(spire);
  g.userData.tip = new THREE.Vector3(base.x, base.y + SPIRE, base.z);
  g.userData.crown = base;
  return g;
}

// Sultan Abdul Samad Building on Dataran Merdeka: a long arcaded block under a red tile roof, the clock
// tower in the middle and an onion-domed tower at each end. Not to scale; it sits in the foreground.
function archTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const x = c.getContext("2d")!;
  x.fillStyle = "#fff";
  x.fillRect(0, 0, 256, 64);
  x.fillStyle = "#3a3a3a";
  // two storeys of horseshoe arches
  for (const [y0, h] of [
    [8, 20],
    [38, 22],
  ])
    for (let i = 0; i < 16; i++) {
      const cx = 8 + i * 16;
      x.beginPath();
      x.moveTo(cx - 5, y0 + h);
      x.lineTo(cx - 5, y0 + 5);
      x.arc(cx, y0 + 5, 5, Math.PI, 0);
      x.lineTo(cx + 5, y0 + h);
      x.fill();
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function onionDome(r: number, mat: THREE.Material, tipMat: THREE.Material) {
  const g = new THREE.Group();
  const profile = [
    [r * 0.95, 0],
    [r * 1.05, r * 0.25],
    [r * 0.95, r * 0.6],
    [r * 0.6, r * 0.95],
    [r * 0.2, r * 1.2],
    [0.001, r * 1.3],
  ].map(([px, py]) => new THREE.Vector2(px, py));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 10), mat));
  const finial = new THREE.Mesh(new THREE.ConeGeometry(r * 0.12, r * 0.8, 5), tipMat);
  finial.position.y = r * 1.6;
  g.add(finial);
  return g;
}

function sultanAbdulSamad(
  wallMat: THREE.Material,
  facadeMat: THREE.Material,
  roofMat: THREE.Material,
  domeMat: THREE.Material,
  tipMat: THREE.Material,
) {
  const g = new THREE.Group();
  const L = 3.6,
    D = 0.7,
    WH = 0.6;
  // facade texture on the front face only (+z is index 4 of a box's material array)
  const block = new THREE.Mesh(new THREE.BoxGeometry(L, WH, D), [
    wallMat,
    wallMat,
    wallMat,
    wallMat,
    facadeMat,
    wallMat,
  ]);
  block.position.y = WH / 2;
  // hipped tile roof: a box tapered in towards the ridge
  const roofGeo = new THREE.CylinderGeometry(Math.SQRT1_2, 1, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.scale.set((L * 0.98) / Math.SQRT2, 0.16, (D * 0.95) / Math.SQRT2);
  roof.position.y = WH + 0.08;
  g.add(block, roof);

  // clock tower: square shaft, belfry, clock drum, dome
  const tower = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.35, 0.4), wallMat);
  shaft.position.y = 0.675;
  const belfry = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.32, 0.34), facadeMat);
  belfry.position.y = 1.51;
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.09, 12), tipMat);
  clock.position.set(0, 1.12, 0.201);
  const dome = onionDome(0.19, domeMat, tipMat);
  dome.position.y = 1.67;
  tower.add(shaft, belfry, clock, dome);
  tower.position.z = D / 2 - 0.12;
  g.add(tower);

  // end towers
  for (const s of [-1, 1]) {
    const t = new THREE.Group();
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.24, 0.95, 8), wallMat);
    drum.position.y = 0.475;
    const d = onionDome(0.22, domeMat, tipMat);
    d.position.y = 0.95;
    t.add(drum, d);
    t.position.set(s * (L / 2 - 0.1), 0, D / 2 - 0.15);
    g.add(t);
  }
  g.userData.tip = new THREE.Vector3(0, 2.15, tower.position.z);
  return g;
}

// Placeholder low-poly person, ~1 unit tall, facing -z (toward the city).
function figure(mat: THREE.Material, accentMat: THREE.Material) {
  const g = new THREE.Group();
  const leg = new THREE.CylinderGeometry(0.05, 0.045, 0.46, 6);
  [-0.07, 0.07].forEach((x) => {
    const l = new THREE.Mesh(leg, mat);
    l.position.set(x, 0.23, 0);
    g.add(l);
  });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.12, 0.36, 7), accentMat);
  torso.position.y = 0.64;
  const arm = new THREE.CylinderGeometry(0.035, 0.03, 0.36, 5);
  [-1, 1].forEach((s) => {
    const a = new THREE.Mesh(arm, accentMat);
    a.position.set(s * 0.19, 0.62, 0);
    a.rotation.z = s * 0.12;
    g.add(a);
  });
  const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11, 1), mat);
  head.position.y = 0.94;
  g.add(torso, head);
  return g;
}

function glowSprite(color: THREE.Color, size: number) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const grad = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = grad;
  x.fillRect(0, 0, 64, 64);
  const mat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(c),
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const sp = new THREE.Sprite(mat);
  sp.scale.setScalar(size);
  return sp;
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
      return { hemi: night ? 0.5 : 0.5, sun: night ? 0.2 : 0.35, sunColor: "#ffcf8a", sunPos: [5, 6, 5], fog: 0.05, windows: night ? 0.8 : 0, clouds: "none", rain: 0 };
  }
}

export default function Skyline({ cond, isDay, view = "hero" }: { cond: Condition; isDay: boolean; view?: SkylineView }) {
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
    const klShaftMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.6 });
    const klPodMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.4, metalness: 0.3 });
    const menara = menaraKL(bodyMat, klShaftMat, klPodMat, tipMat);
    menara.position.set(3.6, 0, -2.2);
    const glassMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.25, metalness: 0.55 });
    const merdeka = merdeka118(glassMat, tipMat);
    merdeka.position.set(-3.3, 0, -5);
    const sasWallMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 });
    const arches = archTexture();
    arches.repeat.x = 2;
    const sasFacadeMat = new THREE.MeshStandardMaterial({
      flatShading: true,
      roughness: 0.9,
      map: arches,
      emissive: 0xffffff,
      emissiveMap: arches,
      emissiveIntensity: 0,
    });
    const sasRoofMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.8 });
    const sasDomeMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.45, metalness: 0.5 });
    const sas = sultanAbdulSamad(sasWallMat, sasFacadeMat, sasRoofMat, sasDomeMat, tipMat);
    sas.position.set(-0.6, 0, 2.9);
    sas.rotation.y = 0.12;
    // the footer views trade the city centre for KLIA and Sepang
    const south = view === "panorama" || view === "flyover" ? buildSouth(glowSprite) : null;
    if (south) scene.add(south.group);
    else scene.add(klcc, menara, merdeka, sas);

    // night glows at the crowns
    const glows = [
      glowSprite(new THREE.Color("#e6eeff"), 1.6),
      glowSprite(new THREE.Color("#e6eeff"), 1.6),
      glowSprite(new THREE.Color("#b9c6ff"), 1.5),
      glowSprite(new THREE.Color("#cfe2ff"), 1.4),
      glowSprite(new THREE.Color("#ffd9a0"), 1.2),
    ];
    glows[0].position.set(-0.85, 4.9, 0.1);
    glows[1].position.set(0.85, 4.9, 0.1);
    glows[2].position.set(3.6, 4.15, -2.1);
    merdeka.updateMatrixWorld();
    sas.updateMatrixWorld();
    glows[3].position.copy(merdeka.localToWorld(merdeka.userData.crown.clone()));
    glows[4].position.copy(sas.localToWorld(new THREE.Vector3(0, 1.9, 0.3)));
    if (south) glows.splice(0, glows.length, ...south.glows);
    // dev only: sliders for the hand-placed pieces of the footer scene (lil-gui loads on demand)
    let gui: { destroy(): void } | null = null;
    let disposed = false;
    if (south && import.meta.env.DEV)
      import("lil-gui").then(({ default: GUI }) => {
        if (disposed) return;
        const g = new GUI({ title: "Tweak footer scene" });
        g.domElement.style.top = "64px"; // below the sticky nav
        south.addTweaks(g);
        g.close();
        gui = g;
      });
    // landmarks and vehicles in the footer scene carry their own lights
    const loose = glows.filter((g) => !g.parent);
    if (loose.length) scene.add(...loose);

    // filler city, deterministic-ish so it doesn't reshuffle on every mount
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const box = new THREE.BoxGeometry(1, 1, 1);
    for (let i = 0; i < (south ? 0 : 70); i++) {
      const x = (rnd() - 0.5) * 14,
        z = -5 + rnd() * 7.5;
      if (Math.abs(x) < 1.7 && z > -1.5) continue; // keep KLCC clear
      if (Math.hypot(x + 3.3, z + 5) < 1.1) continue; // and Merdeka 118
      if (Math.hypot(x - 3.6, z + 2.2) < 1.3) continue; // and the hill
      if (Math.abs(x + 0.6) < 2.6 && z > 1.6) continue; // and Dataran Merdeka
      const h = 0.3 + rnd() ** 2 * 2.4;
      const b = new THREE.Mesh(box, fillerMat);
      b.scale.set(0.3 + rnd() * 0.6, h, 0.3 + rnd() * 0.6);
      b.position.set(x, h / 2, z);
      scene.add(b);
    }
    const ground = new THREE.Mesh(new THREE.CircleGeometry(80, 64), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    // rooftop view: a building in the foreground with someone standing on it
    const roofMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.9 });
    const personMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.7 });
    const shirtMat = new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.7 });
    if (view === "rooftop") {
      const roof = new THREE.Group();
      const block = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.4, 2.2), roofMat);
      block.position.y = 1.2;
      const ledge = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.12, 0.12), roofMat);
      ledge.position.set(0, 2.46, -1.05);
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 8), roofMat);
      tank.position.set(0.8, 2.6, 0.5);
      const person = figure(personMat, shirtMat);
      person.position.set(-0.25, 2.4, -0.55);
      person.rotation.y = 0.5;
      person.scale.setScalar(0.85);
      roof.add(block, ledge, tank, person);
      roof.position.set(2.3, 0, 7.2);
      scene.add(roof);
      // the loader is only fetched for this view; without a model the placeholder stays
      import("three/examples/jsm/loaders/GLTFLoader.js").then(({ GLTFLoader }) =>
        new GLTFLoader().load(
          "/me.glb",
          (gltf) => {
            const me = gltf.scene;
            const size = new THREE.Box3().setFromObject(me).getSize(new THREE.Vector3());
            me.scale.setScalar(0.85 / Math.max(size.y, 0.001));
            me.position.copy(person.position);
            me.rotation.y = person.rotation.y;
            roof.remove(person);
            roof.add(me);
          },
          undefined,
          () => {},
        ),
      );
    }

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
      const r = rnd();
      const target = south ? south.targets[r < 0.6 ? 0 : 1] : r < 0.4 ? merdeka : r < 0.65 ? twinR : r < 0.9 ? menara : sas;
      const tip = target.localToWorld(target.userData.tip.clone());
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
      // the footer scene is seen from further away, so it gets thinner fog to stay legible
      (scene.fog as THREE.FogExp2).density = state.fog * (south ? 0.45 : 1);
      hemi.color.copy(bg.clone().lerp(new THREE.Color(0xffffff), 0.6));
      hemi.groundColor.copy(bg);
      hemi.intensity = state.hemi;
      sun.color.set(state.sunColor);
      sun.intensity = state.sun;
      sun.position.set(...state.sunPos);
      // haze needs more contrast so the outline survives the fog
      const k = c === "haze" ? 1.7 : 1;
      bodyMat.color.copy(bg.clone().lerp(text, 0.28 * k));
      steelMat.color.copy(bg.clone().lerp(text, Math.min(0.62 * k, 0.8)));
      glassMat.color.copy(bg.clone().lerp(text, 0.5 * k).lerp(new THREE.Color("#8fb4d8"), 0.25));
      klShaftMat.color.copy(bg.clone().lerp(text, 0.32 * k));
      klPodMat.color.copy(bg.clone().lerp(text, 0.5 * k));
      fillerMat.color.copy(bg.clone().lerp(text, 0.18 * k));
      fillerMat.emissiveIntensity = state.windows * 1.4;
      fillerMat.emissive.copy(accent.clone().lerp(new THREE.Color("#ffd9a0"), 0.6));
      tipMat.color.copy(accent);
      tipMat.emissive.copy(accent);
      tipMat.emissiveIntensity = day ? 0.15 : 1.2;
      // Petronas glows silver at night
      // night: Petronas glows silver, Menara KL's pod lights up, Merdeka's glass catches a cool glow
      steelMat.emissive.set("#dfe7ff");
      steelMat.emissiveIntensity = day ? 0 : 0.55;
      klShaftMat.emissive.set("#cdd6ff");
      klShaftMat.emissiveIntensity = day ? 0 : 0.25;
      klPodMat.emissive.copy(accent.clone().lerp(new THREE.Color("#b8c4ff"), 0.55));
      klPodMat.emissiveIntensity = day ? 0 : 1.1;
      glassMat.emissive.set("#a9c8f0");
      glassMat.emissiveIntensity = day ? 0 : 0.3;
      // Sultan Abdul Samad: brick and cream walls, red tiles, copper domes; floodlit warm at night
      sasWallMat.color.copy(bg.clone().lerp(text, 0.3 * k).lerp(new THREE.Color("#c98b5f"), 0.35));
      sasFacadeMat.color.copy(bg.clone().lerp(text, 0.4 * k).lerp(new THREE.Color("#e2c9a6"), 0.4));
      sasRoofMat.color.copy(bg.clone().lerp(text, 0.25 * k).lerp(new THREE.Color("#a8432e"), 0.5));
      sasDomeMat.color.copy(bg.clone().lerp(text, 0.3 * k).lerp(new THREE.Color("#b5653c"), 0.6));
      sasFacadeMat.emissive.set("#ffcf8f");
      sasFacadeMat.emissiveIntensity = day ? 0 : 0.35;
      sasWallMat.emissive.set("#ffb874");
      sasWallMat.emissiveIntensity = day ? 0 : 0.2;
      sasDomeMat.emissive.set("#ff9a5a");
      sasDomeMat.emissiveIntensity = day ? 0 : 0.35;
      glows.forEach((g) => (g.visible = !day));
      south?.retheme(bg, text, accent, day, k);
      groundMat.color.copy(bg.clone().lerp(text, 0.08));
      roofMat.color.copy(bg.clone().lerp(text, 0.22 * k));
      personMat.color.copy(bg.clone().lerp(text, 0.75));
      shirtMat.color.copy(accent);
      shirtMat.emissive.copy(accent);
      shirtMat.emissiveIntensity = day ? 0 : 0.35;
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
      if (view === "hero") {
        camera.position.set(camX, 3 + camY, 16);
        camera.lookAt(0.4, 3.5, -1);
      } else if (view === "rooftop") {
        camera.position.set(4.2 + camX * 0.5, 4 + camY * 0.4, 11.8);
        camera.lookAt(-1.6, 3.4, -1);
      } else {
        // wide strips: keep ~24 units of KLIA + Sepang across whatever the aspect is
        const fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(12 / (18 * camera.aspect))), 18, 44);
        if (Math.abs(camera.fov - fov) > 0.1) {
          camera.fov = fov;
          camera.updateProjectionMatrix();
        }
        // flyover: aerial while the footer enters, street level once you reach the bottom of the page
        const r = el.getBoundingClientRect();
        const f = view === "flyover" && !reduce ? 1 - Math.min(1, Math.max(0, (window.innerHeight - r.top) / r.height)) : 0;
        const k = f * f * (3 - 2 * f);
        // raised three-quarter view: high enough to read the circuit and the terminal roof
        camera.position.set(camX * 1.2, THREE.MathUtils.lerp(8.5, 17, k) + camY * 0.4, THREE.MathUtils.lerp(15, 9, k));
        camera.lookAt(0, 0, THREE.MathUtils.lerp(-1.6, -2, k));
      }

      south?.animate(reduce ? 4 : t);
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
      disposed = true;
      gui?.destroy();
      renderer.dispose();
      el.removeChild(renderer.domElement);
    };
  }, [view]);

  useEffect(() => {
    applyRef.current(cond, isDay);
  }, [cond, isDay]);

  return <div ref={host} style={{ width: "100%", height: "100%" }} aria-hidden />;
}
