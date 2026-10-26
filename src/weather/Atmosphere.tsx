// Animated weather behind the page: rain and storm streaks (with lightning), stars or sun motes, drifting clouds,
// haze. Lightning strikes are broadcast as a "wx:strike" window event so the 3D skyline can strike in sync.
import { useEffect, useRef, useState } from "react";
import type { Condition } from "./useKLWeather";

export function AtmosphereLayer({ cond, isDay }: { cond: Condition; isDay: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [flash, setFlash] = useState(0);

  useEffect(() => {
    const cv = canvas.current!;
    const ctx = cv.getContext("2d")!;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0,
      h = 0,
      raf = 0;
    const resize = () => {
      w = cv.width = window.innerWidth;
      h = cv.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const n = cond === "storm" ? 420 : cond === "rain" ? 220 : cond === "haze" ? 140 : cond === "clear" ? (isDay ? 40 : 160) : 0;
    const parts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      z: Math.random() * 0.8 + 0.2,
      p: Math.random() * Math.PI * 2,
    }));

    const frame = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const q of parts) {
        if (cond === "rain" || cond === "storm") {
          const speed = (cond === "storm" ? 22 : 14) * q.z;
          const slant = cond === "storm" ? 0.35 : 0.15;
          q.y += speed;
          q.x += speed * slant;
          if (q.y > h) {
            q.y = -20;
            q.x = Math.random() * w;
          }
          if (q.x > w) q.x -= w;
          ctx.strokeStyle = `rgba(210,235,255,${0.12 + q.z * 0.22})`;
          ctx.lineWidth = q.z * 1.3;
          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(q.x - speed * slant * 0.9, q.y - speed * 0.9);
          ctx.stroke();
        } else if (cond === "clear" && !isDay) {
          const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t / 900 + q.p));
          ctx.fillStyle = `rgba(255,248,220,${a * q.z})`;
          ctx.fillRect(q.x, q.y * 0.7, q.z * 1.8, q.z * 1.8);
        } else {
          // sun motes (clear day) or haze particulate
          q.x += (cond === "haze" ? 0.25 : 0.12) * q.z;
          q.y += Math.sin(t / 1600 + q.p) * 0.2 - (cond === "clear" ? 0.15 : 0);
          if (q.x > w) q.x = 0;
          if (q.y < 0) q.y = h;
          ctx.fillStyle = cond === "haze" ? `rgba(150,110,60,${0.18 * q.z})` : `rgba(255,190,90,${0.35 * q.z})`;
          ctx.beginPath();
          ctx.arc(q.x, q.y, q.z * (cond === "haze" ? 2.6 : 2), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (!reduce) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    let strike: ReturnType<typeof setTimeout>;
    const scheduleStrike = () => {
      strike = setTimeout(() => {
        setFlash(0.45);
        window.dispatchEvent(new Event("wx:strike"));
        setTimeout(() => setFlash(0), 90);
        setTimeout(() => setFlash(0.25), 180);
        setTimeout(() => setFlash(0), 280);
        scheduleStrike();
      }, 4000 + Math.random() * 8000);
    };
    if (cond === "storm" && !reduce) scheduleStrike();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(strike);
      window.removeEventListener("resize", resize);
    };
  }, [cond, isDay]);

  const layer: React.CSSProperties = { position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 };
  return (
    <>
      {cond === "clear" && isDay && (
        <div
          style={{
            ...layer,
            background: "radial-gradient(600px 600px at 88% -8%, oklch(0.95 0.15 90 / .55), transparent 70%)",
            animation: "wx-breathe 7s ease-in-out infinite",
          }}
        />
      )}
      {cond === "cloudy" &&
        [0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              ...layer,
              background: `radial-gradient(${520 + i * 140}px 160px at ${20 + i * 30}% ${8 + i * 22}%, color-mix(in oklch, var(--color-text) ${isDay ? 10 : 7}%, transparent), transparent 70%)`,
              filter: "blur(18px)",
              animation: `wx-drift ${50 + i * 17}s ease-in-out ${-i * 9}s infinite alternate`,
            }}
          />
        ))}
      {cond === "haze" && (
        <div
          style={{
            ...layer,
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-bg) 70%, oklch(0.75 0.06 70)) 0%, transparent 45%), color-mix(in oklch, oklch(0.75 0.06 70) 12%, transparent)",
            backdropFilter: "blur(0.6px) saturate(0.75)",
          }}
        />
      )}
      <canvas ref={canvas} style={layer} />
      {cond === "storm" && (
        <div style={{ ...layer, zIndex: 40, background: "#eef", opacity: flash, mixBlendMode: "overlay", transition: "opacity 60ms" }} />
      )}
    </>
  );
}
