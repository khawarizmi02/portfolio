// PROTOTYPE: 3D options per section, switchable from a floating panel (shown in dev, or anywhere with ?proto).
// Choices live in the URL (?work=&stack=&about=&contact=) so a specific combination can be shared.
// Weather can be previewed from the same panel; that reloads the page because the provider reads it once.
import { createContext, useContext, useEffect, useState } from "react";
import { CONDITIONS } from "../weather/useKLWeather";

export const SECTIONS = {
  work: {
    label: "Work",
    options: [
      ["off", "Off · current"],
      ["tilt", "A · Tilt cards (CSS)"],
      ["devices", "B · 3D laptop + phone"],
    ],
  },
  stack: {
    label: "Stack",
    options: [
      ["off", "Off · current"],
      ["explode", "A · Exploded layers"],
      ["trace", "B · Request trace"],
      ["css", "C · Isometric (CSS)"],
    ],
  },
  about: {
    label: "About",
    options: [
      ["off", "Off · current"],
      ["depth", "A · Depth card (CSS)"],
      ["rooftop", "B · Rooftop in the skyline"],
    ],
  },
  contact: {
    label: "Contact",
    options: [
      ["off", "Off · current"],
      ["panorama", "A · Skyline panorama"],
      ["flyover", "B · Fly-over on scroll"],
    ],
  },
} as const;

type Section = keyof typeof SECTIONS;
export type Choice<S extends Section> = (typeof SECTIONS)[S]["options"][number][0];
type Choices = { [S in Section]: Choice<S> };

const DEFAULTS: Choices = { work: "devices", stack: "explode", about: "rooftop", contact: "panorama" };

function readChoices(): Choices {
  const p = new URLSearchParams(window.location.search);
  const out = { ...DEFAULTS } as Record<Section, string>;
  (Object.keys(SECTIONS) as Section[]).forEach((s) => {
    const v = p.get(s);
    if (v && SECTIONS[s].options.some(([k]) => k === v)) out[s] = v;
  });
  return out as Choices;
}

const Ctx = createContext<Choices>(DEFAULTS);
// eslint-disable-next-line react-refresh/only-export-components
export const use3D = () => useContext(Ctx);

export function Options3D({ children }: { children: React.ReactNode }) {
  const [choices, setChoices] = useState(readChoices);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    (Object.keys(choices) as Section[]).forEach((s) => p.set(s, choices[s]));
    history.replaceState(null, "", `?${p}${window.location.hash}`);
  }, [choices]);

  const showPanel = import.meta.env.DEV || new URLSearchParams(window.location.search).has("proto");

  return (
    <Ctx.Provider value={choices}>
      {children}
      {showPanel && <Panel choices={choices} set={(s, v) => setChoices((c) => ({ ...c, [s]: v }))} />}
    </Ctx.Provider>
  );
}

function Panel({ choices, set }: { choices: Choices; set: (s: Section, v: string) => void }) {
  const [open, setOpen] = useState(true);
  const p = new URLSearchParams(window.location.search);
  const reloadWith = (k: string, v: string) => {
    if (v === "live") p.delete(k);
    else p.set(k, v);
    window.location.assign(`?${p}${window.location.hash}`);
  };
  const select: React.CSSProperties = {
    font: "inherit",
    fontSize: 12,
    padding: "4px 6px",
    borderRadius: 6,
    border: "1px solid var(--color-divider)",
    background: "var(--color-bg)",
    color: "var(--color-text)",
    minWidth: 0,
  };
  return (
    <div
      style={{
        position: "fixed",
        left: 16,
        bottom: 16,
        zIndex: 100,
        maxWidth: "calc(100vw - 32px)",
        background: "color-mix(in oklch, var(--color-surface) 92%, transparent)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--color-divider)",
        borderRadius: 12,
        boxShadow: "var(--shadow-lg)",
        fontSize: 12,
        fontFamily: "var(--font-body)",
        color: "var(--color-text)",
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          all: "unset",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          fontWeight: 600,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <i className="ph ph-cube" style={{ color: "var(--color-accent)", fontSize: 15 }} />
        3D options
        <i className={`ph ${open ? "ph-caret-down" : "ph-caret-up"}`} style={{ marginLeft: "auto" }} />
      </button>
      {open && (
        <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", gap: "6px 10px", padding: "0 12px 12px", alignItems: "center" }}>
          {(Object.keys(SECTIONS) as Section[]).map((s) => (
            <label key={s} style={{ display: "contents" }}>
              <a href={`#${s}`} style={{ color: "var(--color-neutral-400)", textDecoration: "none" }}>
                {SECTIONS[s].label}
              </a>
              <select style={select} value={choices[s]} onChange={(e) => set(s, e.target.value)}>
                {SECTIONS[s].options.map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <span style={{ gridColumn: "1 / -1", height: 1, background: "var(--color-divider)", margin: "4px 0" }} />
          <span style={{ color: "var(--color-neutral-400)" }}>Weather</span>
          <div style={{ display: "flex", gap: 6 }}>
            <select style={select} value={p.get("wx") ?? "live"} onChange={(e) => reloadWith("wx", e.target.value)}>
              <option value="live">Live</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select style={select} value={p.get("tod") ?? "live"} onChange={(e) => reloadWith("tod", e.target.value)}>
              <option value="live">Live</option>
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
