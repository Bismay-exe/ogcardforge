import { NextRequest, NextResponse } from "next/server";
import { Resvg } from "@resvg/resvg-js";
import { CardConfig, queryParamsToConfig, validateConfig } from "@/lib/config-schema";
import { cache } from "@/lib/cache";
import { fetchRepo, GitHubError, type GithubRepoResponse } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function escXml(str: string): string {
  return str.replace(/&/g, ('&' + 'amp;')).replace(/</g, ('<' + 'lt;')).replace(/>/g, ('>' + 'gt;'));
}

function renderCard(config: CardConfig, data?: GithubRepoResponse): string {
  const { size } = config;
  const widths: Record<string, number> = { compact: 500, standard: 600, hero: 800 };
  const height = size === "hero" ? 280 : 200;
  const width = widths[size] || 600;
  const radius = config.advanced?.radius ?? 16;

  const repoName = data?.full_name ?? (config.repo ? `${config.repo.owner}/${config.repo.name}` : "Unknown Repo");
  const stars = data?.stargazers_count ?? 0;
  const forks = data?.forks_count ?? 0;
  const description = data?.description ?? "No description available.";
  const topics = data?.topics ?? [];
  const showStars = config.fields?.stats?.stars !== false;
  const showTopics = config.fields?.repository?.topics;

  const starsStr = stars >= 1000 ? `${(stars / 1000).toFixed(1)}k` : String(stars);
  const forksStr = forks >= 1000 ? `${(forks / 1000).toFixed(1)}k` : String(forks);

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
  <text x="24" y="52" font-family="system-ui, sans-serif" font-size="${size === "hero" ? 22 : 18}" font-weight="700" fill="${config.colors.title}">${escXml(repoName)}</text>
  <text x="24" y="78" font-family="system-ui, sans-serif" font-size="13" fill="${config.colors.description}">${escXml(description.length > 80 ? description.slice(0, 80) + "\u2026" : description)}</text>
  ${showTopics && topics.length > 0 ? `<text x="24" y="100" font-family="system-ui, sans-serif" font-size="11" fill="${config.colors.accent}">${escXml(topics.slice(0, 4).join(" \u00b7 "))}</text>` : ""}
  <text x="24" y="${height - 24}" font-family="system-ui, sans-serif" font-size="13" fill="${config.colors.description}">
    ${showStars ? `<tspan fill="${config.colors.title}">\u2605 ${starsStr}</tspan>  <tspan fill="${config.colors.description}">\u2b24 ${forksStr}</tspan>` : `<tspan fill="${config.colors.title}">OG Card</tspan>`}
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
  const config = queryParamsToConfig(searchParams);
  const validation = validateConfig(config);

  if (!validation.success) return errorResponse("Invalid configuration", validation.errors);
  if (!config.repo?.owner || !config.repo?.name) {
    return errorResponse("owner and repo query params are required", [
      { path: "repo", message: "Provide ?owner=username&repo=repo-name" },
    ]);
  }

  const cacheBefore = cache.stats();
  let githubData: GithubRepoResponse | null = null;
  let fetchError: string | null = null;

  try {
    githubData = await fetchRepo(config.repo.owner, config.repo.name);
  } catch (err) {
    fetchError = err instanceof GitHubError ? err.message : String(err);
  }

  const cacheAfter = cache.stats();
  const cacheHit = cacheAfter.hits > cacheBefore.hits;

  if (searchParams.get("debug") === "json") {
    return NextResponse.json(
      {
        config: validation.config,
        githubData,
        fetchError,
        cache: { hit: cacheHit, stats: cacheAfter },
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Cache": cacheHit ? "HIT" : "MISS" } },
    );
  }

  const svg = renderCard(validation.config, githubData ?? undefined);
  const format = searchParams.get("format") ?? "svg";

  if (format === "png") {
    try {
      return imageResponse(await svgToPng(svg), "image/png");
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

  const validation = validateConfig(body);
  if (!validation.success) return errorResponse("Invalid configuration", validation.errors);

  const svg = renderCard(validation.config);
  const format = request.nextUrl.searchParams.get("format") ?? "svg";

  if (format === "png") {
    try {
      return imageResponse(await svgToPng(svg), "image/png");
    } catch {
      return errorResponse("Failed to render PNG");
    }
  }

  return imageResponse(svg, "image/svg+xml; charset=utf-8");
}