import type { Octokit } from "@octokit/rest";

/**
 * Check if the authenticated user already has a fork of the repo.
 */
export async function checkForkExists(
  octokit: Octokit,
  owner: string,
  repo: string,
  userLogin: string
): Promise<{ owner: string; repo: string } | null> {
  try {
    const { data } = await octokit.repos.get({
      owner: userLogin,
      repo,
    });
    // Verify it's actually a fork of the target repo
    if (data.fork && data.parent?.full_name === `${owner}/${repo}`) {
      return { owner: data.owner.login, repo: data.name };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Fork a repo. GitHub's API is idempotent — returns existing fork if already forked.
 */
export async function forkRepo(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<{ owner: string; repo: string }> {
  const { data } = await octokit.repos.createFork({
    owner,
    repo,
  });
  return { owner: data.owner.login, repo: data.name };
}
