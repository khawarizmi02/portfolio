// PROTOTYPE (throwaway, branch prototype/kl-weather-theme).
// Question: how should live Kuala Lumpur weather change the portfolio's look?
// Four variants on the existing page, switchable via ?variant= (A–D) and the floating bar:
//   A  Retint      – palette only; layout untouched
//   B  Atmosphere  – palette + animated weather layer over the page + live chip in the nav
//   C  Forecast    – palette + weather becomes hero content (big temp, hourly strip, weather-aware headline)
//   D  Mood        – palette + typography / corner radius / weight change per weather
//   E1–E3 Combined – B's atmosphere (behind content) + D's heading fonts + C's forecast hero with the terminal kept,
//                    in three hero layouts: E1 terminal strip below, E2 card and terminal stacked right,
//                    E3 headline on top with card + weather-aware terminal side by side below.
// Weather can be simulated with ?wx=clear|cloudy|rain|storm|haze and ?tod=day|night (or the bar / ↑ ↓ keys).
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CONDITIONS, classify, describeCode, useKLWeather, type Condition, type KLWeather } from "./useKLWeather";
import { MOODS, MOOD_FONTS_URL, PALETTES, paletteTokens } from "./palettes";

const VARIANTS = [
  { key: "A", name: "Retint" },
  { key: "B", name: "Atmosphere" },
  { key: "C", name: "Forecast" },
  { key: "D", name: "Mood" },
  { key: "E1", name: "Combo · terminal strip" },
  { key: "E2", name: "Combo · stacked right" },
  { key: "E3", name: "Combo · headline on top" },
] as const;
type VariantKey = (typeof VARIANTS)[number]["key"];
type HeroLayout = "C" | "E1" | "E2" | "E3";

type Features = { atmosphere: boolean; forecast: HeroLayout | null; mood: boolean; weatherTerminal: boolean };
const NONE: Features = { atmosphere: false, forecast: null, mood: false, weatherTerminal: false };
const COMBO: Features = { atmosphere: true, forecast: null, mood: true, weatherTerminal: false };
const FEATURES: Record<VariantKey, Features> = {
  A: NONE,
  B: { ...NONE, atmosphere: true },
  C: { ...NONE, forecast: "C" },
  D: { ...NONE, mood: true },
  E1: { ...COMBO, forecast: "E1" },
  E2: { ...COMBO, forecast: "E2" },
  E3: { ...COMBO, forecast: "E3", weatherTerminal: true },
};
// eslint-disable-next-line react-refresh/only-export-components
export const featuresOf = (v: VariantKey) => FEATURES[v];

type Ctx = { variant: VariantKey; cond: Condition; isDay: boolean; simulated: boolean; live: KLWeather | null };
const WeatherCtx = createContext<Ctx | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useWeatherProto = () => useContext(WeatherCtx)!;

const ICONS: Record<Condition, [day: string, night: string]> = {
  clear: ["ph-sun", "ph-moon-stars"],
  cloudy: ["ph-cloud-sun", "ph-cloud-moon"],
  rain: ["ph-cloud-rain", "ph-cloud-rain"],
  storm: ["ph-cloud-lightning", "ph-cloud-lightning"],
  haze: ["ph-cloud-fog", "ph-cloud-fog"],
};
const iconFor = (c: Condition, day: boolean) => ICONS[c][day ? 0 : 1];

function readParam(k: string) {
  return new URLSearchParams(window.location.search).get(k);
}

