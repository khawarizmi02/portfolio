// Low-poly KLIA and Sepang for the footer, seen from a raised three-quarter view.
//   KLIA   – control tower, the terminal's hypar "forest" roof, contact pier with parked jets, and a runway with
//            a plane taking off every 16 s
//   Sepang – the real circuit layout (traced from bacinger/f1-circuits, MIT), the twin straights with the
//            leaf-canopy grandstand between them, and a car lapping it
// Oil palms fill the gaps. Weather, fog and lighting come from Skyline.
import * as THREE from "three";
import type GUI from "lil-gui";

const flat = (o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85, ...o });

// Sepang International Circuit centreline in metres (x east, z south), starting on the main straight heading for T1.
// prettier-ignore
const SEPANG = [
  -147,24, -447,49, -461,47, -474,41, -482,32, -487,20, -487,6, -482,-8, -471,-19, -455,-24, -436,-20, -402,-8,
  -391,-10, -381,-19, -378,-31, -381,-46, -391,-62, -415,-90, -424,-107, -431,-128, -434,-149, -434,-172, -428,-230,
  -419,-257, -405,-285, -390,-302, -368,-322, -345,-338, -320,-347, -183,-391, -80,-431, -11,-461, 33,-481, 48,-487,
  60,-487, 70,-481, 73,-468, 92,-362, 104,-308, 121,-241, 133,-216, 146,-198, 169,-179, 192,-167, 215,-161, 237,-160,
  263,-164, 289,-174, 307,-188, 343,-226, 361,-236, 389,-246, 412,-247, 436,-244, 455,-236, 472,-223, 673,6, 674,17,
  670,30, 635,107, 625,114, 613,117, 429,127, 256,147, 161,163, 152,170, 149,182, 157,196, 224,233, 239,248, 250,270,
  255,292, 254,325, 250,352, 243,379, 227,413, 203,448, 190,456, 177,458, 163,455, 152,448, -60,275, -75,270, -94,269,
  -114,274, -192,313, -212,319, -237,323, -258,322, -298,315, -325,304, -343,290, -367,259, -375,236, -376,222,
  -366,206, -345,197, 493,44, 505,34, 514,13, 510,-3, 494,-19, 469,-23,
];
// Hand-placed pieces. In dev, the "Tweak footer scene" panel edits these live; its "Copy layout" button
// puts the current values on the clipboard, ready to paste over this object.
// prettier-ignore
export const LAYOUT = {
  grandstand: { x: 3.93, z: -0.98, rotation: 3.22, scale: 1, depth: 1 },
  tower: { x: -1.5, z: -2.4, scale: 0.52 },
  kliaLabel: { x: -5.6, y: 2.5, z: -3.2 },
  sepangLabel: { x: 5.83, y: 2.1, z: -4.9 },
};

const TRACK_SCALE = 0.0078;
const TRACK_AT = new THREE.Vector3(5.1, 0, -1.7);
const trackPoint = (x: number, z: number) => new THREE.Vector3(x * TRACK_SCALE, 0, z * TRACK_SCALE).add(TRACK_AT);

// KLIA tower: slender shaft that flares into a torch-like cab, then a mast.
function klTower(concrete: THREE.Material, glass: THREE.Material, tip: THREE.Material) {
  const g = new THREE.Group();
  const shaft = [
    [0.26, 0],
    [0.2, 1.2],
    [0.16, 4.4],
    [0.2, 4.7],
    [0.36, 4.95],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  g.add(new THREE.Mesh(new THREE.LatheGeometry(shaft, 10), concrete));
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.42, 10), glass);
  cab.position.y = 5.16;
  const crown = [
    [0.48, 0],
    [0.4, 0.12],
    [0.26, 0.3],
    [0.12, 0.42],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const top = new THREE.Mesh(new THREE.LatheGeometry(crown, 10), concrete);
  top.position.y = 5.37;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.04, 1.1, 5), tip);
  mast.position.y = 5.79 + 0.55;
  g.add(cab, top, mast);
  return g;
}

// One KLIA roof module: a square hyperbolic-paraboloid shell on a single column.
function hyparGeo(size: number, rise: number) {
  const g = new THREE.PlaneGeometry(size, size, 6, 6);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  const h = size / 2;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) / h,
      z = p.getZ(i) / h;
    p.setY(i, rise * (x * x - z * z));
  }
  g.computeVertexNormals();
  return g;
}

