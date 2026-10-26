// Live Kuala Lumpur weather from Open-Meteo. Free, no API key, CORS-enabled.
// The last reading is cached in localStorage so returning visitors don't see the theme switch after load.
import { useEffect, useState } from "react";

const KL = "latitude=3.139&longitude=101.6869&timezone=Asia%2FKuala_Lumpur";
const WEATHER_URL =
  `https://api.open-meteo.com/v1/forecast?${KL}` +
  "&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,is_day,cloud_cover,precipitation,wind_speed_10m" +
  "&hourly=temperature_2m,weather_code,is_day&forecast_hours=8";
const AIR_URL = `https://air-quality-api.open-meteo.com/v1/air-quality?${KL}&current=us_aqi,pm2_5`;

export type Condition = "clear" | "cloudy" | "rain" | "storm" | "haze";

export type KLWeather = {
  time: string;
  temp: number;
  feelsLike: number;
  humidity: number;
  code: number;
  isDay: boolean;
  cloudCover: number;
  precipitation: number;
  wind: number;
  aqi: number | null;
  pm25: number | null;
  hourly: { time: string; temp: number; code: number; isDay: boolean }[];
};

export const CONDITIONS: Condition[] = ["clear", "cloudy", "rain", "storm", "haze"];

// WMO weather codes → our five moods. Haze (jerebu) only wins when it isn't raining.
export function classify(code: number, aqi: number | null): Condition {
  if (code >= 95) return "storm";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if (aqi != null && aqi >= 100) return "haze";
  if (code <= 1) return "clear";
  return "cloudy";
}

export function describeCode(code: number): string {
  if (code === 0) return "clear sky";
  if (code <= 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog";
  if (code >= 51 && code <= 57) return "drizzle";
  if (code >= 61 && code <= 67) return "rain";
  if (code >= 80 && code <= 82) return "rain showers";
  if (code >= 95) return "thunderstorm";
  return `code ${code}`;
}

const CACHE_KEY = "kl-weather";
const CACHE_MAX_AGE = 60 * 60 * 1000;

function readCache(): KLWeather | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    return Date.now() - at < CACHE_MAX_AGE ? data : null;
  } catch {
    return null;
  }
}

function writeCache(data: KLWeather) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    // storage unavailable (private mode etc.): the cache is only a nicety
  }
}

export function useKLWeather() {
  const [data, setData] = useState<KLWeather | null>(readCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [w, a] = await Promise.all([
          fetch(WEATHER_URL).then((r) => r.json()),
          fetch(AIR_URL).then((r) => r.json()).catch(() => null),
        ]);
        if (!alive) return;
        const c = w.current;
        const next: KLWeather = {
          time: c.time,
          temp: c.temperature_2m,
          feelsLike: c.apparent_temperature,
          humidity: c.relative_humidity_2m,
          code: c.weather_code,
          isDay: c.is_day === 1,
          cloudCover: c.cloud_cover,
          precipitation: c.precipitation,
          wind: c.wind_speed_10m,
          aqi: a?.current?.us_aqi ?? null,
          pm25: a?.current?.pm2_5 ?? null,
          hourly: w.hourly.time.map((t: string, i: number) => ({
            time: t,
            temp: w.hourly.temperature_2m[i],
            code: w.hourly.weather_code[i],
            isDay: w.hourly.is_day[i] === 1,
          })),
        };
        setData(next);
        writeCache(next);
        setError(null);
      } catch (e) {
        if (alive) setError(String(e));
      }
    };
    load();
    const t = setInterval(load, 15 * 60 * 1000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return { data, error };
}
