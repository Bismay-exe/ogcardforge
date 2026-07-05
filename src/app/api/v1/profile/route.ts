import { NextRequest, NextResponse } from "next/server";
import { CardConfig, queryParamsToConfig, validateConfig } from "@/lib/config-schema";
import { cache, renderCache } from "@/lib/cache";
import { fetchUser, GitHubError, type GithubUserResponse } from "@/lib/github";
import { renderCard } from "@/lib/render";
import { UnknownTemplateError } from "@/lib/templates/types";
import { normalizeUser, emptyGithubData } from "@/lib/templates/github-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  const ghCacheBefore = cache.stats();
  let userData: GithubUserResponse | null = null;
  let fetchError: string | null = null;

  try {
    userData = await fetchUser(username);
  } catch (err) {
    fetchError = err instanceof GitHubError ? err.message : String(err);
  }

  const ghCacheAfter = cache.stats();
  const ghCacheHit = ghCacheAfter.hits > ghCacheBefore.hits;

  const githubData = userData
    ? normalizeUser(userData)
    : emptyGithubData("profile", username);

  const renderCacheBefore = renderCache.stats();

  if (searchParams.get("debug") === "json") {
    return NextResponse.json(
      { config: validation.config, githubData, fetchError, cache: { hit: ghCacheHit, stats: ghCacheAfter }, renderCache: { stats: renderCacheBefore } },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Cache": ghCacheHit ? "HIT" : "MISS" } },
    );
  }

  const format = searchParams.get("format") === "png" ? "png" : "svg";

  try {
    const result = await renderCard(validation.config, githubData, { format });
    if (result.format === "png" && result.png) return imageResponse(result.png, "image/png", { "X-Cache": ghCacheHit ? "HIT" : "MISS", "X-Render-Cache": result.cacheHit ? "HIT" : "MISS" });
    return imageResponse(result.svg, "image/svg+xml; charset=utf-8", { "X-Cache": ghCacheHit ? "HIT" : "MISS", "X-Render-Cache": result.cacheHit ? "HIT" : "MISS" });
  } catch (err) {
    if (err instanceof UnknownTemplateError) {
      return errorResponse(err.message, [{ path: "template", message: err.message }]);
    }
    return errorResponse("Failed to render card");
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); }
  catch { return errorResponse("Failed to parse request body as JSON"); }

  const validation = validateConfig({ ...(body as CardConfig), cardType: "profile" });
  if (!validation.success) return errorResponse("Invalid configuration", validation.errors);

  const c: CardConfig = validation.config;
  const owner = c.repo?.owner ?? "unknown";
  let githubData = emptyGithubData("profile", owner);

  if (owner) {
    try {
      const userData = await fetchUser(owner);
      githubData = normalizeUser(userData);
    } catch {
      // Fall back to empty data — render still works.
    }
  }

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";

  try {
    const result = await renderCard(c, githubData, { format });
    if (result.format === "png" && result.png) return imageResponse(result.png, "image/png");
    return imageResponse(result.svg, "image/svg+xml; charset=utf-8");
  } catch (err) {
    if (err instanceof UnknownTemplateError) {
      return errorResponse(err.message, [{ path: "template", message: err.message }]);
    }
    return errorResponse("Failed to render card");
  }
}