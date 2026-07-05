import { NextRequest, NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { CardConfig, queryParamsToConfig, validateConfig } from "@/lib/config-schema";
import { cache } from "@/lib/cache";
import { fetchUser, GitHubError, type GithubUserResponse } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escXml(str: string): string {
  return str.replace(/&/g, ('&' + 'amp;')).replace(/</g, ('<' + 'lt;')).replace(/>/g, ('>' + 'gt;'));
}

function renderCard(config: CardConfig, userData?: GithubUserResponse): string {
  const { size } = config;
  const widths: Record<string, number> = { compact: 500, standard: 600, hero: 800 };
  const height = size === "hero" ? 280 : 200;
  const width = widths[size] || 600;
  const radius = config.advanced?.radius ?? 16;

  const username = userData?.login ?? config.repo?.owner ?? "unknown";
  const displayName = userData?.name ?? username;
  const bio = userData?.bio ?? "Developer on GitHub";
  const followers = userData?.followers ?? 0;
  const following = userData?.following ?? 0;
  const followersStr = followers >= 1000 ? `${(followers / 1000).toFixed(1)}k` : String(followers);
  const followingStr = following >= 1000 ? `${(following / 1000).toFixed(1)}k` : String(following);

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${config.colors.accent}"/>
      <stop offset="100%" stop-color="${config.colors.background}"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${config.colors.title}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${config.colors.title}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${radius}" fill="url(#bg)"/>
  <rect width="${width}" height="${Math.floor(height / 3)}" rx="${radius}" fill="url(#glow)"/>
  <text x="24" y="52" font-family="system-ui, sans-serif" font-size="${size === "hero" ? 22 : 18}" font-weight="700" fill="${config.colors.title}">@${escXml(username)}</text>
  ${displayName !== username ? `<text x="24" y="78" font-family="system-ui, sans-serif" font-size="13" fill="${config.colors.description}">${escXml(displayName)}</text>` : ""}
  <text x="24" y="${displayName !== username ? 100 : 78}" font-family="system-ui, sans-serif" font-size="13" fill="${config.colors.description}">${escXml(bio.length > 80 ? bio.slice(0, 80) + "\u2026" : bio)}</text>
  <text x="24" y="${height - 24}" font-family="system-ui, sans-serif" font-size="13" fill="${config.colors.description}">
    <tspan fill="${config.colors.title}">${followersStr}</tspan> followers  <tspan fill="${config.colors.description}">${followingStr}</tspan> following
  </text>
</svg>`;
}

async function svgToPng(svg: string): Promise<Buffer> {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
    font: { fontFiles: [], loadSystemFonts: false },
  });
  return resvg.render().asPng();
}

function imageResponse(body: Buffer | string, contentType: string, extraHeaders?: Record<string, string>): NextResponse {
  return new NextResponse(body as BodyInit, {
    status: 200,
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600", ...extraHeaders },
  });
}

function errorResponse(message: string, errors?: Array<{ path: string; message: string }>): NextResponse {
  return NextResponse.json({ error: message, details: errors ?? [] }, {
    status: 400,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const raw = queryParamsToConfig(searchParams);
  const config: Partial<CardConfig> = { ...raw, cardType: "profile" };

  const username = searchParams.get("username") ?? searchParams.get("owner") ?? config.repo?.owner;

  if (!username) {
    return errorResponse("username or owner query param is required for profile cards", [
      { path: "owner", message: "Provide ?username=yourname or ?owner=yourname" },
    ]);
  }

  if (!config.repo) config.repo = { owner: username, name: "" };

  const validation = validateConfig(config);
  if (!validation.success) return errorResponse("Invalid configuration", validation.errors);

  const cacheBefore = cache.stats();
  let userData: GithubUserResponse | null = null;
  let fetchError: string | null = null;

  try {
    userData = await fetchUser(username);
  } catch (err) {
    fetchError = err instanceof GitHubError ? err.message : String(err);
  }

  const cacheAfter = cache.stats();
  const cacheHit = cacheAfter.hits > cacheBefore.hits;

  if (searchParams.get("debug") === "json") {
    return NextResponse.json(
      { config: validation.config, githubData: userData, fetchError, cache: { hit: cacheHit, stats: cacheAfter } },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Cache": cacheHit ? "HIT" : "MISS" } },
    );
  }

  const svg = renderCard(validation.config, userData ?? undefined);
  const format = searchParams.get("format") ?? "svg";

  if (format === "png") {
    try { return imageResponse(await svgToPng(svg), "image/png"); }
    catch { return errorResponse("Failed to render PNG"); }
  }

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return errorResponse("Failed to parse request body as JSON"); }

  const validation = validateConfig({ ...(body as CardConfig), cardType: "profile" });
  if (!validation.success) return errorResponse("Invalid configuration", validation.errors);

  const svg = renderCard(validation.config);
  const format = request.nextUrl.searchParams.get("format") ?? "svg";

  if (format === "png") {
    try { return imageResponse(await svgToPng(svg), "image/png"); }
    catch { return errorResponse("Failed to render PNG"); }
  }

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}