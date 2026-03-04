#!/usr/bin/env npx tsx
/**
 * CLI tool for managing md-comment comments programmatically.
 *
 * Usage:
 *   npx tsx cli/comment.ts list <owner/repo> <file-path> [--branch main]
 *   npx tsx cli/comment.ts add <owner/repo> <file-path> --text "..." --body "..." [--branch main] [--author name]
 *   npx tsx cli/comment.ts reply <owner/repo> <file-path> --id <id> --body "..." [--author name]
 *   npx tsx cli/comment.ts resolve <owner/repo> <file-path> --id <id>
 *
 * Auth: GITHUB_TOKEN env var, or falls back to `gh auth token`.
 */

import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";
import { v4 as uuidv4 } from "uuid";
import { ensureCommentsBranch } from "../src/lib/github/comments-branch";
import { readComments, writeComments } from "../src/lib/github/comments-crud";
import { createAnchor, findSelectionInRawMarkdown } from "../src/lib/anchoring/create-anchor";
import { renderCommentsMarkdown } from "../src/lib/comments/render-markdown";
import type { Comment, CommentFile, CommentFileMetadata } from "../src/lib/comments/types";

// --- Arg parsing ---

function parseArgs(argv: string[]): { command: string; positional: string[]; flags: Record<string, string> } {
  const [command, ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string> = {};

  for (let i = 0; i < rest.length; i++) {
    if (rest[i].startsWith("--")) {
      const key = rest[i].slice(2);
      flags[key] = rest[i + 1] ?? "";
      i++;
    } else {
      positional.push(rest[i]);
    }
  }

  return { command, positional, flags };
}

function parseOwnerRepo(input: string): { owner: string; repo: string } {
  const parts = input.split("/");
  if (parts.length !== 2) {
    throw new Error(`Expected owner/repo format, got: ${input}`);
  }
  return { owner: parts[0], repo: parts[1] };
}

// --- Auth ---

function getToken(): string {
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }
  try {
    return execSync("gh auth token", { encoding: "utf-8" }).trim();
  } catch {
    throw new Error("No GITHUB_TOKEN env var and `gh auth token` failed. Set GITHUB_TOKEN or use `gh auth login`.");
  }
}

// --- Helpers ---

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://md-comment.fly.dev";

function buildMetadata(owner: string, repo: string, filePath: string, branch: string): CommentFileMetadata {
  return {
    repo: `${owner}/${repo}`,
    branch,
    filePath,
    url: `${APP_URL}/${owner}/${repo}/blob/${branch}/${filePath}`,
  };
}

async function fetchRawMarkdown(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  branch: string
): Promise<{ content: string; commitSha: string }> {
  // Resolve branch to commit SHA
  let commitSha = branch;
  try {
    const { data: refData } = await octokit.git.getRef({ owner, repo, ref: `heads/${branch}` });
    commitSha = refData.object.sha;
  } catch {
    // May already be a SHA or tag — use as-is
  }

  const { data } = await octokit.repos.getContent({ owner, repo, path: filePath, ref: branch });
  if (Array.isArray(data) || data.type !== "file" || !data.content) {
    throw new Error(`${filePath} is not a file or has no content`);
  }

  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    commitSha,
  };
}

// --- Commands ---

async function cmdList(octokit: Octokit, owner: string, repo: string, filePath: string) {
  const { data: commentFile } = await readComments(octokit, owner, repo, filePath);

  if (commentFile.comments.length === 0) {
    console.log("No comments found.");
    return;
  }

  for (const c of commentFile.comments) {
    const status = c.resolved ? "Resolved" : "Open";
    const text = c.anchor.selectedText.replace(/\n/g, " ");
    const truncated = text.length > 60 ? text.slice(0, 60) + "…" : text;
    console.log(`[${status}] ${c.id}`);
    console.log(`  Author: ${c.author.login} | ${c.createdAt}`);
    console.log(`  Text: "${truncated}"`);
    console.log(`  Body: ${c.body}`);
    if (c.replies.length > 0) {
      console.log(`  Replies: ${c.replies.length}`);
    }
    console.log();
  }
}

