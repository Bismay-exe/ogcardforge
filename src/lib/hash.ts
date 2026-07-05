import { createHash } from "node:crypto";
import type { CardConfig } from "@/lib/config-schema";
import type { GitHubData } from "@/lib/templates/types";

function stableJson(v: unknown): string {
  return JSON.stringify(v, Object.keys(v as object).sort());
}

export function hashConfig(
  config: CardConfig,
  data: GitHubData,
  format: "svg" | "png",
): string {
  const payload = stableJson({ config, data, format });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}