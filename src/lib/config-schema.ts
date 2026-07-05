import * as z from "zod/v4";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type CardType = "profile" | "repo";
export type Size = "compact" | "standard" | "hero";
export type Shadow = "none" | "soft" | "hard";
export type Alignment = "left" | "center";
export type AvatarPosition = "top" | "inline";

export interface ColorScheme {
  background: string;
  accent: string;
  title: string;
  description: string;
}

export interface RepositoryFields {
  description?: boolean;
  topics?: boolean;
  homepage?: boolean;
}

export interface OwnerFields {
  avatar?: boolean;
}

export interface StatsFields {
  stars?: boolean;
  forks?: boolean;
  issues?: boolean;
}

export interface MetadataFields {
  license?: boolean;
  lastUpdated?: boolean;
  archived?: boolean;
}

export interface FieldsGroup {
  repository?: RepositoryFields;
  owner?: OwnerFields;
  stats?: StatsFields;
  metadata?: MetadataFields;
}

export interface AdvancedOptions {
  radius?: number;
  shadow?: Shadow;
  glow?: boolean;
  opacity?: number;
  padding?: number;
  alignment?: Alignment;
  avatarPosition?: AvatarPosition;
}

export interface CardConfig {
  cardType: CardType;
  template: string;
  size: Size;
  font: string;
  colors: ColorScheme;
  repo?: { owner: string; name: string };
  fields?: FieldsGroup;
  advanced?: AdvancedOptions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Zod Schemas
// ─────────────────────────────────────────────────────────────────────────────

const ColorSchemeSchema = z.object({
  background: z.string().default("#0ea5e9"),
  accent: z.string().default("#0284c7"),
  title: z.string().default("#ffffff"),
  description: z.string().default("#e2e8f0"),
});

const RepositoryFieldsSchema = z.object({
  description: z.boolean().optional(),
  topics: z.boolean().optional(),
  homepage: z.boolean().optional(),
});

const OwnerFieldsSchema = z.object({
  avatar: z.boolean().optional(),
});

const StatsFieldsSchema = z.object({
  stars: z.boolean().optional(),
  forks: z.boolean().optional(),
  issues: z.boolean().optional(),
});

const MetadataFieldsSchema = z.object({
  license: z.boolean().optional(),
  lastUpdated: z.boolean().optional(),
  archived: z.boolean().optional(),
});

const FieldsGroupSchema = z.object({
  repository: RepositoryFieldsSchema.optional(),
  owner: OwnerFieldsSchema.optional(),
  stats: StatsFieldsSchema.optional(),
  metadata: MetadataFieldsSchema.optional(),
});

const AdvancedOptionsSchema = z.object({
  radius: z.number().int().min(0).max(64).optional(),
  shadow: z.enum(["none", "soft", "hard"]).default("soft"),
  glow: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  padding: z.number().int().min(8).max(64).default(24),
  alignment: z.enum(["left", "center"]).default("left"),
  avatarPosition: z.enum(["top", "inline"]).default("inline"),
});

const RepoConfigSchema = z.object({
  owner: z.string().min(1, "Owner is required"),
  name: z.string().optional().default(""),
});

export const CardConfigSchema = z.object({
  cardType: z.enum(["profile", "repo"]).default("repo"),
  template: z.string().min(1, "Template is required").default("modern"),
  size: z.enum(["compact", "standard", "hero"]).default("standard"),
  font: z.string().default("inter"),
  colors: ColorSchemeSchema.default({
    background: "#0ea5e9",
    accent: "#0284c7",
    title: "#ffffff",
    description: "#e2e8f0",
  }),
  repo: RepoConfigSchema.optional(),
  fields: FieldsGroupSchema.optional(),
  advanced: AdvancedOptionsSchema.optional(),
});

// Type inference
export type CardConfigSchema = z.infer<typeof CardConfigSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Serialization: Query Params ⇄ Config
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Flattens a CardConfig into URL-friendly query params.
 * Example: { template: "glass", showStars: true, radius: 16 }
 */
export function configToQueryParams(config: CardConfig): URLSearchParams {
  const params = new URLSearchParams();

  params.set("template", config.template);
  params.set("size", config.size);
  params.set("font", config.font);

  // Colors
  params.set("bg", config.colors.background);
  params.set("accent", config.colors.accent);
  params.set("title", config.colors.title);
  params.set("desc", config.colors.description);

  // Repo (only for repo cards)
  if (config.repo) {
    params.set("owner", config.repo.owner);
    params.set("repo", config.repo.name);
  }

  // Fields (flatten to showX=true convention)
  if (config.fields) {
    if (config.fields.stats?.stars) params.set("showStars", "true");
    if (config.fields.stats?.forks) params.set("showForks", "true");
    if (config.fields.stats?.issues) params.set("showIssues", "true");
    if (config.fields.repository?.description) params.set("showDescription", "true");
    if (config.fields.repository?.topics) params.set("showTopics", "true");
    if (config.fields.repository?.homepage) params.set("showHomepage", "true");
    if (config.fields.owner?.avatar) params.set("showAvatar", "true");
    if (config.fields.metadata?.license) params.set("showLicense", "true");
    if (config.fields.metadata?.lastUpdated) params.set("showLastUpdated", "true");
    if (config.fields.metadata?.archived) params.set("showArchived", "true");
  }

  // Advanced
  if (config.advanced) {
    if (config.advanced.radius) params.set("radius", String(config.advanced.radius));
    if (config.advanced.shadow && config.advanced.shadow !== "soft")
      params.set("shadow", config.advanced.shadow);
    if (config.advanced.glow) params.set("glow", "true");
    if (config.advanced.opacity !== undefined && config.advanced.opacity !== 1)
      params.set("opacity", String(config.advanced.opacity));
    if (config.advanced.padding && config.advanced.padding !== 24)
      params.set("padding", String(config.advanced.padding));
    if (config.advanced.alignment && config.advanced.alignment !== "left")
      params.set("alignment", config.advanced.alignment);
    if (config.advanced.avatarPosition && config.advanced.avatarPosition !== "inline")
      params.set("avatarPosition", config.advanced.avatarPosition);
  }

  return params;
}

/**
 * Parses query params into a CardConfig.
 * Handles both the flattened "showX" convention and explicit nested structure.
 */
export function queryParamsToConfig(
  searchParams: URLSearchParams | Record<string, string>,
): CardConfig {
  const params =
    searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams);

