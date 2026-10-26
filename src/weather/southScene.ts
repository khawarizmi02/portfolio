// Low-poly KLIA and Sepang for the footer skyline: the KLIA control tower, the terminal's hypar "forest" roof,
// a runway with a plane taking off, and the Sepang International Circuit grandstand with its leaf canopies
// and a car lapping the track. Oil palms fill the gaps. Weather, fog and lighting come from Skyline.
import * as THREE from "three";

const flat = (o: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ flatShading: true, roughness: 0.85, ...o });

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
  g.userData.tip = new THREE.Vector3(0, 6.9, 0);
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
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, y: number, n = 240) {
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
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.045, 0.1), body);
  b.position.y = 0.04;
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.12), dark);
  wing.position.set(-0.12, 0.08, 0);
  g.add(b, wing);
  return g;
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
  const trunk = flat();
  const leaf = flat({ roughness: 0.9 });
  const planeMat = flat({ roughness: 0.4 });
  const accentMat = flat({ roughness: 0.5 });
  const lightMat = new THREE.MeshBasicMaterial({ color: "#ffd9a0" });

  const group = new THREE.Group();
  const glows: THREE.Sprite[] = [];

  /* ── KLIA ── */
  const tower = klTower(concrete, glass, tipMat);
  tower.position.set(-0.6, 0, -3.4);
  group.add(tower);
  const cabGlow = glow(new THREE.Color("#e6f0ff"), 1.4);
  cabGlow.position.set(-0.6, 5.2, -3.3);
  const beacon = glow(new THREE.Color("#ff6b5a"), 0.7);
  beacon.position.set(-0.6, 6.9, -3.4);
  glows.push(cabGlow, beacon);

  const terminal = new THREE.Group();
  const M = 1.05;
  const hypar = hyparGeo(M, 0.14);
  const column = new THREE.CylinderGeometry(0.03, 0.05, 0.95, 5);
  for (let i = 0; i < 6; i++)
    for (let j = 0; j < 2; j++) {
      const x = i * M,
        z = j * M;
      const shell = new THREE.Mesh(hypar, roof);
      shell.position.set(x, 1.0, z);
      const col = new THREE.Mesh(column, concrete);
      col.position.set(x, 0.48, z);
      terminal.add(shell, col);
    }
  const hall = new THREE.Mesh(new THREE.BoxGeometry(6 * M - 0.3, 0.7, 2 * M - 0.3), glass);
  hall.position.set(2.5 * M, 0.35, 0.5 * M);
  terminal.add(hall);
  terminal.position.set(-8.4, 0, -4.4);
  terminal.scale.setScalar(1.3);
  group.add(terminal);

  const runway = new THREE.Mesh(new THREE.BoxGeometry(12, 0.02, 0.9), asphalt);
  runway.position.set(-5, 0.01, 1.8);
  group.add(runway);
  const dash = new THREE.BoxGeometry(0.35, 0.005, 0.04);
  for (let x = -10.6; x < 0.6; x += 0.7) {
    const d = new THREE.Mesh(dash, paint);
    d.position.set(x, 0.025, 1.8);
    group.add(d);
  }
  const runwayLights = new THREE.Group();
  const bulb = new THREE.SphereGeometry(0.03, 4, 3);
  for (let x = -10.8; x < 1; x += 0.6)
    [1.36, 2.24].forEach((z) => {
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
  const sepang = new THREE.Group();
  const standShape = new THREE.Shape();
  standShape.moveTo(0, 0);
  standShape.lineTo(1.2, 0);
  standShape.lineTo(1.2, 1.25);
  standShape.lineTo(0, 0.25);
  const stand = new THREE.ExtrudeGeometry(standShape, { depth: 6, bevelEnabled: false });
  stand.rotateY(Math.PI / 2);
  stand.translate(-3, 0, 0);
  sepang.add(new THREE.Mesh(stand, concrete));
  const back = new THREE.Mesh(new THREE.BoxGeometry(6.2, 1.5, 0.4), glass);
  back.position.set(0, 0.75, -1.4);
  sepang.add(back);
  const leafG = leafGeo();
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(leafG, roof);
    l.position.set(-2.62 + i * 0.75, 1.75, -0.45);
    l.rotation.y = (i % 2 ? 1 : -1) * 0.22;
    sepang.add(l);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 1.9, 4), concrete);
    mast.position.set(-2.62 + i * 0.75, 0.95, -1.15);
    sepang.add(mast);
  }
  sepang.position.set(4.6, 0, -3.3);
  sepang.scale.setScalar(1.4);
  sepang.userData.tip = new THREE.Vector3(0, 2.7, -1.5);
  group.add(sepang);
  [-2.4, 0, 2.4].forEach((x) => {
    const f = glow(new THREE.Color("#fff3d6"), 1.1);
    f.position.set(4.6 + x, 3, -5);
    glows.push(f);
  });

  const track = new THREE.CatmullRomCurve3(
    [
      [1.6, -2.4],
      [4.6, -2.45],
      [7.6, -2.4],
      [9.0, -1.7],
      [8.7, -0.4],
      [7.1, 0.2],
      [5.5, -0.7],
      [4.2, 0.4],
      [2.6, 0.9],
      [1.0, 0.3],
      [0.6, -1.3],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
    true,
    "centripetal",
  );
  group.add(new THREE.Mesh(ribbon(track, 0.36, 0.012), asphalt));
  const lines = new THREE.Mesh(ribbon(track, 0.42, 0.008), paint);
  group.add(lines);
  const racer = car(accentMat, concrete);
  const tailLight = glow(new THREE.Color("#ff4d4d"), 0.35);
  racer.add(tailLight);
  tailLight.position.set(-0.14, 0.06, 0);
  glows.push(tailLight);
  group.add(racer);

  /* ── oil palms: a plantation behind everything, and clumps at the far edges ── */
  for (let i = 0; i < 90; i++) {
    const x = (rnd() - 0.5) * 26,
      z = -9.5 + rnd() * 12.5;
    if (z > -6 && Math.abs(x) < 9.8) continue;
    const p = palm(trunk, leaf, rnd);
    p.position.set(x, 0, z);
    group.add(p);
  }

  const retheme = (bg: THREE.Color, text: THREE.Color, accent: THREE.Color, day: boolean, k: number) => {
    concrete.color.copy(bg.clone().lerp(text, 0.32 * k));
    roof.color.copy(bg.clone().lerp(text, Math.min(0.62 * k, 0.85)));
    glass.color.copy(bg.clone().lerp(text, 0.45 * k).lerp(new THREE.Color("#8fb4d8"), 0.25));
    glass.emissive.set("#ffd9a0");
    glass.emissiveIntensity = day ? 0 : 0.45;
    tipMat.color.copy(accent);
    tipMat.emissive.copy(accent);
    tipMat.emissiveIntensity = day ? 0.15 : 1.2;
    asphalt.color.copy(bg.clone().lerp(new THREE.Color(0x000000), 0.35).lerp(text, 0.1));
    paint.color.copy(bg.clone().lerp(text, 0.7));
    trunk.color.copy(bg.clone().lerp(new THREE.Color("#6b5641"), 0.55));
    leaf.color.copy(bg.clone().lerp(new THREE.Color("#3f7a4a"), day ? 0.65 : 0.4));
    planeMat.color.copy(bg.clone().lerp(new THREE.Color(0xffffff), 0.8));
    accentMat.color.copy(accent);
    accentMat.emissive.copy(accent);
    accentMat.emissiveIntensity = day ? 0 : 0.4;
    runwayLights.visible = !day;
  };

  // plane: rolls down the runway, rotates and climbs away into the clouds, then the next one lines up
  const animate = (t: number) => {
    const p = (t % 16) / 16;
    if (p < 0.45) {
      const q = p / 0.45;
      jet.position.set(-10 + 7.5 * q * q, 0.14, 1.8);
      jet.rotation.z = 0;
    } else {
      const q = (p - 0.45) / 0.55;
      jet.position.set(-2.5 + q * 12, 0.14 + q * q * 6.5, 1.8 - q * 1.5);
      jet.rotation.z = Math.min(0.28, q * 1.4);
    }
    const u = (t * 0.045) % 1;
    racer.position.copy(track.getPointAt(u)).setY(0.015);
    const tan = track.getTangentAt(u);
    racer.rotation.y = Math.atan2(-tan.z, tan.x);
  };

  return { group, glows, targets: [tower, sepang], retheme, animate };
}