export function WeatherPrototype({ children }: { children: React.ReactNode }) {
  const { data: live, error } = useKLWeather();
  const [variant, setVariant] = useState<VariantKey>(
    (VARIANTS.find((v) => v.key === readParam("variant"))?.key ?? "A") as VariantKey,
  );
  const [wx, setWx] = useState<"live" | Condition>((readParam("wx") as Condition) ?? "live");
  const [tod, setTod] = useState<"live" | "day" | "night">((readParam("tod") as "day" | "night") ?? "live");

  const liveCond = live ? classify(live.code, live.aqi) : "cloudy";
  const cond = wx === "live" ? liveCond : wx;
  const isDay = tod === "live" ? (live?.isDay ?? true) : tod === "day";
  const simulated = wx !== "live" || tod !== "live";

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    p.set("variant", variant);
    if (wx === "live") p.delete("wx");
    else p.set("wx", wx);
    if (tod === "live") p.delete("tod");
    else p.set("tod", tod);
    window.history.replaceState(null, "", `${window.location.pathname}?${p}${window.location.hash}`);
  }, [variant, wx, tod]);

  // Push tokens onto :root. Everything in the app reads var(--color-*), so this is the whole retheme.
  const applied = useRef<string[]>([]);
  useLayoutEffect(() => {
    const root = document.documentElement.style;
    applied.current.forEach((k) => root.removeProperty(k));
    const tokens = { ...paletteTokens(cond, isDay), ...(FEATURES[variant].mood ? MOODS[cond].tokens : {}) };
    Object.entries(tokens).forEach(([k, v]) => root.setProperty(k, v));
    applied.current = Object.keys(tokens);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens["--color-bg"]);
  }, [cond, isDay, variant]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MOOD_FONTS_URL;
    const style = document.createElement("style");
    style.textContent = `
      body, nav, section, footer, .card, .tag, .btn { transition: background-color .7s ease, color .7s ease, border-color .7s ease; }
      html[data-wx-mood] h1, html[data-wx-mood] h2, html[data-wx-mood] h3, html[data-wx-mood] h4 { font-weight: var(--font-heading-weight) !important; }
      /* weather layer sits behind the page: let the app's own background through, lift content above it */
      html[data-wx-behind] #root > div:first-child { background: transparent !important; }
      html[data-wx-behind] body { background: var(--color-bg); }
      html[data-wx-behind] #root > div:first-child > section, html[data-wx-behind] #root > div:first-child > footer { position: relative; z-index: 1; }
      html[data-wx-behind] #freelance { background: radial-gradient(900px 420px at 18% 0%, color-mix(in oklch, var(--color-section-glow) 80%, transparent), transparent 70%), color-mix(in oklch, var(--color-section) 80%, transparent) !important; }
      /* dark logo tile → light tile on light themes, keeping the gold */
      html[data-wx-light] .nav-brand img { filter: invert(1) hue-rotate(180deg); }
      @keyframes wx-drift { from { transform: translateX(-12vw); } to { transform: translateX(12vw); } }
      @keyframes wx-breathe { 0%,100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
    `;
    document.head.append(link, style);
    return () => {
      link.remove();
      style.remove();
    };
  }, []);
  useEffect(() => {
    const html = document.documentElement;
    html.toggleAttribute("data-wx-mood", FEATURES[variant].mood);
    html.toggleAttribute("data-wx-behind", FEATURES[variant].atmosphere);
    html.toggleAttribute("data-wx-light", PALETTES[cond][isDay ? "day" : "night"].mode === "light");
  }, [variant, cond, isDay]);

  const ctx = useMemo(() => ({ variant, cond, isDay, simulated, live }), [variant, cond, isDay, simulated, live]);

  return (
    <WeatherCtx.Provider value={ctx}>
      {children}
      {FEATURES[variant].atmosphere && <AtmosphereLayer cond={cond} isDay={isDay} />}
      {import.meta.env.DEV && (
        <Switcher
          variant={variant}
          setVariant={setVariant}
          wx={wx}
          setWx={setWx}
          tod={tod}
          setTod={setTod}
          live={live}
          liveCond={liveCond}
          cond={cond}
          isDay={isDay}
          error={error}
        />
      )}
    </WeatherCtx.Provider>
  );
}

/* ───────────────────────── floating switcher (dev only) ───────────────────────── */

