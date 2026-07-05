import type { ReactNode } from "react";
import type { CardConfig } from "@/lib/config-schema";

/**
 * Normalized GitHub data shape passed to every template renderer.
 * Both repo cards and profile cards map their API responses into this
 * unified structure so templates don't need to branch on card type.
 */
export interface GitHubData {
  /** "repo" or "profile" */
  cardType: "repo" | "profile";
  /** GitHub login (owner for repo, username for profile) */
  owner: string;
  /** Avatar URL, when available */
  avatarUrl: string | null;
  /** Display name; falls back to owner/login */
  displayName: string;
  /** Human-readable description / bio */
  description: string;
  /** Homepage URL (repo only) */
  homepage?: string | null;
  /** Topic tags (repo only) */
  topics: string[];
  /** Numeric stats */
  stats: {
    stars?: number;
    forks?: number;
    openIssues?: number;
    followers?: number;
    following?: number;
    publicRepos?: number;
  };
  /** License and lifecycle metadata */
  metadata: {
    license?: string | null;
    lastUpdated?: string | null;
    archived?: boolean;
  };
}

export interface TemplateSafeArea {
  /** Maximum text content width inside the card */
  textMaxWidth: number;
  /** Optional illustration slot rect for decored templates (Phase 4 use) */
  illustrationSlot?: { x: number; y: number; width: number; height: number };
}

export type ControlSchema =
  | { key: "radius"; type: "slider"; min: number; max: number; step: number; default: number }
  | { key: "shadow"; type: "select"; options: Array<"none" | "soft" | "hard">; default: "none" | "soft" | "hard" }
  | { key: "glow"; type: "toggle"; default: boolean }
  | { key: "opacity"; type: "slider"; min: number; max: number; step: number; default: number }
  | { key: "padding"; type: "slider"; min: number; max: number; step: number; default: number }
  | { key: "alignment"; type: "select"; options: Array<"left" | "center">; default: "left" | "center" }
  | { key: "avatarPosition"; type: "select"; options: Array<"top" | "inline">; default: "top" | "inline" };

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Template {
  /** Unique template id, used in query params */
  id: string;
  /** Human-readable name */
  name: string;
  /** Default values applied when this template is selected */
  defaults: Partial<CardConfig>;
  /** Which advanced controls this template exposes in the builder UI */
  controls: ControlSchema[];
  /** Layout safe area constraints */
  safeArea: TemplateSafeArea;
  /**
   * Satori-compatible JSX renderer. Receives validated config and
   * normalized GitHub data. Must return a single top-level element.
   */
  renderer: (config: CardConfig, data: GitHubData, dimensions: { width: number; height: number }) => ReactNode;
}

export type TemplateId = string;

/** Errors thrown by the template registry lookups */
export class UnknownTemplateError extends Error {
  constructor(id: TemplateId) {
    super(`Unknown template: "${id}"`);
    this.name = "UnknownTemplateError";
  }
}
