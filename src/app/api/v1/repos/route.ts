import { NextRequest, NextResponse } from "next/server";
import { listUserRepos, type GithubRepoSummary } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const owner = request.nextUrl.searchParams.get("owner");

  if (!owner) {
    return NextResponse.json(
      { error: "Missing 'owner' query param" },
      { status: 400 }
    );
  }

  try {
    const repos: GithubRepoSummary[] = await listUserRepos(owner);
    return NextResponse.json(
      { repos: repos.map((r) => ({ name: r.full_name, description: r.description })) },
      { status: 200, headers: { "Cache-Control": "public, max-age=600" } }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch repos", details: String(err) },
      { status: 502 }
    );
  }
}