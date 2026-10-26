// One palette per KL weather mood × day/night, plus per-mood heading typography and corner radius.
// Every value overrides a Nocturne token, so components only ever read var(--color-*) and friends.
import type { Condition } from "./useKLWeather";

type Spec = {
  label: string; // Malay name, shown in the switcher
  mode: "dark" | "light";
  bg: string;
  surface: string;
  text: string;
  hue: number; // neutral tint hue
  accent: [l: number, c: number, h: number];
  accent2: [l: number, c: number, h: number];
  section: string;
  glow: string;
};

const ok = (l: number, c: number, h: number) => `oklch(${l} ${c} ${h})`;

export const PALETTES: Record<Condition, { day: Spec; night: Spec }> = {
  clear: {
    day: {
      label: "Terik · blazing sun",
      mode: "light",
      bg: ok(0.97, 0.025, 85),
      surface: ok(0.995, 0.012, 85),
      text: ok(0.22, 0.03, 50),
      hue: 70,
      accent: [0.6, 0.18, 42],
      accent2: [0.62, 0.15, 20],
      section: ok(0.9, 0.07, 78),
      glow: ok(0.95, 0.11, 95),
    },
    night: {
      label: "Malam cerah · clear night",
      mode: "dark",
      bg: ok(0.18, 0.045, 268),
      surface: ok(0.23, 0.045, 268),
      text: ok(0.94, 0.01, 90),
      hue: 268,
      accent: [0.84, 0.12, 88],
      accent2: [0.78, 0.08, 250],
      section: ok(0.25, 0.075, 272),
      glow: ok(0.33, 0.1, 275),
    },
  },
  cloudy: {
    day: {
      label: "Mendung · overcast",
      mode: "light",
      bg: ok(0.93, 0.012, 240),
      surface: ok(0.965, 0.008, 240),
      text: ok(0.24, 0.02, 250),
      hue: 240,
      accent: [0.5, 0.1, 238],
      accent2: [0.55, 0.06, 200],
      section: ok(0.86, 0.025, 238),
      glow: ok(0.92, 0.035, 220),
    },
    night: {
      label: "Mendung malam · cloudy night",
      mode: "dark",
      bg: ok(0.2, 0.012, 240),
      surface: ok(0.25, 0.012, 240),
      text: ok(0.92, 0.008, 240),
      hue: 240,
      accent: [0.78, 0.08, 195],
      accent2: [0.72, 0.05, 240],
      section: ok(0.26, 0.025, 225),
      glow: ok(0.33, 0.04, 210),
    },
  },
  rain: {
    day: {
      label: "Hujan · rain",
      mode: "dark",
      bg: ok(0.25, 0.035, 175),
      surface: ok(0.3, 0.035, 175),
      text: ok(0.95, 0.015, 160),
      hue: 175,
      accent: [0.83, 0.13, 158],
      accent2: [0.78, 0.08, 200],
      section: ok(0.31, 0.055, 185),
      glow: ok(0.4, 0.08, 170),
    },
    night: {
      label: "Hujan malam · night rain",
      mode: "dark",
      bg: ok(0.165, 0.03, 210),
      surface: ok(0.21, 0.03, 210),
      text: ok(0.93, 0.01, 200),
      hue: 210,
      accent: [0.8, 0.11, 185],
      accent2: [0.72, 0.08, 230],
      section: ok(0.22, 0.05, 215),
      glow: ok(0.3, 0.08, 200),
    },
  },
  storm: {
    day: {
      label: "Ribut petir · thunderstorm",
      mode: "dark",
      bg: ok(0.22, 0.04, 290),
      surface: ok(0.27, 0.045, 290),
      text: ok(0.95, 0.01, 290),
      hue: 290,
      accent: [0.9, 0.18, 105],
      accent2: [0.7, 0.16, 300],
      section: ok(0.27, 0.08, 292),
      glow: ok(0.37, 0.13, 300),
    },
    night: {
      label: "Ribut malam · night storm",
      mode: "dark",
      bg: ok(0.15, 0.04, 285),
      surface: ok(0.2, 0.045, 285),
      text: ok(0.94, 0.01, 285),
      hue: 285,
      accent: [0.9, 0.17, 105],
      accent2: [0.68, 0.17, 305],
      section: ok(0.21, 0.08, 290),
      glow: ok(0.32, 0.14, 300),
    },
  },
  haze: {
    day: {
      label: "Jerebu · haze",
      mode: "light",
      bg: ok(0.84, 0.04, 72),
      surface: ok(0.88, 0.035, 72),
      text: ok(0.28, 0.035, 55),
      hue: 65,
      accent: [0.5, 0.11, 48],
      accent2: [0.52, 0.07, 80],
      section: ok(0.78, 0.055, 65),
      glow: ok(0.86, 0.07, 80),
    },
    night: {
      label: "Jerebu malam · night haze",
      mode: "dark",
      bg: ok(0.22, 0.025, 60),
      surface: ok(0.27, 0.025, 60),
      text: ok(0.88, 0.025, 75),
      hue: 60,
      accent: [0.74, 0.11, 62],
      accent2: [0.68, 0.06, 40],
      section: ok(0.27, 0.035, 55),
      glow: ok(0.34, 0.06, 60),
    },
  },
};

