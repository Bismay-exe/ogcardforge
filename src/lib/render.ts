import * as React from "react";
import * as path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import { registry } from "@/lib/templates/registry";
import { loadFonts } from "@/lib/fonts";
import { hashConfig } from "@/lib/hash";
import { renderCache, type RenderedCacheEntry } from "@/lib/cache";
import { UnknownTemplateError, type GitHubData } from "@/lib/templates/types";
import type { CardConfig, Size } from "@/lib/config-schema";

export interface RenderOptions {
  width?: number;
  height?: number;
  format?: "svg" | "png";
}

export interface RenderResult {
  svg: string;
  format: "svg" | "png";
  png?: Buffer;
  cacheHit: boolean;
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

export async function renderCard(
  config: CardConfig,
  data: GitHubData,
  opts: RenderOptions = {},
): Promise<RenderResult> {
  const template = registry.get(config.template);
  if (!template) throw new UnknownTemplateError(config.template);

  const format = opts.format ?? "svg";
  const key = hashConfig(config, data, format);

  const cached = renderCache.get<RenderedCacheEntry>(key);
  if (cached) {
    return {
      svg: cached.svg,
      format,
      png: cached.png,
      cacheHit: true,
    };
  }

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

  let png: Buffer | undefined;
  if (format === "png") {
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
    png = resvg.render().asPng();
  }

  renderCache.set<RenderedCacheEntry>(key, { svg, png });

  return { svg, format, png, cacheHit: false };
}