// Sepang grandstand canopy: a pointed leaf, cupped across and tilted up toward the track.
function leafGeo() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.95);
  s.quadraticCurveTo(0.62, 0, 0, 0.95);
  s.quadraticCurveTo(-0.62, 0, 0, -0.95);
  const g = new THREE.ShapeGeometry(s, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      y = p.getY(i);
    p.setXYZ(i, x, 0.9 * x * x + 0.22 * y, -y);
  }
  g.computeVertexNormals();
  return g;
}

// Flat rounded rectangle on the ground, x0..x1 by zMin..zMax, facing up.
function roundedRect(x0: number, zMin: number, x1: number, zMax: number, r: number) {
  // drawn in shape space where y = -z, so rotating -90° about x lays it flat with the face up
  const z0 = -zMax,
    z1 = -zMin;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, z0);
  s.lineTo(x1 - r, z0);
  s.quadraticCurveTo(x1, z0, x1, z0 + r);
  s.lineTo(x1, z1 - r);
  s.quadraticCurveTo(x1, z1, x1 - r, z1);
  s.lineTo(x0 + r, z1);
  s.quadraticCurveTo(x0, z1, x0, z1 - r);
  s.lineTo(x0, z0 + r);
  s.quadraticCurveTo(x0, z0, x0 + r, z0);
  const g = new THREE.ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  return g;
}

function palm(trunk: THREE.Material, leaf: THREE.Material, rnd: () => number) {
  const g = new THREE.Group();
  const h = 0.8 + rnd() * 0.6;
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, h, 5), trunk);
  t.position.y = h / 2;
  g.add(t);
  const frond = new THREE.ConeGeometry(0.07, 0.6, 3);
  frond.translate(0, 0.3, 0);
  for (let i = 0; i < 7; i++) {
    const f = new THREE.Mesh(frond, leaf);
    f.position.y = h;
    f.rotation.set(0, (i / 7) * Math.PI * 2 + rnd(), 1.1 + rnd() * 0.5, "YXZ");
    f.scale.set(1, 1, 0.35);
    g.add(f);
  }
  g.rotation.z = (rnd() - 0.5) * 0.15;
  return g;
}

// Flat strip that follows a curve, for the circuit and its edge lines.
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, n = 600) {
  const pos: number[] = [];
  const edge = (u: number) => {
    const p = curve.getPointAt(u % 1),
      t = curve.getTangentAt(u % 1);
    const s = new THREE.Vector3(-t.z, 0, t.x).multiplyScalar(width / 2);
    return [p.clone().add(s).setY(y), p.clone().sub(s).setY(y)];
  };
  for (let i = 0; i < n; i++) {
    const [a, b] = edge(i / n),
      [c, d] = edge((i + 1) / n);
    [a, c, b, b, c, d].forEach((v) => pos.push(v.x, v.y, v.z));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function plane(body: THREE.Material, accent: THREE.Material) {
  const g = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 1.1, 8), body);
  fus.rotation.z = Math.PI / 2;
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.2, 8), body);
  nose.rotation.z = -Math.PI / 2;
  nose.position.x = 0.65;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.015, 1.0), body);
  wing.position.x = 0.05;
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.36), body);
  tailWing.position.x = -0.48;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.012), accent);
  fin.position.set(-0.48, 0.12, 0);
  g.add(fus, nose, wing, tailWing, fin);
  return g;
}

function car(body: THREE.Material, dark: THREE.Material) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.04, 0.08), body);
  b.position.y = 0.035;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.035, 0.1), dark);
  wing.position.set(-0.09, 0.07, 0);
  g.add(b, wing);
  return g;
}

// Place name floating over each landmark, redrawn in the current text colour.
function label(text: string) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, fog: false }));
  sp.scale.set(2.8, 0.7, 1);
  sp.renderOrder = 10;
  const draw = (ink: string, line: string) => {
    const x = c.getContext("2d")!;
    x.clearRect(0, 0, 512, 128);
    x.font = "600 54px 'DM Sans', system-ui, sans-serif";
    x.textAlign = "center";
    x.letterSpacing = "10px";
    x.fillStyle = ink;
    x.fillText(text, 256, 72);
    x.fillStyle = line;
    x.fillRect(244, 96, 24, 4);
    tex.needsUpdate = true;
  };
  return { sp, draw };
}

