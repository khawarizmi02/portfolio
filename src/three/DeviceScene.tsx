// A project screenshot shown on a low-poly device that turns toward the pointer.
//   laptop – the lid opens as the card scrolls into view
//   phone  – spins in from edge-on, then floats
// Loaded lazily with three.js.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { clamp01, cssColor, ease, useScene } from "./mount";
import { useWeather } from "../weather/WeatherProvider";

function keyboardTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 340;
  const x = c.getContext("2d")!;
  x.fillStyle = "#000";
  x.fillRect(0, 0, 512, 340);
  x.fillStyle = "#fff";
  for (let r = 0; r < 5; r++)
    for (let k = 0; k < 14; k++) {
      x.globalAlpha = 0.18;
      x.fillRect(28 + k * 33, 24 + r * 33, 27, 27);
    }
  x.globalAlpha = 0.12;
  x.fillRect(176, 210, 160, 100); // trackpad
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function DeviceScene({ kind, src }: { kind: "laptop" | "phone"; src: string }) {
  const { cond, isDay } = useWeather();

  const host = useScene(({ el, scene, camera, pointer, reduce }) => {
    const hemi = new THREE.HemisphereLight(0xffffff, 0x333333, 1.2);
    const key = new THREE.DirectionalLight(0xffffff, 2);
    key.position.set(3, 6, 5);
    const rim = new THREE.DirectionalLight(0xffffff, 1.4);
    rim.position.set(-4, 2, -4);
    scene.add(hemi, key, rim);

    const shot = new THREE.TextureLoader().load(src);
    shot.colorSpace = THREE.SRGBColorSpace;
    shot.anisotropy = 8;
    const screenMat = new THREE.MeshBasicMaterial({ map: shot, toneMapped: false, transparent: true });
    const bodyMat = new THREE.MeshStandardMaterial({ roughness: 0.38, metalness: 0.35 });
    const darkMat = new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.1 });

    const device = new THREE.Group();
    scene.add(device);
    let lid: THREE.Group | null = null;

    if (kind === "laptop") {
      const base = new THREE.Mesh(new RoundedBoxGeometry(3.2, 0.12, 2.2, 3, 0.05), bodyMat);
      const keys = new THREE.Mesh(
        new THREE.PlaneGeometry(2.8, 1.86),
        new THREE.MeshStandardMaterial({ map: keyboardTexture(), transparent: true, opacity: 0.9, roughness: 0.8 }),
      );
      keys.rotation.x = -Math.PI / 2;
      keys.position.y = 0.061;
      lid = new THREE.Group();
      lid.position.set(0, 0.06, -1.08);
      const shell = new THREE.Mesh(new RoundedBoxGeometry(3.2, 2.1, 0.07, 3, 0.03), bodyMat);
      shell.position.set(0, 1.05, 0);
      const bezel = new THREE.Mesh(new THREE.PlaneGeometry(3.12, 2.02), darkMat);
      bezel.position.set(0, 1.05, 0.036);
      // clover.png is 1006×653, so the panel is 2.98×1.93
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.98, 1.93), screenMat);
      screen.position.set(0, 1.05, 0.038);
      lid.add(shell, bezel, screen);
      device.add(base, keys, lid);
      device.position.y = -0.55;
      camera.position.set(0, 2.5, 6.4);
      camera.lookAt(0, 0.35, 0);
    } else {
      const body = new THREE.Mesh(new RoundedBoxGeometry(1.12, 2.3, 0.1, 4, 0.05), bodyMat);
      const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 2.24), darkMat);
      glass.position.z = 0.051;
      // gethealthy.png is 540×1156, so the panel is 1.0×2.14
      const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.14), screenMat);
      screen.position.z = 0.053;
      const island = new THREE.Mesh(new RoundedBoxGeometry(0.28, 0.07, 0.01, 2, 0.03), darkMat);
      island.position.set(0, 0.98, 0.06);
      device.add(body, glass, screen, island);
      camera.position.set(0, 0, 5.6);
      camera.lookAt(0, 0, 0);
    }

    return {
      retheme: () => {
        const bg = cssColor("--color-bg"),
          text = cssColor("--color-text"),
          accent = cssColor("--color-accent");
        bodyMat.color.copy(bg.clone().lerp(text, 0.55));
        darkMat.color.copy(bg.clone().lerp(new THREE.Color(0x000000), 0.75));
        hemi.groundColor.copy(bg);
        rim.color.copy(accent);
      },
      tick: (t) => {
        const r = el.getBoundingClientRect();
        // 0 as the card enters, 1 once it's comfortably in view
        const inView = reduce ? 1 : ease(clamp01((window.innerHeight - r.top) / (window.innerHeight * 0.6)));
        const sway = reduce ? 0 : Math.sin(t * 0.6) * 0.04;
        if (lid) {
          lid.rotation.x = THREE.MathUtils.lerp(Math.PI / 2 - 0.03, -0.24, inView);
          screenMat.opacity = clamp01(inView * 1.6 - 0.3);
          device.rotation.y = -0.32 + pointer.x * 0.32 + sway;
          device.rotation.x = pointer.y * 0.08;
        } else {
          device.rotation.y = (1 - inView) * Math.PI * 0.9 - 0.25 + pointer.x * 0.45 + sway * 3;
          device.rotation.x = pointer.y * 0.12;
          device.rotation.z = 0.06;
          device.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.06;
        }
      },
    };
  }, `${cond}-${isDay}`);

  return <div ref={host} style={{ width: "100%", height: "100%" }} aria-hidden />;
}
