import { NextRequest, NextResponse } from "next/server";
import { CardConfig, queryParamsToConfig, validateConfig } from "@/lib/config-schema";
import { cache, renderCache } from "@/lib/cache";
import { fetchRepo, GitHubError, type GithubRepoResponse } from "@/lib/github";
import { renderCard } from "@/lib/render";
import { UnknownTemplateError } from "@/lib/templates/types";
import { normalizeRepo, emptyGithubData } from "@/lib/templates/github-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function imageResponse(body: Buffer | string, contentType: string, extraHeaders?: Record<string, string>): NextResponse {
  return new NextResponse(body as BodyInit, {
    status: 200,
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=3600", ...extraHeaders },
  });
}

function errorResponse(
  message: string,
  status: number,
  errors?: Array<{ path: string; message: string }>,
): NextResponse {
  return NextResponse.json({ error: message, details: errors ?? [] }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function githubErrorResponse(err: GitHubError): NextResponse {
  if (err.status === 404) {
    return errorResponse(`Repository not found on GitHub: ${err.message}`, 404);
  }
  if (err.status === 403 || err.status === 429) {
    return errorResponse(`GitHub API rate limit exceeded. ${err.message}`, 429);
  }
  if (err.status === 0) {
    return errorResponse("Could not reach GitHub API. Check your network connection.", 502);
  }
  return errorResponse(`GitHub API error: ${err.message}`, 502);
}

export async function GET(request: NextRequest) {
  const startMs = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const config = queryParamsToConfig(searchParams);
  const validation = validateConfig(config);

  if (!validation.success) {
    return errorResponse("Invalid configuration", 400, validation.errors);
  }
  if (!config.repo?.owner || !config.repo?.name) {
    return errorResponse(
      "owner and repo query params are required",
      400,
      [{ path: "repo", message: "Provide ?owner=username&repo=repo-name" }],
    );
  }

  const ghCacheBefore = cache.stats();
  let repoData: GithubRepoResponse | null = null;
  let fetchError: string | null = null;
  let ghStatus: number | null = null;

  try {
    repoData = await fetchRepo(config.repo.owner, config.repo.name);
  } catch (err) {
    if (err instanceof GitHubError) {
      ghStatus = err.status;
      console.log(`[og-card] GitHub API error ${err.status} for ${config.repo.owner}/${config.repo.name}: ${err.message}`);
      return githubErrorResponse(err);
    }
    fetchError = String(err);
  }

  const ghCacheAfter = cache.stats();
  const ghCacheHit = ghCacheAfter.hits > ghCacheBefore.hits;

  const githubData = repoData
    ? normalizeRepo(repoData)
    : emptyGithubData("repo", config.repo.owner);

  const renderCacheBefore = renderCache.stats();
  const renderStartMs = Date.now();

  if (searchParams.get("debug") === "json") {
    return NextResponse.json(
      {
        config: validation.config,
        githubData,
        fetchError,
        ghStatus,
        cache: { hit: ghCacheHit, stats: ghCacheAfter },
        renderCache: { stats: renderCacheBefore },
        latencyMs: Date.now() - startMs,
      },
      { status: 200, headers: { "Cache-Control": "no-store", "X-Cache": ghCacheHit ? "HIT" : "MISS" } },
    );
  }

  const format = searchParams.get("format") === "png" ? "png" : "svg";

  try {
    const result = await renderCard(validation.config, githubData, { format });
    const renderLatencyMs = Date.now() - renderStartMs;
    const totalLatencyMs = Date.now() - startMs;
    console.log(
      `[og-card] render ${config.repo.owner}/${config.repo.name} template=${config.template} format=${format} ` +
        `gh_cache=${ghCacheHit ? "HIT" : "MISS"} render_cache=${result.cacheHit ? "HIT" : "MISS"} ` +
        `render_ms=${renderLatencyMs} total_ms=${totalLatencyMs}`,
    );
    if (result.format === "png" && result.png) {
      return imageResponse(result.png, "image/png", {
        "X-Cache": ghCacheHit ? "HIT" : "MISS",
        "X-Render-Cache": result.cacheHit ? "HIT" : "MISS",
      });
    }
    return imageResponse(result.svg, "image/svg+xml; charset=utf-8", {
      "X-Cache": ghCacheHit ? "HIT" : "MISS",
      "X-Render-Cache": result.cacheHit ? "HIT" : "MISS",
    });
  } catch (err) {
    if (err instanceof UnknownTemplateError) {
      return errorResponse(err.message, 400, [{ path: "template", message: err.message }]);
    }
    console.error(`[og-card] render error for ${config.repo?.owner}/${config.repo?.name}:`, err);
    return errorResponse("Failed to render card", 500);
  }
}

export async function POST(request: NextRequest) {
  const startMs = Date.now();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Failed to parse request body as JSON", 400);
  }

  const validation = validateConfig(body);
  if (!validation.success) return errorResponse("Invalid configuration", 400, validation.errors);

  const c: CardConfig = validation.config;
  let githubData = emptyGithubData("repo", c.repo?.owner ?? "unknown");

  if (c.repo?.owner && c.repo.name) {
    try {
      const repoData = await fetchRepo(c.repo.owner, c.repo.name);
      githubData = normalizeRepo(repoData);
    } catch (err) {
      if (err instanceof GitHubError) {
        console.log(`[og-card] POST GitHub API error ${err.status} for ${c.repo.owner}/${c.repo.name}: ${err.message}`);
        return githubErrorResponse(err);
      }
    }
  }

  const format = request.nextUrl.searchParams.get("format") === "png" ? "png" : "svg";

  try {
    const result = await renderCard(c, githubData, { format });
    const latencyMs = Date.now() - startMs;
    console.log(
      `[og-card] POST render template=${c.template} format=${format} render_cache=${result.cacheHit ? "HIT" : "MISS"} latency_ms=${latencyMs}`,
    );
    if (result.format === "png" && result.png) {
      return imageResponse(result.png, "image/png");
    }
    return imageResponse(result.svg, "image/svg+xml; charset=utf-8");
  } catch (err) {
    if (err instanceof UnknownTemplateError) {
      return errorResponse(err.message, 400, [{ path: "template", message: err.message }]);
    }
    console.error(`[og-card] POST render error:`, err);
    return errorResponse("Failed to render card", 500);
  }
}