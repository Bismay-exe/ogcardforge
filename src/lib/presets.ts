import type { CardConfig, ColorScheme, AdvancedOptions, FieldsGroup } from "@/lib/config-schema";

// ─────────────────────────────────────────────────────────────────────────────
// Preset types
// ─────────────────────────────────────────────────────────────────────────────

export type PresetTag = "dark" | "light" | "colorful";

export interface Preset {
  id: string;
  name: string;
  description: string;
  template: string;
  colors: ColorScheme;
  /** Style overrides merged into the applied config */
  advanced?: Partial<AdvancedOptions>;
  /** Optional field overrides */
  fields?: FieldsGroup;
  tag: PresetTag;
}

// ─────────────────────────────────────────────────────────────────────────────
// Curated presets (10 total, 2 per template)
// ─────────────────────────────────────────────────────────────────────────────

export const presets: Preset[] = [
  // ── modern ──
  {
    id: "midnight",
    name: "Midnight",
    description: "Deep dark with a cyan glow",
    template: "modern",
    tag: "dark",
    colors: {
      background: "#0f172a",
      accent: "#38bdf8",
      title: "#f8fafc",
      description: "#94a3b8",
    },
    advanced: { glow: true, radius: 16, shadow: "soft", padding: 24 },
  },
  {
    id: "ember",
    name: "Ember",
    description: "Warm amber glow",
    template: "modern",
    tag: "dark",
    colors: {
      background: "#2a0a00",
      accent: "#f97316",
      title: "#fff7ed",
      description: "#fdba74",
    },
    advanced: { glow: true, radius: 16, shadow: "soft", padding: 24 },
  },

  // ── glass ──
  {
    id: "ocean",
    name: "Ocean",
    description: "Deep sea glassmorphism",
    template: "glass",
    tag: "dark",
    colors: {
      background: "#0a0a1a",
      accent: "#22d3ee",
      title: "#ecfeff",
      description: "#67e8f9",
    },
    advanced: { glow: true, radius: 20, opacity: 0.75, shadow: "soft", padding: 24 },
  },
  {
    id: "nebula",
    name: "Nebula",
    description: "Purple cosmic glow",
    template: "glass",
    tag: "colorful",
    colors: {
      background: "#0a0a1a",
      accent: "#c084fc",
      title: "#faf5ff",
      description: "#e9d5ff",
    },
    advanced: { glow: true, radius: 20, opacity: 0.7, shadow: "soft", padding: 24 },
  },

  // ── minimal ──
  {
    id: "clean",
    name: "Clean",
    description: "Pure minimal white",
    template: "minimal",
    tag: "light",
    colors: {
      background: "#ffffff",
      accent: "#2563eb",
      title: "#0f172a",
      description: "#475569",
    },
    advanced: { glow: false, radius: 0, shadow: "none", padding: 32, alignment: "left" },
  },
  {
    id: "parchment",
    name: "Parchment",
    description: "Warm paper tones",
    template: "minimal",
    tag: "light",
    colors: {
      background: "#faf3e0",
      accent: "#b9641a",
      title: "#3d2900",
      description: "#8a7a50",
    },
    advanced: { glow: false, radius: 4, shadow: "none", padding: 28, alignment: "left" },
  },

  // ── terminal ──
  {
    id: "matrix",
    name: "Matrix",
    description: "Classic hacker green",
    template: "terminal",
    tag: "dark",
    colors: {
      background: "#000000",
      accent: "#22c55e",
      title: "#4ade80",
      description: "#86efac",
    },
    advanced: { glow: false, radius: 8, shadow: "none", padding: 20 },
  },
  {
    id: "amber",
    name: "Amber",
    description: "Vintage CRT amber",
    template: "terminal",
    tag: "dark",
    colors: {
      background: "#0c0a00",
      accent: "#f59e0b",
      title: "#fbbf24",
      description: "#fde68a",
    },
    advanced: { glow: false, radius: 8, shadow: "none", padding: 20 },
  },

  // ── github ──
  {
    id: "dev-dark",
    name: "Dev Dark",
    description: "GitHub-inspired dark",
    template: "github",
    tag: "dark",
    colors: {
      background: "#0d1117",
      accent: "#58a6ff",
      title: "#e6edf3",
      description: "#7d8590",
    },
    advanced: { glow: false, radius: 6, shadow: "none", padding: 24 },
  },
  {
    id: "classic",
    name: "Classic",
    description: "GitHub-inspired light",
    template: "github",
    tag: "light",
    colors: {
      background: "#ffffff",
      accent: "#0969da",
      title: "#1f2328",
      description: "#656d76",
    },
    advanced: { glow: false, radius: 6, shadow: "none", padding: 24 },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Apply a preset to a CardConfig
// ─────────────────────────────────────────────────────────────────────────────

export function applyPreset(config: CardConfig, preset: Preset): CardConfig {
  return {
    ...config,
    template: preset.template,
    colors: { ...preset.colors },
    advanced: {
      ...config.advanced,
      ...preset.advanced,
    },
    fields: preset.fields ? { ...config.fields, ...preset.fields } : config.fields,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getPresetById(id: string): Preset | undefined {
  return presets.find((p) => p.id === id);
}

export function getPresetsByTag(tag: PresetTag): Preset[] {
  return presets.filter((p) => p.tag === tag);
}
