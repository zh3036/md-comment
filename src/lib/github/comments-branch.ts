import type { Octokit } from "@octokit/rest";

const COMMENTS_BRANCH = "md-comments";

/**
 * Ensure the `md-comments` orphan branch exists.
 * Creates it with an empty initial commit if it doesn't exist.
 */
export async function ensureCommentsBranch(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<void> {
  // Check if branch already exists
  try {
    await octokit.repos.getBranch({ owner, repo, branch: COMMENTS_BRANCH });
    return; // Branch exists
  } catch (error: unknown) {
    if (!error || typeof error !== "object" || !("status" in error) || error.status !== 404) {
      throw error;
    }
  }

  // Create orphan branch using Git Data API
  // 1. Create an empty tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    tree: [
      {
        path: "README.md",
        mode: "100644",
        type: "blob",
        content:
          "# md-comments\n\nThis branch stores comment data for the md-comment app.\nDo not merge this branch into your main branch.\n",
      },
    ],
  });

  // 2. Create an orphan commit (no parents)
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Initialize md-comments branch",
    tree: tree.sha,
    parents: [],
  });

  // 3. Create the branch ref
  await octokit.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${COMMENTS_BRANCH}`,
    sha: commit.sha,
  });
}

export { COMMENTS_BRANCH };
