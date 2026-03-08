import { Octokit } from "@octokit/rest";

export function createOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

/** Unauthenticated Octokit — works for public repos only (lower rate limits). */
export function createPublicOctokit(): Octokit {
  return new Octokit();
}