  const config: Partial<CardConfig> = {
    template: params.get("template") ?? "modern",
    size: (params.get("size") as Size) ?? "standard",
    font: params.get("font") ?? "inter",
    colors: {
      background: params.get("bg") ?? "#0ea5e9",
      accent: params.get("accent") ?? "#0284c7",
      title: params.get("title") ?? "#ffffff",
      description: params.get("desc") ?? "#e2e8f0",
    },
  };

  // Repo
  const owner = params.get("owner");
  const repo = params.get("repo");
  if (owner && repo) {
    config.repo = { owner, name: repo };
    config.cardType = "repo";
  } else if (params.get("username")) {
    // Profile mode via username
    config.cardType = "profile";
  }

  // Fields (from showX flags)
  const fields: FieldsGroup = {};
  if (params.get("showStars") === "true") {
    fields.stats = { ...fields.stats, stars: true };
  }
  if (params.get("showForks") === "true") {
    fields.stats = { ...fields.stats, forks: true };
  }
  if (params.get("showIssues") === "true") {
    fields.stats = { ...fields.stats, issues: true };
  }
  if (params.get("showDescription") === "true") {
    fields.repository = { ...fields.repository, description: true };
  }
  if (params.get("showTopics") === "true") {
    fields.repository = { ...fields.repository, topics: true };
  }
  if (params.get("showHomepage") === "true") {
    fields.repository = { ...fields.repository, homepage: true };
  }
  if (params.get("showAvatar") === "true") {
    fields.owner = { ...fields.owner, avatar: true };
  }
  if (params.get("showLicense") === "true") {
    fields.metadata = { ...fields.metadata, license: true };
  }
  if (params.get("showLastUpdated") === "true") {
    fields.metadata = { ...fields.metadata, lastUpdated: true };
  }
  if (params.get("showArchived") === "true") {
    fields.metadata = { ...fields.metadata, archived: true };
  }
  if (Object.keys(fields).length > 0) {
    config.fields = fields;
  }

  // Advanced
  const advanced: AdvancedOptions = {};
  const radius = params.get("radius");
  if (radius) advanced.radius = Number.parseInt(radius, 10);
  const shadow = params.get("shadow") as Shadow | null;
  if (shadow) advanced.shadow = shadow;
  if (params.get("glow") === "true") advanced.glow = true;
  const opacity = params.get("opacity");
  if (opacity) advanced.opacity = Number.parseFloat(opacity);
  const padding = params.get("padding");
  if (padding) advanced.padding = Number.parseInt(padding, 10);
  const alignment = params.get("alignment") as Alignment | null;
  if (alignment) advanced.alignment = alignment;
  const avatarPos = params.get("avatarPosition") as AvatarPosition | null;
  if (avatarPos) advanced.avatarPosition = avatarPos;
  if (Object.keys(advanced).length > 0) {
    config.advanced = advanced;
  }

  return config as CardConfig;
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON Serialization
// ─────────────────────────────────────────────────────────────────────────────

export function configToJSON(config: CardConfig, pretty = true): string {
  return pretty
    ? JSON.stringify(config, null, 2)
    : JSON.stringify(config);
}

export function jsonToConfig(json: string): CardConfig {
  const parsed = JSON.parse(json);
  return CardConfigSchema.parse(parsed);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function validateConfig(input: unknown): {
  success: true;
  config: CardConfig;
} | {
  success: false;
  errors: Array<{ path: string; message: string }>;
} {
  const result = CardConfigSchema.safeParse(input);
  if (result.success) {
    return { success: true, config: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}