import type { Octokit } from "@octokit/rest";
import { COMMENTS_BRANCH } from "./comments-branch";
import type { CommentFile, CommentFileMetadata } from "../comments/types";
import { commentFileSchema } from "../comments/schema";
import { mergeCommentFiles } from "../comments/merge";
import { renderCommentsMarkdown } from "../comments/render-markdown";

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

function commentMarkdownPath(filePath: string): string {
  return `comments/${filePath}.md`;
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
 * Optionally attaches metadata and writes a human-readable .md file alongside.
 */
export async function writeComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  commentFile: CommentFile,
  sha: string | null,
  metadata?: CommentFileMetadata,
  maxRetries = 3
): Promise<void> {
  // Attach metadata if provided
  if (metadata) {
    commentFile = { ...commentFile, metadata };
  }

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

      // Best-effort: write human-readable markdown alongside JSON
      await writeReadableMarkdown(octokit, owner, repo, filePath, commentFile).catch(() => {});

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

/**
 * Write (or update) the human-readable .md file on the comments branch.
 * Best-effort — failures are silently ignored by the caller.
 */
async function writeReadableMarkdown(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  commentFile: CommentFile
): Promise<void> {
  const mdPath = commentMarkdownPath(filePath);
  const markdown = renderCommentsMarkdown(commentFile);
  const content = Buffer.from(markdown).toString("base64");

  // Try to get existing file SHA for update
  let existingSha: string | undefined;
  try {
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: mdPath,
      ref: COMMENTS_BRANCH,
    });
    if (!Array.isArray(data) && data.type === "file") {
      existingSha = data.sha;
    }
  } catch {
    // File doesn't exist yet — will create
  }

  const params: Parameters<Octokit["repos"]["createOrUpdateFileContents"]>[0] = {
    owner,
    repo,
    path: mdPath,
    message: `Update readable comments for ${filePath}`,
    content,
    branch: COMMENTS_BRANCH,
  };
  if (existingSha) {
    params.sha = existingSha;
  }

  await octokit.repos.createOrUpdateFileContents(params);
}