// 100 → 900. Dark themes: light-to-dark (tokens like neutral-400 are muted text on a dark bg).
// Light themes flip the ramp so the same tokens stay readable on a light bg.
const L_DARK = [0.97, 0.92, 0.86, 0.77, 0.67, 0.56, 0.46, 0.36, 0.27];
const L_LIGHT = [0.22, 0.3, 0.38, 0.46, 0.55, 0.66, 0.76, 0.86, 0.93];
const C_SHAPE = [0.15, 0.3, 0.55, 0.85, 1, 0.95, 0.8, 0.6, 0.45];

function ramp(name: string, h: number, c: number, mode: Spec["mode"]) {
  const ls = mode === "dark" ? L_DARK : L_LIGHT;
  const out: Record<string, string> = {};
  ls.forEach((l, i) => (out[`--color-${name}-${(i + 1) * 100}`] = ok(l, +(c * C_SHAPE[i]).toFixed(3), h)));
  return out;
}

export function paletteTokens(cond: Condition, isDay: boolean): Record<string, string> {
  const p = PALETTES[cond][isDay ? "day" : "night"];
  return {
    "--color-bg": p.bg,
    "--color-surface": p.surface,
    "--color-text": p.text,
    "--color-accent": ok(...p.accent),
    "--color-accent-2": ok(...p.accent2),
    "--color-divider": `color-mix(in oklch, ${p.text} 16%, transparent)`,
    "--color-section": p.section,
    "--color-section-glow": p.glow,
    ...ramp("neutral", p.hue, 0.025, p.mode),
    ...ramp("accent", p.accent[2], p.accent[1], p.mode),
    ...ramp("accent-2", p.accent2[2], p.accent2[1], p.mode),
    "--shadow-sm": "0 0 0 1px var(--color-neutral-800)",
    "--shadow-md": `0 0 0 1px var(--color-neutral-700), 0 6px 18px rgba(0,0,0,${p.mode === "dark" ? 0.55 : 0.12})`,
    "--shadow-lg": `0 0 0 1px var(--color-neutral-500), 0 16px 40px rgba(0,0,0,${p.mode === "dark" ? 0.65 : 0.18})`,
  };
}

// Weather changes the shape of the design too: heading typeface, weight, and corner radius.
export const MOODS: Record<Condition, { tokens: Record<string, string> }> = {
  clear: {
    tokens: {
      "--font-heading": "'Fraunces', Georgia, serif",
      "--font-heading-weight": "600",
      "--radius-sm": "10px",
      "--radius-md": "18px",
      "--radius-lg": "28px",
    },
  },
  cloudy: {
    tokens: {
      "--font-heading": "'DM Sans', system-ui, sans-serif",
      "--font-heading-weight": "500",
      "--radius-sm": "6px",
      "--radius-md": "12px",
      "--radius-lg": "18px",
    },
  },
  rain: {
    tokens: {
      "--font-heading": "'Bricolage Grotesque', system-ui, sans-serif",
      "--font-heading-weight": "600",
      "--radius-sm": "12px",
      "--radius-md": "20px",
      "--radius-lg": "32px",
    },
  },
  storm: {
    tokens: {
      "--font-heading": "'Space Grotesk', system-ui, sans-serif",
      "--font-heading-weight": "700",
      "--radius-sm": "0px",
      "--radius-md": "0px",
      "--radius-lg": "0px",
    },
  },
  haze: {
    tokens: {
      "--font-heading": "'IBM Plex Mono', ui-monospace, monospace",
      "--font-heading-weight": "500",
      "--radius-sm": "2px",
      "--radius-md": "4px",
      "--radius-lg": "6px",
    },
  },
};

export const MOOD_FONTS_URL =
  "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=DM+Sans:wght@400;500;600&family=Bricolage+Grotesque:wght@400;600&family=Space+Grotesk:wght@400;500;700&family=IBM+Plex+Mono:wght@400;500&display=swap";
