// Weather-driven hero: weather headline beside the 3D KL skyline, then the live forecast card and the terminal.
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { HEADLINES, iconFor } from "./conditions";
import { PALETTES } from "./palettes";
import { classify, describeCode } from "./useKLWeather";
import { useWeather } from "./WeatherProvider";

const Skyline = lazy(() => import("./Skyline"));

const twoCol: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
};

// Appended to the hero terminal: it "fetches" the weather as its last command.
// eslint-disable-next-line react-refresh/only-export-components
export function useWeatherTermLines() {
  const { cond, live, simulated } = useWeather();
  return useMemo(() => {
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
  }, [cond, live, simulated]);
}

function useKLClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);
  return now.toLocaleString("en-MY", { timeZone: "Asia/Kuala_Lumpur", weekday: "short", hour: "numeric", minute: "2-digit" });
}

export function WeatherChip() {
  const { cond, isDay, live } = useWeather();
  return (
    <span
      className="wx-chip"
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
    </span>
  );
}

function Pitch({ openToWork }: { openToWork: boolean }) {
  const { cond, isDay, pending } = useWeather();
  const h = HEADLINES[cond];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
      {openToWork && (
        <span className="tag tag-outline" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px" }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--color-accent)",
              animation: "kj-pulse 2.4s ease infinite",
            }}
          />
          Open for freelance work · Kuala Lumpur
        </span>
      )}
      <h1
        style={{
          fontSize: "clamp(40px, 5vw, 64px)",
          lineHeight: 1.05,
          letterSpacing: "-0.02em",
          margin: 0,
          textWrap: "balance",
        }}
      >
        {pending ? (
          <>
            Backends that hold up. <span style={{ color: "var(--color-accent-300)" }}>Frontends that feel alive.</span>
          </>
        ) : (
          <>
            {isDay ? h.day : h.night} <span style={{ color: "var(--color-accent-300)" }}>{h.kicker}</span>
          </>
        )}
      </h1>
      {!pending && (
        <p style={{ fontSize: 19, color: "var(--color-neutral-300)", margin: 0 }}>
          Backends that hold up. Frontends that feel alive.
        </p>
      )}
      <p style={{ fontSize: 16, lineHeight: 1.65, color: "var(--color-neutral-400)", maxWidth: "52ch", margin: 0 }}>
        Hi, I'm Khawarizmi, a full-stack software engineer in Kuala Lumpur. Go and PostgreSQL under the hood, React and
        TypeScript up front. This page is tinted by the sky outside my window right now.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 4 }}>
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
  );
}

function WeatherCard() {
  const { cond, isDay, live, simulated } = useWeather();
  const clock = useKLClock();
  return (
    <div
      style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: 22,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "var(--color-neutral-500)" }}>
        <span>
          <i className="ph ph-map-pin" /> Kuala Lumpur
        </span>
        <span>
          {clock}
          {simulated && " · preview"}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <i className={`ph ${iconFor(cond, isDay)}`} style={{ fontSize: 60, color: "var(--color-accent)" }} />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontSize: 68,
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
        <>
          <div style={{ display: "flex", gap: 20, fontSize: 13, color: "var(--color-neutral-400)", flexWrap: "wrap" }}>
            <span>Feels {Math.round(live.feelsLike)}°</span>
            <span>Humidity {live.humidity}%</span>
            {live.aqi != null && <span>AQI {live.aqi}</span>}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 4,
              paddingTop: 12,
              borderTop: "1px solid var(--color-divider)",
            }}
          >
            {live.hourly.slice(0, 6).map((hr) => (
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
        </>
      )}
    </div>
  );
}

export function WeatherHero({ openToWork, terminal }: { openToWork: boolean; terminal: React.ReactNode }) {
  const { cond, isDay } = useWeather();
  return (
    <section id="home" style={{ overflow: "hidden" }}>
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
        <div style={{ ...twoCol, gap: 32, alignItems: "center" }}>
          <Pitch openToWork={openToWork} />
          <div
            aria-hidden
            style={{
              height: "clamp(320px, 40vw, 480px)",
              margin: "-24px -32px -24px 0",
              // soft vignette so the scene melts into the page instead of sitting in a box
              maskImage: "radial-gradient(ellipse 62% 58% at 54% 50%, #000 58%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(ellipse 62% 58% at 54% 50%, #000 58%, transparent 100%)",
            }}
          >
            <Suspense fallback={null}>
              <Skyline cond={cond} isDay={isDay} />
            </Suspense>
          </div>
        </div>
        <div style={{ ...twoCol, gap: 24, alignItems: "stretch" }}>
          <WeatherCard />
          {terminal}
        </div>
      </div>
    </section>
  );
}
