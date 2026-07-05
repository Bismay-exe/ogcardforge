import { cache } from "@/lib/cache";

const GITHUB_API_BASE = "https://api.github.com";

export class GitHubError extends Error {
  readonly status: number;
  readonly retryAfter: number | null;

  constructor(status: number, message: string, retryAfter: number | null = null) {
    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export function hasGitHubToken(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "og-card",
  };
  if (process.env.GITHUB_TOKEN) {
    (headers as Record<string, string>).Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const seconds = Number.parseInt(value, 10);
  if (!Number.isNaN(seconds)) return seconds;
  const date = Date.parse(value);
  if (!Number.isNaN(date)) return Math.max(0, Math.floor((date - Date.now()) / 1000));
  return null;
}

type FetchOptions = {
  signal?: AbortSignal;
};

export async function githubFetch<T>(
  path: string,
  { signal }: FetchOptions = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${GITHUB_API_BASE}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: buildHeaders(),
      signal,
      // GitHub data is fast-changing enough that we don't want Next's data cache
      // for raw API responses; we'll layer our own KV/in-memory cache on top.
      cache: "no-store",
    });
  } catch (err) {
    throw new GitHubError(0, `Network error contacting GitHub: ${(err as Error).message}`);
  }

  if (response.status === 403 || response.status === 429) {
    const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
    const remaining = response.headers.get("x-ratelimit-remaining");
    const limit = response.headers.get("x-ratelimit-limit");
    const reset = response.headers.get("x-ratelimit-reset");
    const message =
      remaining === "0"
        ? `GitHub rate limit exceeded (${limit ?? "?"} req/hr). Resets at ${reset ?? "unknown"}.`
        : "GitHub API rate-limited the request.";
    throw new GitHubError(response.status, message, retryAfter);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new GitHubError(
      response.status,
      `GitHub API returned ${response.status}: ${body || response.statusText}`,
    );
  }

  return (await response.json()) as T;
}

export type GithubRepoResponse = {
  full_name: string;
  description: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: { spdx_id: string } | null;
  archived: boolean;
  pushed_at: string;
  updated_at: string;
  topics?: string[];
  owner: {
    login: string;
    avatar_url: string;
  };
};

export async function fetchRepo(owner: string, name: string): Promise<GithubRepoResponse> {
  const key = `gh:repos:${owner}/${name}`;
  const cached = cache.get<GithubRepoResponse>(key);
  if (cached) return cached;
  const data = await githubFetch<GithubRepoResponse>(`/repos/${owner}/${name}`);
  cache.set(key, data, 3600);
  return data;
}

export type GithubUserResponse = {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  followers: number;
  following: number;
  public_repos: number;
};

export async function fetchUser(username: string): Promise<GithubUserResponse> {
  const key = `gh:user:${username}`;
  const cached = cache.get<GithubUserResponse>(key);
  if (cached) return cached;
  const data = await githubFetch<GithubUserResponse>(`/users/${username}`);
  cache.set(key, data, 3600);
  return data;
}

export type GithubRepoSummary = {
  full_name: string;
  description: string | null;
  stargazers_count: number;
  pushed_at: string;
};

export async function listUserRepos(
  username: string,
  { signal }: FetchOptions = {},
): Promise<GithubRepoSummary[]> {
  const key = `gh:user_repos:${username}`;
  const cached = cache.get<GithubRepoSummary[]>(key);
  if (cached) return cached;
  const data = await githubFetch<GithubRepoSummary[]>(
    `/users/${encodeURIComponent(username)}/repos?per_page=30&sort=pushed`,
    { signal },
  );
  cache.set(key, data, 600); // 10 min — repo lists change more frequently
  return data;
}
