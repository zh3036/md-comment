import type { Octokit } from "@octokit/rest";
import { COMMENTS_BRANCH } from "./comments-branch";
import type { CommentFile } from "../comments/types";
import { commentFileSchema } from "../comments/schema";
import { mergeCommentFiles } from "../comments/merge";

const EMPTY_COMMENT_FILE: CommentFile = { version: 1, comments: [] };

interface CommentFileWithSha {
  data: CommentFile;
  sha: string | null;
}

/**
 * Build the path on the comments branch for a given file path.
 * e.g., "docs/readme.md" → "comments/docs/readme.md.json"
 */
function commentPath(filePath: string): string {
  return `comments/${filePath}.json`;
}

/**
 * Read the comment file for a given markdown file path.
 */
export async function readComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string
): Promise<CommentFileWithSha> {
  const path = commentPath(filePath);

  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path,
      ref: COMMENTS_BRANCH,
    });

    if (Array.isArray(data) || data.type !== "file" || !data.content) {
      return { data: EMPTY_COMMENT_FILE, sha: null };
    }

    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = JSON.parse(content);
    const validated = commentFileSchema.parse(parsed);

    return { data: validated as CommentFile, sha: data.sha };
  } catch (error: unknown) {
    if (error && typeof error === "object" && "status" in error && error.status === 404) {
      return { data: EMPTY_COMMENT_FILE, sha: null };
    }
    throw error;
  }
}

/**
 * Write the comment file with optimistic concurrency.
 * If a 409 conflict occurs, fetches the remote version, merges, and retries.
 */
export async function writeComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  commentFile: CommentFile,
  sha: string | null,
  maxRetries = 3
): Promise<void> {
  const path = commentPath(filePath);
  const content = Buffer.from(
    JSON.stringify(commentFile, null, 2)
  ).toString("base64");

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const params: Parameters<Octokit["repos"]["createOrUpdateFileContents"]>[0] = {
        owner,
        repo,
        path,
        message: `Update comments for ${filePath}`,
        content,
        branch: COMMENTS_BRANCH,
      };
      if (sha) {
        params.sha = sha;
      }

      await octokit.repos.createOrUpdateFileContents(params);
      return;
    } catch (error: unknown) {
      if (
        error &&
        typeof error === "object" &&
        "status" in error &&
        error.status === 409 &&
        attempt < maxRetries
      ) {
        // Conflict: fetch remote, merge, retry
        const remote = await readComments(octokit, owner, repo, filePath);
        const merged = mergeCommentFiles(commentFile, remote.data);
        commentFile = merged;
        sha = remote.sha;
        continue;
      }
      throw error;
    }
  }
}