function Switcher(props: {
  variant: VariantKey;
  setVariant: (v: VariantKey) => void;
  wx: "live" | Condition;
  setWx: (v: "live" | Condition) => void;
  tod: "live" | "day" | "night";
  setTod: (v: "live" | "day" | "night") => void;
  live: KLWeather | null;
  liveCond: Condition;
  cond: Condition;
  isDay: boolean;
  error: string | null;
}) {
  const { variant, setVariant, wx, setWx, tod, setTod, live, liveCond, cond, isDay, error } = props;
  const idx = VARIANTS.findIndex((v) => v.key === variant);
  const step = (d: number) => setVariant(VARIANTS[(idx + d + VARIANTS.length) % VARIANTS.length].key);
  const wxOrder: ("live" | Condition)[] = ["live", ...CONDITIONS];
  const stepWx = (d: number) => setWx(wxOrder[(wxOrder.indexOf(wx) + d + wxOrder.length) % wxOrder.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowUp") {
        e.preventDefault();
        stepWx(-1);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        stepWx(1);
      }
      else if (e.key.toLowerCase() === "n") setTod(isDay ? "night" : "day");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const pill: React.CSSProperties = {
    all: "unset",
    cursor: "pointer",
    padding: "4px 9px",
    borderRadius: 999,
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
  };
  const on = (active: boolean): React.CSSProperties => ({
    ...pill,
    background: active ? "#fff" : "transparent",
    color: active ? "#111" : "#ddd",
  });

  return (
    <div
      style={{
        position: "fixed",
        left: "50%",
        bottom: 16,
        transform: "translateX(-50%)",
        zIndex: 1000,
        width: "max-content",
        maxWidth: "calc(100vw - 24px)",
        background: "#111",
        color: "#eee",
        border: "1px solid #444",
        borderRadius: 16,
        boxShadow: "0 10px 40px rgba(0,0,0,.5)",
        padding: "8px 10px",
        fontFamily: "ui-monospace, Menlo, monospace",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <div style={{ color: "#999", fontSize: 11, padding: "0 4px" }}>
        {error
          ? `weather fetch failed: ${error}`
          : live
            ? `LIVE KL ${live.time.slice(11)} · ${live.temp}°C (feels ${live.feelsLike}°) · ${describeCode(live.code)} [${live.code}] · ${live.isDay ? "day" : "night"} · AQI ${live.aqi ?? "?"} → ${liveCond}`
            : "fetching KL weather…"}
        <span style={{ color: "#fff" }}> ▸ showing: {PALETTES[cond][isDay ? "day" : "night"].label}</span>
        {FEATURES[variant].mood && <span style={{ color: "#fc6" }}> · {MOODS[cond].note}</span>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#222", borderRadius: 999, padding: 2 }}>
          <button style={pill} onClick={() => step(-1)} aria-label="Previous variant">
            ←
          </button>
          <span style={{ minWidth: 120, textAlign: "center", color: "#fff" }}>
            {variant} · {VARIANTS[idx].name}
          </span>
          <button style={pill} onClick={() => step(1)} aria-label="Next variant">
            →
          </button>
        </div>
        <div style={{ display: "flex", gap: 2, background: "#222", borderRadius: 999, padding: 2 }}>
          {wxOrder.map((c) => (
            <button key={c} style={on(wx === c)} onClick={() => setWx(c)} title={c}>
              {c === "live" ? "live" : <i className={`ph ${iconFor(c, isDay)}`} style={{ fontSize: 15 }} />}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 2, background: "#222", borderRadius: 999, padding: 2 }}>
          {(["live", "day", "night"] as const).map((t) => (
            <button key={t} style={on(tod === t)} onClick={() => setTod(t)}>
              {t}
            </button>
          ))}
        </div>
        <span style={{ color: "#777", fontSize: 10 }}>← → variant · ↑ ↓ weather · N day/night</span>
      </div>
    </div>
  );
}

/* ───────────────────────── variant B: atmosphere layer ───────────────────────── */

function AtmosphereLayer({ cond, isDay }: { cond: Condition; isDay: boolean }) {
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

export function WeatherChip() {
  const { cond, isDay, live, simulated } = useWeatherProto();
  return (
    <span
      title={live ? `${describeCode(live.code)} in Kuala Lumpur` : "Kuala Lumpur"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 13,
        color: "var(--color-neutral-400)",
        fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
      }}
    >
      <i className={`ph ${iconFor(cond, isDay)}`} style={{ fontSize: 17, color: "var(--color-accent)" }} />
      {live ? `${Math.round(live.temp)}° KL` : "KL"}
      {simulated && <span style={{ fontSize: 10, opacity: 0.6 }}>(sim)</span>}
    </span>
  );
}

/* ───────────────────────── variant C: forecast hero ───────────────────────── */

const HEADLINES: Record<Condition, { day: string; night: string; kicker: string }> = {
  clear: { day: "Sun's blazing over KL.", night: "Clear skies over KL tonight.", kicker: "Good day to ship." },
  cloudy: { day: "Overcast in KL.", night: "Cloudy night in KL.", kicker: "Deploys still clear." },
  rain: { day: "Raining in KL.", night: "Rain over KL tonight.", kicker: "Perfect weather to ship." },
  storm: { day: "Thunderstorm over KL.", night: "Storm over KL tonight.", kicker: "Servers still up." },
  haze: { day: "Jerebu over KL.", night: "Hazy night in KL.", kicker: "The code isn't hazy." },
};

function useKLClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// Extra terminal lines for E3: the terminal "fetches" the weather as its last command.
// eslint-disable-next-line react-refresh/only-export-components
export function weatherTermLines({ cond, live, simulated }: Ctx) {
  if (!live) return [];
  const what = simulated ? cond : describeCode(live.code);
  return [
    { prefix: "$", color: "var(--color-neutral-200)", text: "curl -s api.open-meteo.com/kuala-lumpur" },
    {
      prefix: "✓",
      color: "var(--color-accent-300)",
      text: `${Math.round(live.temp)}°C, ${what}. ${HEADLINES[cond].kicker.toLowerCase()}`,
    },
  ];
}

function Pitch({ openToWork, wide }: { openToWork: boolean; wide?: boolean }) {
  const { cond, isDay } = useWeatherProto();
  const h = HEADLINES[cond];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
      {openToWork && (
        <span className="tag tag-outline" style={{ padding: "5px 12px" }}>
          Open for freelance work
        </span>
      )}
      <h1
        style={{
          fontSize: wide ? "clamp(44px, 6.4vw, 84px)" : "clamp(40px, 5vw, 64px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: 0,
          textWrap: "balance",
          maxWidth: wide ? "18ch" : undefined,
        }}
      >
        {isDay ? h.day : h.night} <span style={{ color: "var(--color-accent-300)" }}>{h.kicker}</span>
      </h1>
      <div
        style={{
          display: "flex",
          flexDirection: wide ? "row" : "column",
          flexWrap: "wrap",
          gap: wide ? "20px 48px" : 20,
          alignItems: wide ? "flex-end" : "flex-start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: "52ch" }}>
          <p style={{ fontSize: 19, color: "var(--color-neutral-300)", margin: 0 }}>
            Backends that hold up. Frontends that feel alive.
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--color-neutral-400)", margin: 0 }}>
            Hi, I'm Khawarizmi, a full-stack software engineer in Kuala Lumpur. Go and PostgreSQL under the hood, React
            and TypeScript up front. This page is tinted by the sky outside my window right now.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <a
            className="btn btn-primary"
            href="mailto:khawarizmijefri02@gmail.com?subject=Let%27s%20build%20something"
            style={{ padding: "10px 20px", fontSize: 15 }}
          >
            Let's talk about your project <i className="ph ph-arrow-right" />
          </a>
          <a className="btn btn-secondary" href="#work" style={{ padding: "10px 20px", fontSize: 15 }}>
            See my work
          </a>
        </div>
      </div>
    </div>
  );
}

function WeatherCard({ compact }: { compact?: boolean }) {
  const { cond, isDay, live, simulated } = useWeatherProto();
  const clock = useKLClock();
  const hourly = live ? live.hourly.slice(0, compact ? 6 : 8) : [];
  return (
    <div
      style={{
        position: "relative",
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: compact ? 22 : 28,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 14 : 20,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-neutral-500)" }}>
        <span>
          <i className="ph ph-map-pin" /> Kuala Lumpur
        </span>
        <span>
          {clock}
          {simulated && " · simulated"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <i className={`ph ${iconFor(cond, isDay)}`} style={{ fontSize: compact ? 60 : 84, color: "var(--color-accent)" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: compact ? 68 : 96,
              lineHeight: 0.9,
              fontFamily: "var(--font-heading)",
              fontWeight: 300,
              letterSpacing: "-0.04em",
            }}
          >
            {live ? Math.round(live.temp) : "--"}°
          </span>
          <span style={{ fontSize: 14, color: "var(--color-neutral-400)", marginTop: 8 }}>
            {PALETTES[cond][isDay ? "day" : "night"].label}
          </span>
        </div>
      </div>
      {live && (
        <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-neutral-400)", flexWrap: "wrap" }}>
          <span>Feels {Math.round(live.feelsLike)}°</span>
          <span>Humidity {live.humidity}%</span>
          {!compact && <span>Wind {live.wind} km/h</span>}
          {live.aqi != null && <span>AQI {live.aqi}</span>}
        </div>
      )}
      {live && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${hourly.length}, 1fr)`,
            gap: 4,
            paddingTop: compact ? 12 : 16,
            borderTop: "1px solid var(--color-divider)",
          }}
        >
          {hourly.map((hr) => (
            <div key={hr.time} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ color: "var(--color-neutral-500)" }}>{hr.time.slice(11, 13)}</span>
              <i
                className={`ph ${iconFor(classify(hr.code, null), hr.isDay)}`}
                style={{ fontSize: 18, color: "var(--color-accent-300)" }}
              />
              <span>{Math.round(hr.temp)}°</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ForecastHero({
  openToWork,
  layout,
  terminal,
}: {
  openToWork: boolean;
  layout: HeroLayout;
  terminal: React.ReactNode;
}) {
  const twoCol: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: 56,
    alignItems: "center",
  };

  return (
    <section id="home" style={{ position: "relative", overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(900px 520px at 85% 0%, color-mix(in oklch, var(--color-accent) 16%, transparent), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "72px 32px 64px",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          gap: 48,
        }}
      >
        {(layout === "C" || layout === "E1") && (
          <div style={twoCol}>
            <Pitch openToWork={openToWork} />
            <WeatherCard />
          </div>
        )}
        {layout === "E1" && terminal}

        {layout === "E2" && (
          <div style={{ ...twoCol, alignItems: "start" }}>
            <Pitch openToWork={openToWork} />
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <WeatherCard compact />
              {terminal}
            </div>
          </div>
        )}

        {layout === "E3" && (
          <>
            <Pitch openToWork={openToWork} wide />
            <div style={{ ...twoCol, gap: 24, alignItems: "stretch" }}>
              <WeatherCard compact />
              {terminal}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
