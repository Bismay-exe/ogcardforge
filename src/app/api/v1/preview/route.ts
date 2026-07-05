import { NextRequest, NextResponse } from "next/server";
import { renderCard } from "@/lib/render";
import { validateConfig } from "@/lib/config-schema";
import type { GitHubData } from "@/lib/templates/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { config?: unknown; githubData?: GitHubData };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.config) {
    return NextResponse.json({ error: "Missing 'config' field" }, { status: 400 });
  }

  const validation = validateConfig(body.config);
  if (!validation.success) {
    return NextResponse.json(
      { error: "Invalid configuration", details: validation.errors },
      { status: 400 }
    );
  }

  const githubData: GitHubData = body.githubData ?? {
    cardType: "repo",
    owner: "unknown",
    avatarUrl: null,
    displayName: "Unknown",
    description: "",
    topics: [],
    stats: {},
    metadata: {},
  };

  try {
    const result = await renderCard(validation.config, githubData, { format: "svg" });
    return new NextResponse(result.svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
        "X-Render-Cache": result.cacheHit ? "HIT" : "MISS",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to render card", details: String(err) },
      { status: 400 }
    );
  }
}