// The four layers of "one person, both halves", bottom to top. Shared by the 3D and CSS stack options,
// and by the Stack list so hovering a row lights its layer.
export type LayerKey = "infra" | "data" | "api" | "ui";

export const LAYERS: { key: LayerKey; label: string; sub: string }[] = [
  { key: "infra", label: "INFRA", sub: "Docker · Kubernetes" },
  { key: "data", label: "DATA", sub: "PostgreSQL" },
  { key: "api", label: "API", sub: "Go" },
  { key: "ui", label: "INTERFACE", sub: "React · TypeScript · CSS" },
];

export const LAYER_OF: Record<string, LayerKey> = {
  React: "ui",
  TypeScript: "ui",
  "UI/UX & CSS": "ui",
  Go: "api",
  PostgreSQL: "data",
  "Docker & Kubernetes": "infra",
};
