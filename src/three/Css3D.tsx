// 3D effects built from CSS transforms only: no WebGL, crisp text, nearly free to render.
import { useEffect, useRef, useState } from "react";
import { LAYERS, type LayerKey } from "./layers";
import "./css3d.css";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Pointer position over an element as -0.5..0.5 on each axis, written into CSS custom properties so
// moving the mouse never re-renders React.
function usePointerVars<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) return;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      el.dataset.hover = "";
    };
    const leave = () => {
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
      delete el.dataset.hover;
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
    };
  }, []);
  return ref;
}

/* ── Work A: card tilts toward the pointer with a moving glare ── */
export function Tilt({
  children,
  max = 9,
  radius = "var(--radius-lg)",
  style,
}: {
  children: React.ReactNode;
  max?: number;
  radius?: string;
  style?: React.CSSProperties;
}) {
  const ref = usePointerVars<HTMLDivElement>();
  return (
    <div ref={ref} className="kj-tilt" style={{ perspective: 900, ["--tilt-max" as string]: `${max}deg`, ...style }}>
      <div className="kj-tilt-inner" style={{ borderRadius: radius }}>
        {children}
        <div className="kj-tilt-glare" style={{ borderRadius: radius }} />
      </div>
    </div>
  );
}

/* ── Stack C: isometric slabs drawn with CSS, gap follows scroll ── */
export function CssStack({ active }: { active: LayerKey | null }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current!;
    if (reduceMotion()) {
      el.style.setProperty("--gap", "1");
      return;
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const s = Math.min(1, Math.max(0, (window.innerHeight - r.top) / (window.innerHeight + r.height)));
      el.style.setProperty("--gap", Math.min(1, Math.sin(Math.PI * s) * 1.25).toFixed(3));
    };
    const onScroll = () => (raf ||= requestAnimationFrame(update));
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div ref={ref} className="kj-cstack" data-active={active ?? undefined} aria-hidden>
      <div className="kj-cstack-plane">
        {LAYERS.map((L, i) => (
          <div
            key={L.key}
            className="kj-cstack-layer"
            data-on={active === L.key ? "" : undefined}
            style={{ ["--i" as string]: i }}
          >
            <span className="kj-cstack-label">{L.label}</span>
            <span className="kj-cstack-sub">{L.sub}</span>
            <span className="kj-cstack-edge kj-cstack-front" />
            <span className="kj-cstack-edge kj-cstack-side" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── About A: portrait card with chips floating at different depths ── */
export function DepthPortrait({
  src,
  alt,
  chips,
}: {
  src: string;
  alt: string;
  chips: { icon: string; text: string; x: string; y: string; z: number }[];
}) {
  const ref = usePointerVars<HTMLDivElement>();
  return (
    <div ref={ref} className="kj-depth">
      <div className="kj-depth-inner">
        <div className="kj-depth-back" />
        <div className="kj-depth-frame" />
        <div className="kj-depth-photo">
          <img src={src} alt={alt} />
          <div className="kj-depth-fade" />
        </div>
        {chips.map((c) => (
          <span
            key={c.text}
            className="kj-depth-chip"
            style={{ left: c.x, top: c.y, transform: `translateZ(${c.z}px)` }}
          >
            <i className={`ph ${c.icon}`} />
            {c.text}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── About C: a card that flips between two faces on its own, or when you pick a side ── */
export function FlipCard({
  front,
  back,
  labels,
  every = 7000,
}: {
  front: React.ReactNode;
  back: React.ReactNode;
  labels: [string, string];
  every?: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const [paused, setPaused] = useState(false);
  // a fresh timer after every flip, so picking a side yourself always gets the full interval
  useEffect(() => {
    if (paused || reduceMotion()) return;
    const id = setTimeout(() => setFlipped((f) => !f), every);
    return () => clearTimeout(id);
  }, [flipped, paused, every]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div
        className="kj-flip"
        data-flipped={flipped ? "" : undefined}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onClick={() => setFlipped((f) => !f)}
        style={{ width: "100%" }}
      >
        <div className="kj-flip-inner">
          <div className="kj-flip-face" aria-hidden={flipped}>
            {front}
          </div>
          <div className="kj-flip-face kj-flip-back" aria-hidden={!flipped}>
            {back}
          </div>
        </div>
      </div>
      <div className="kj-flip-switch" role="group" aria-label="Choose view">
        {labels.map((l, i) => (
          <button key={l} aria-pressed={flipped === (i === 1)} onClick={() => setFlipped(i === 1)}>
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
