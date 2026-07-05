import { NextRequest, NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { CardConfig, queryParamsToConfig, validateConfig } from "@/lib/config-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function renderPlaceholder(config: CardConfig): string {
  const { template, size } = config;
  const widths: Record<string, number> = { compact: 500, standard: 600, hero: 800 };
  const height = size === "hero" ? 280 : 200;
  const width = widths[size] || 600;
  const username = config.repo?.owner || "You";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${config.colors.accent}"/>
      <stop offset="100%" stop-color="${config.colors.background}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${config.advanced?.radius ?? 16}" fill="url(#g)"/>
  <text x="${width / 2}" y="${height / 2 - 10}" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-size="${size === "hero" ? 36 : 28}" font-weight="700" fill="${config.colors.title}">
    @${username}
  </text>
  <text x="${width / 2}" y="${height / 2 + 25}" dominant-baseline="middle" text-anchor="middle"
        font-family="system-ui, sans-serif" font-size="${size === "hero" ? 18 : 14}" fill="${config.colors.description}">
    Profile Card · Template: ${template}
  </text>
</svg>`;
}

async function svgToPng(svg: string): Promise<Buffer> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: {
      fontFiles: [],
      loadSystemFonts: false,
    },
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

function imageResponse(body: Buffer | string, contentType: string): NextResponse {
  return new NextResponse(body as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}

function errorResponse(
  message: string,
  errors?: Array<{ path: string; message: string }>,
): NextResponse {
  return NextResponse.json({ error: message, details: errors ?? [] }, {
    status: 400,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const raw = queryParamsToConfig(searchParams);
  const config: Partial<CardConfig> = { ...raw, cardType: "profile" };

  if (!config.repo?.owner && !searchParams.get("username")) {
    return errorResponse("username or owner query param is required for profile cards", [{
      path: "owner",
      message: "Provide ?username=yourname or ?owner=yourname",
    }]);
  }

  // Canonicalize: map username or owner -> repo.owner for unified lookup
  if (!config.repo) {
    config.repo = { owner: searchParams.get("username") ?? "", name: "" };
  }

  // Merge owner param if provided
  const owner = searchParams.get("owner");
  if (owner) config.repo.owner = owner;

  const validation = validateConfig(config);
  if (!validation.success) {
    return errorResponse("Invalid configuration", validation.errors);
  }

  const svg = renderPlaceholder(validation.config);
  const format = searchParams.get("format") ?? "svg";

  if (format === "png") {
    try {
      const png = await svgToPng(svg);
      return imageResponse(png, "image/png");
    } catch {
      return errorResponse("Failed to render PNG");
    }
  }

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Failed to parse request body as JSON");
  }

  const config: Partial<CardConfig> = { ...(body as CardConfig), cardType: "profile" };
  const validation = validateConfig(config);

  if (!validation.success) {
    return errorResponse("Invalid configuration", validation.errors);
  }

  const svg = renderPlaceholder(validation.config);
  const format = request.nextUrl.searchParams.get("format") ?? "svg";

  if (format === "png") {
    try {
      const png = await svgToPng(svg);
      return imageResponse(png, "image/png");
    } catch {
      return errorResponse("Failed to render PNG");
    }
  }

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}