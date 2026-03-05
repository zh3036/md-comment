import type { Octokit } from "@octokit/rest";

export interface FileContent {
  content: string;
  sha: string;
  path: string;
  encoding: string;
  /** The commit SHA this file was fetched from */
  commitSha: string;
}

/**
 * Fetch a file's content from a specific branch.
 * For files > 1MB, falls back to the Blob API.
 */
export async function fetchFileContent(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string
): Promise<FileContent> {
  try {
    // Resolve branch/ref to a commit SHA
    const { data: refData } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    }).catch(() =>
      // Fallback: branch might be a tag or commit SHA
      octokit.git.getRef({ owner, repo, ref: `tags/${branch}` })
    ).catch(() => ({ data: { object: { sha: branch } } }));
    const commitSha = refData.object.sha;

    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new Error(`Path "${path}" is not a file`);
    }

    if (data.content) {
      return {
        content: Buffer.from(data.content, "base64").toString("utf-8"),
        sha: data.sha,
        path: data.path,
        encoding: "utf-8",
        commitSha,
      };
    }

    // Large file: use Blob API
    const blob = await octokit.git.getBlob({
      owner,
      repo,
      file_sha: data.sha,
    });

    return {
      content: Buffer.from(blob.data.content, "base64").toString("utf-8"),
      sha: data.sha,
      path: data.path,
      encoding: "utf-8",
      commitSha,
    };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      throw new Error(`File not found: ${owner}/${repo}/${path} (branch: ${branch})`);
    }
    throw error;
  }
}

/**
 * Get the default branch for a repo (e.g. "main" or "master").
 */
export async function getDefaultBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<string> {
  const { data } = await octokit.repos.get({ owner, repo });
  return data.default_branch;
}

/**
 * Check if the user has write access to the repo.
 */
export async function checkWriteAccess(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    const { data } = await octokit.repos.get({ owner, repo });
    return data.permissions?.push ?? false;
  } catch {
    return false;
  }
}
