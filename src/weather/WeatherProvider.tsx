// Themes the whole site from live Kuala Lumpur weather: picks a mood (clear / cloudy / rain / storm / haze) and
// day or night, then writes the matching palette and heading typography onto :root as Nocturne tokens.
// Preview any weather with ?wx=clear|cloudy|rain|storm|haze and ?tod=day|night.
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CONDITIONS, classify, useKLWeather, type Condition, type KLWeather } from "./useKLWeather";
import { MOODS, MOOD_FONTS_URL, PALETTES, paletteTokens } from "./palettes";
import { AtmosphereLayer } from "./Atmosphere";
import "./weather.css";

type WeatherState = {
  cond: Condition;
  isDay: boolean;
  live: KLWeather | null;
  // true until the first reading (or cache) arrives; the hero shows neutral copy meanwhile
  pending: boolean;
  simulated: boolean;
};

const WeatherCtx = createContext<WeatherState | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useWeather = () => useContext(WeatherCtx)!;

function override() {
  const p = new URLSearchParams(window.location.search);
  const wx = p.get("wx") as Condition | null;
  const tod = p.get("tod");
  return {
    cond: wx && CONDITIONS.includes(wx) ? wx : null,
    isDay: tod === "day" ? true : tod === "night" ? false : null,
  };
}

// Without a reading, fall back to the KL clock for day/night.
function klDaytime() {
  const h = Number(new Date().toLocaleString("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", hour12: false }));
  return h >= 7 && h < 19;
}

export function WeatherProvider({ children }: { children: React.ReactNode }) {
  const { data: live, error } = useKLWeather();
  const [forced] = useState(override);

  const cond = forced.cond ?? (live ? classify(live.code, live.aqi) : "cloudy");
  const isDay = forced.isDay ?? live?.isDay ?? klDaytime();
  const pending = !live && !error && forced.cond == null;

  const applied = useRef<string[]>([]);
  useLayoutEffect(() => {
    const root = document.documentElement;
    applied.current.forEach((k) => root.style.removeProperty(k));
    const tokens = { ...paletteTokens(cond, isDay), ...MOODS[cond].tokens };
    Object.entries(tokens).forEach(([k, v]) => root.style.setProperty(k, v));
    applied.current = Object.keys(tokens);
    root.dataset.themeMode = PALETTES[cond][isDay ? "day" : "night"].mode;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", tokens["--color-bg"]);
  }, [cond, isDay]);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = MOOD_FONTS_URL;
    document.head.append(link);
    return () => link.remove();
  }, []);

  const value = useMemo(
    () => ({ cond, isDay, live, pending, simulated: forced.cond != null || forced.isDay != null }),
    [cond, isDay, live, pending, forced],
  );

  return (
    <WeatherCtx.Provider value={value}>
      <AtmosphereLayer cond={cond} isDay={isDay} />
      {children}
    </WeatherCtx.Provider>
  );
}