async function cmdAdd(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  text: string,
  body: string,
  author: string
) {
  // 1. Fetch raw markdown
  const { content: rawMarkdown, commitSha } = await fetchRawMarkdown(octokit, owner, repo, filePath, branch);

  // 2. Find selection offsets
  const offsets = findSelectionInRawMarkdown(rawMarkdown, text);
  if (!offsets) {
    throw new Error(`Could not find text "${text.slice(0, 80)}…" in ${filePath}`);
  }

  // 3. Create anchor
  const anchor = createAnchor(rawMarkdown, text, offsets.startOffset, offsets.endOffset);
  anchor.commitSha = commitSha;

  // 4. Ensure comments branch
  await ensureCommentsBranch(octokit, owner, repo);

  // 5. Read existing, append, write
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

  const newComment: Comment = {
    id: uuidv4(),
    author: { login: author, avatarUrl: "" },
    anchor,
    body,
    createdAt: new Date().toISOString(),
    resolved: false,
    replies: [],
  };

  const updated: CommentFile = {
    ...existing,
    comments: [...existing.comments, newComment].sort(
      (a, b) => a.anchor.startOffset - b.anchor.startOffset
    ),
  };

  const metadata = buildMetadata(owner, repo, filePath, branch);
  await writeComments(octokit, owner, repo, filePath, updated, sha, metadata);

  console.log(newComment.id);
}

async function cmdReply(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  commentId: string,
  body: string,
  author: string
) {
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

  const target = existing.comments.find((c) => c.id === commentId);
  if (!target) {
    throw new Error(`Comment ${commentId} not found`);
  }

  const reply = {
    id: uuidv4(),
    author: { login: author, avatarUrl: "" },
    body,
    createdAt: new Date().toISOString(),
  };

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.map((c) =>
      c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c
    ),
  };

  const metadata = buildMetadata(owner, repo, filePath, branch);
  await writeComments(octokit, owner, repo, filePath, updated, sha, metadata);

  console.log(reply.id);
}

async function cmdResolve(
  octokit: Octokit,
  owner: string,
  repo: string,
  filePath: string,
  branch: string,
  commentId: string
) {
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

  const target = existing.comments.find((c) => c.id === commentId);
  if (!target) {
    throw new Error(`Comment ${commentId} not found`);
  }

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.map((c) =>
      c.id === commentId ? { ...c, resolved: true } : c
    ),
  };

  const metadata = buildMetadata(owner, repo, filePath, branch);
  await writeComments(octokit, owner, repo, filePath, updated, sha, metadata);

  console.log(`Resolved: ${commentId}`);
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    printUsage();
    return;
  }

  const { command, positional, flags } = parseArgs(args);
  const token = getToken();
  const octokit = new Octokit({ auth: token });

  if (positional.length < 2) {
    console.error("Error: Expected <owner/repo> <file-path>");
    printUsage();
    return;
  }

  const { owner, repo } = parseOwnerRepo(positional[0]);
  const filePath = positional[1];
  const branch = flags["branch"] || "main";

  switch (command) {
    case "list":
      await cmdList(octokit, owner, repo, filePath);
      break;

    case "add": {
      const text = flags["text"];
      const body = flags["body"];
      const author = flags["author"] || "cli";
      if (!text || !body) {
        throw new Error("--text and --body are required for 'add'");
      }
      await cmdAdd(octokit, owner, repo, filePath, branch, text, body, author);
      break;
    }

    case "reply": {
      const id = flags["id"];
      const body = flags["body"];
      const author = flags["author"] || "cli";
      if (!id || !body) {
        throw new Error("--id and --body are required for 'reply'");
      }
      await cmdReply(octokit, owner, repo, filePath, branch, id, body, author);
      break;
    }

    case "resolve": {
      const id = flags["id"];
      if (!id) {
        throw new Error("--id is required for 'resolve'");
      }
      await cmdResolve(octokit, owner, repo, filePath, branch, id);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      return;
  }
}

function printUsage() {
  console.log(`
Usage:
  npx tsx cli/comment.ts list <owner/repo> <file-path> [--branch main]
  npx tsx cli/comment.ts add <owner/repo> <file-path> --text "..." --body "..." [--branch main] [--author name]
  npx tsx cli/comment.ts reply <owner/repo> <file-path> --id <id> --body "..." [--author name]
  npx tsx cli/comment.ts resolve <owner/repo> <file-path> --id <id>

Auth: Set GITHUB_TOKEN env var or use \`gh auth login\`.
  `.trim());
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