export function buildSouth(glow: (c: THREE.Color, size: number) => THREE.Sprite) {
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

  const concrete = flat();
  const roof = flat({ roughness: 0.5, metalness: 0.25, side: THREE.DoubleSide });
  const glass = flat({ roughness: 0.3, metalness: 0.4 });
  const tipMat = flat();
  const asphalt = new THREE.MeshStandardMaterial({ roughness: 1 });
  const paint = new THREE.MeshBasicMaterial();
  const apron = new THREE.MeshStandardMaterial({ roughness: 1 });
  const grass = new THREE.MeshStandardMaterial({ roughness: 1 });
  const trunk = flat();
  const leaf = flat({ roughness: 0.9 });
  const planeMat = flat({ roughness: 0.4 });
  const accentMat = flat({ roughness: 0.5 });
  const lightMat = new THREE.MeshBasicMaterial({ color: "#ffd9a0" });

  const group = new THREE.Group();
  const glows: THREE.Sprite[] = [];

  /* ── KLIA ── */
  const apronMesh = new THREE.Mesh(roundedRect(-11.4, -5.6, -0.4, 2.4, 0.6), apron);
  apronMesh.position.y = 0.004;
  group.add(apronMesh);

  const tower = klTower(concrete, glass, tipMat);
  tower.userData.tip = new THREE.Vector3(0, 6.9, 0);
  group.add(tower);
  // glows ride on the tower, so they follow it when it's moved or scaled
  const cabGlow = glow(new THREE.Color("#e6f0ff"), 2.1);
  cabGlow.position.set(0, 5.16, 0.2);
  const beacon = glow(new THREE.Color("#ff6b5a"), 1.15);
  beacon.position.set(0, 6.9, 0);
  tower.add(cabGlow, beacon);
  glows.push(cabGlow, beacon);

  const terminal = new THREE.Group();
  const M = 0.85;
  const hypar = hyparGeo(M, 0.12);
  const column = new THREE.CylinderGeometry(0.025, 0.04, 0.75, 5);
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 3; j++) {
      const shell = new THREE.Mesh(hypar, roof);
      shell.position.set(i * M, 0.8, j * M);
      const col = new THREE.Mesh(column, concrete);
      col.position.set(i * M, 0.38, j * M);
      terminal.add(shell, col);
    }
  const hall = new THREE.Mesh(new THREE.BoxGeometry(6 * M - 0.25, 0.55, 3 * M - 0.25), glass);
  hall.position.set(2.5 * M, 0.28, M);
  terminal.add(hall);
  terminal.position.set(-8.6, 0, -5);
  group.add(terminal);

  // contact pier in front of the terminal, with jets parked nose-in
  const pier = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.32, 0.42), glass);
  pier.position.set(-6.4, 0.16, -1.2);
  const link = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.28, 1.2), glass);
  link.position.set(-6.4, 0.14, -2.0);
  group.add(pier, link);
  [-8.4, -6.9, -5.4, -3.9].forEach((x) => {
    const p = plane(planeMat, accentMat);
    p.scale.setScalar(0.75);
    p.rotation.y = Math.PI / 2; // nose toward the pier
    p.position.set(x, 0.1, -0.35);
    group.add(p);
  });

  const runway = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.02, 0.7), asphalt);
  runway.position.set(-5.9, 0.012, 1.5);
  group.add(runway);
  const dash = new THREE.BoxGeometry(0.35, 0.005, 0.04);
  for (let x = -11.3; x < -0.4; x += 0.7) {
    const d = new THREE.Mesh(dash, paint);
    d.position.set(x, 0.026, 1.5);
    group.add(d);
  }
  const runwayLights = new THREE.Group();
  const bulb = new THREE.SphereGeometry(0.03, 4, 3);
  for (let x = -11.5; x < -0.2; x += 0.55)
    [1.13, 1.87].forEach((z) => {
      const b = new THREE.Mesh(bulb, lightMat);
      b.position.set(x, 0.04, z);
      runwayLights.add(b);
    });
  group.add(runwayLights);

  const jet = plane(planeMat, accentMat);
  const jetLight = glow(new THREE.Color("#ffffff"), 0.4);
  jet.add(jetLight);
  jetLight.position.set(-0.5, 0.2, 0);
  glows.push(jetLight);
  group.add(jet);

  /* ── Sepang ── */
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < SEPANG.length; i += 2) pts.push(trackPoint(SEPANG[i], SEPANG[i + 1]));
  const track = new THREE.CatmullRomCurve3(pts, true, "centripetal");
  const box = new THREE.Box3().setFromPoints(pts);
  const grassMesh = new THREE.Mesh(
    roundedRect(box.min.x - 0.5, box.min.z - 0.5, box.max.x + 0.5, box.max.z + 0.5, 0.8),
    grass,
  );
  grassMesh.position.y = 0.004;
  group.add(grassMesh);
  group.add(new THREE.Mesh(ribbon(track, 0.26, 0.01), paint)); // white edge lines peek out either side
  group.add(new THREE.Mesh(ribbon(track, 0.2, 0.014), asphalt));
  const startLine = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.004, 0.22), paint);
  startLine.position.copy(trackPoint(-147, 24)).setY(0.018);
  group.add(startLine);

  // main grandstand, between the main straight and the back straight
  const grand = new THREE.Group();
  const standShape = new THREE.Shape();
  standShape.moveTo(0, 0);
  standShape.lineTo(0.6, 0);
  standShape.lineTo(0.6, 0.55);
  standShape.lineTo(0, 0.08);
  const stand = new THREE.ExtrudeGeometry(standShape, { depth: 2.6, bevelEnabled: false });
  stand.rotateY(Math.PI / 2);
  stand.translate(-1.3, 0, 0.3);
  grand.add(new THREE.Mesh(stand, concrete));
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.62, 0.12), glass);
  back.position.set(0, 0.31, -0.36);
  grand.add(back);
  const leafG = leafGeo();
  leafG.scale(0.46, 0.46, 0.46);
  for (let i = 0; i < 8; i++) {
    const x = -1.15 + i * 0.33;
    const l = new THREE.Mesh(leafG, roof);
    l.position.set(x, 0.95, 0.02);
    l.rotation.y = (i % 2 ? 1 : -1) * 0.22;
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.98, 4), concrete);
    mast.position.set(x, 0.49, -0.3);
    grand.add(l, mast);
  }
  grand.userData.tip = new THREE.Vector3(0, 1.1, 0);
  group.add(grand);
  [-0.9, 0, 0.9].forEach((x) => {
    const f = glow(new THREE.Color("#fff3d6"), 0.7);
    f.position.set(x, 1.3, -0.3);
    grand.add(f);
    glows.push(f);
  });

  const racer = car(accentMat, concrete);
  const tailLight = glow(new THREE.Color("#ff4d4d"), 0.3);
  racer.add(tailLight);
  tailLight.position.set(-0.11, 0.05, 0);
  glows.push(tailLight);
  group.add(racer);

  /* ── labels ── */
  const klia = label("KLIA");
  const sepang = label("SEPANG");
  group.add(klia.sp, sepang.sp);

  const place = () => {
    const G = LAYOUT.grandstand,
      T = LAYOUT.tower;
    grand.position.set(G.x, 0, G.z);
    grand.rotation.y = G.rotation; // ≈ π: seats face the main straight
    grand.scale.set(G.scale, G.scale, G.scale * G.depth);
    tower.position.set(T.x, 0, T.z);
    tower.scale.setScalar(T.scale);
    klia.sp.position.set(LAYOUT.kliaLabel.x, LAYOUT.kliaLabel.y, LAYOUT.kliaLabel.z);
    sepang.sp.position.set(LAYOUT.sepangLabel.x, LAYOUT.sepangLabel.y, LAYOUT.sepangLabel.z);
  };
  place();

  const addTweaks = (gui: GUI) => {
    const folder = (name: string, obj: Record<string, number>, ranges: Record<string, [number, number]>) => {
      const f = gui.addFolder(name);
      Object.entries(ranges).forEach(([k, [lo, hi]]) => f.add(obj, k, lo, hi, 0.01).onChange(place));
    };
    folder("Sepang grandstand", LAYOUT.grandstand, {
      x: [0, 11],
      z: [-6, 3],
      rotation: [0, Math.PI * 2],
      scale: [0.3, 2.5],
      depth: [0.3, 2],
    });
    folder("KLIA tower", LAYOUT.tower, { x: [-11, 11], z: [-6, 3], scale: [0.2, 1.2] });
    folder("KLIA label", LAYOUT.kliaLabel, { x: [-12, 12], y: [0, 5], z: [-8, 3] });
    folder("Sepang label", LAYOUT.sepangLabel, { x: [-12, 12], y: [0, 5], z: [-8, 3] });
    gui.add(
      {
        "Copy layout": () => {
          const round = (o: Record<string, number>) =>
            `{ ${Object.entries(o)
              .map(([k, v]) => `${k}: ${+v.toFixed(2)}`)
              .join(", ")} }`;
          const text = `export const LAYOUT = {\n${Object.entries(LAYOUT)
            .map(([k, v]) => `  ${k}: ${round(v)},`)
            .join("\n")}\n};`;
          console.log(text);
          navigator.clipboard?.writeText(text).catch(() => {});
        },
      },
      "Copy layout",
    );
  };

  /* ── oil palms: a plantation behind everything, and clumps at the far edges ── */
  for (let i = 0; i < 140; i++) {
    const x = (rnd() - 0.5) * 30,
      z = -11 + rnd() * 14;
    if (z > -6.4 && Math.abs(x) < 11.4) continue;
    const p = palm(trunk, leaf, rnd);
    p.position.set(x, 0, z);
    group.add(p);
  }

  const retheme = (bg: THREE.Color, text: THREE.Color, accent: THREE.Color, day: boolean, k: number) => {
    const hex = (c: THREE.Color) => `#${c.getHexString()}`;
    concrete.color.copy(bg.clone().lerp(text, 0.36 * k));
    roof.color.copy(bg.clone().lerp(text, Math.min(0.7 * k, 0.88)));
    glass.color.copy(bg.clone().lerp(text, 0.45 * k).lerp(new THREE.Color("#8fb4d8"), 0.25));
    glass.emissive.set("#ffd9a0");
    glass.emissiveIntensity = day ? 0 : 0.45;
    tipMat.color.copy(accent);
    tipMat.emissive.copy(accent);
    tipMat.emissiveIntensity = day ? 0.15 : 1.2;
    asphalt.color.copy(bg.clone().lerp(new THREE.Color(0x000000), 0.55).lerp(text, 0.06));
    paint.color.copy(new THREE.Color(0xffffff).lerp(bg, day ? 0.05 : 0.3));
    apron.color.copy(bg.clone().lerp(text, 0.14 * k));
    grass.color.copy(bg.clone().lerp(new THREE.Color("#4f8f4f"), day ? 0.4 : 0.22));
    trunk.color.copy(bg.clone().lerp(new THREE.Color("#6b5641"), 0.55));
    leaf.color.copy(bg.clone().lerp(new THREE.Color("#3f7a4a"), day ? 0.65 : 0.4));
    planeMat.color.copy(bg.clone().lerp(new THREE.Color(0xffffff), 0.8));
    accentMat.color.copy(accent);
    accentMat.emissive.copy(accent);
    accentMat.emissiveIntensity = day ? 0 : 0.4;
    runwayLights.visible = !day;
    klia.draw(hex(text), hex(accent));
    sepang.draw(hex(text), hex(accent));
  };

  // plane: rolls down the runway, rotates and climbs away over the circuit, then the next one lines up
  const animate = (t: number) => {
    const p = (t % 16) / 16;
    if (p < 0.45) {
      const q = p / 0.45;
      jet.position.set(-11 + 8.5 * q * q, 0.12, 1.5);
      jet.rotation.z = 0;
    } else {
      const q = (p - 0.45) / 0.55;
      jet.position.set(-2.5 + q * 13, 0.12 + q * q * 5.5, 1.5 - q * 2);
      jet.rotation.z = Math.min(0.28, q * 1.4);
    }
    const u = (t * 0.035) % 1;
    racer.position.copy(track.getPointAt(u)).setY(0.016);
    const tan = track.getTangentAt(u);
    racer.rotation.y = Math.atan2(-tan.z, tan.x);
  };

  return { group, glows, targets: [tower, grand], retheme, animate, addTweaks };
}
