import type { GitHubData } from "@/lib/templates/types";
import type { GithubRepoResponse, GithubUserResponse } from "@/lib/github";

function formatStars(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function normalizeRepo(repo: GithubRepoResponse): GitHubData {
  return {
    cardType: "repo",
    owner: repo.owner?.login ?? "unknown",
    avatarUrl: repo.owner?.avatar_url ?? null,
    displayName: repo.full_name,
    description: repo.description ?? "",
    homepage: repo.homepage,
    topics: repo.topics ?? [],
    stats: {
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      openIssues: repo.open_issues_count,
    },
    metadata: {
      license: repo.license?.spdx_id ?? null,
      lastUpdated: formatDate(repo.pushed_at ?? repo.updated_at),
      archived: repo.archived,
    },
  };
}

export function normalizeUser(user: GithubUserResponse): GitHubData {
  return {
    cardType: "profile",
    owner: user.login,
    avatarUrl: user.avatar_url,
    displayName: user.name ?? user.login,
    description: user.bio ?? "",
    topics: [],
    stats: {
      followers: user.followers,
      following: user.following,
      publicRepos: user.public_repos,
    },
    metadata: {
      license: null,
      lastUpdated: null,
      archived: false,
    },
  };
}

export function emptyGithubData(cardType: "repo" | "profile", owner: string): GitHubData {
  return {
    cardType,
    owner,
    avatarUrl: null,
    displayName: owner,
    description: "",
    topics: [],
    stats: {},
    metadata: { license: null, lastUpdated: null, archived: false },
  };
}

export const formatters = {
  stars: formatStars,
  forks: formatStars,
  followers: formatStars,
  date: formatDate,
};
