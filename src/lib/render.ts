import * as React from "react";
import * as path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { registry } from "@/lib/templates/registry";
import { loadFonts } from "@/lib/fonts";
import { UnknownTemplateError, type GitHubData } from "@/lib/templates/types";
import type { CardConfig, Size } from "@/lib/config-schema";

export interface RenderOptions {
  width?: number;
  height?: number;
  /** When true, response is PNG (Buffer); otherwise SVG (string) */
  format?: "svg" | "png";
}

const SIZE_DIMS: Record<Size, { width: number; height: number }> = {
  compact: { width: 500, height: 200 },
  standard: { width: 600, height: 200 },
  hero: { width: 800, height: 280 },
};

export function getSizeDimensions(size: Size) {
  return SIZE_DIMS[size] ?? SIZE_DIMS.standard;
}

const FONT_DIR = path.join(process.cwd(), "public", "fonts");

/**
 * Render a CardConfig + GitHubData into SVG (string) or PNG (Buffer).
 * Uses the template plugin registry's active template.
 */
export async function renderCard(
  config: CardConfig,
  data: GitHubData,
  opts: RenderOptions = {},
): Promise<{ svg: string; format: "svg" | "png"; png?: Buffer }> {
  const template = registry.get(config.template);
  if (!template) throw new UnknownTemplateError(config.template);

  const dims = getSizeDimensions(config.size);

  const fonts = await loadFonts();
  const satoriFonts = fonts.map((f) => ({
    name: f.name,
    weight: f.weight,
    data: f.data,
  }));

  const element = template.renderer(config, data, dims);

  const svg = await satori(element as React.ReactElement, {
    width: opts.width ?? dims.width,
    height: opts.height ?? dims.height,
    fonts: satoriFonts,
  });

  if (opts.format === "png") {
    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: opts.width ?? dims.width },
      font: {
        fontFiles: [
          path.join(FONT_DIR, "Inter-Regular.ttf"),
          path.join(FONT_DIR, "Inter-Medium.ttf"),
          path.join(FONT_DIR, "Inter-SemiBold.ttf"),
          path.join(FONT_DIR, "Inter-Bold.ttf"),
        ],
        loadSystemFonts: false,
      },
    });
    const png = resvg.render().asPng();
    return { svg, format: "png", png };
  }

  return { svg, format: "svg" };
}
