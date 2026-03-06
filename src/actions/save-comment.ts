"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { ensureCommentsBranch } from "@/lib/github/comments-branch";
import { readComments, writeComments } from "@/lib/github/comments-crud";
import { checkWriteAccess } from "@/lib/github/files";
import { checkForkExists, forkRepo } from "@/lib/github/fork";
import type { Comment, CommentFile, CommentFileMetadata, CommentReply } from "@/lib/comments/types";
import type { Octokit } from "@octokit/rest";
import { v4 as uuidv4 } from "uuid";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://md-comment.fly.dev";

function buildMetadata(
  owner: string,
  repo: string,
  filePath: string,
  branch?: string
): CommentFileMetadata {
  const b = branch || "main";
  return {
    repo: `${owner}/${repo}`,
    branch: b,
    filePath,
    url: `${APP_URL}/${owner}/${repo}/blob/${b}/${filePath}`,
  };
}

/**
 * Resolve the target repo for comments: original repo if writable, otherwise user's fork.
 */
async function resolveCommentTarget(
  octokit: Octokit,
  owner: string,
  repo: string,
  userLogin: string
): Promise<{ owner: string; repo: string }> {
  const canWrite = await checkWriteAccess(octokit, owner, repo);
  if (canWrite) return { owner, repo };

  // Check for existing fork
  const fork = await checkForkExists(octokit, owner, repo, userLogin);
  if (fork) return fork;

  // Create fork
  const newFork = await forkRepo(octokit, owner, repo);
  // Small delay to let GitHub process the fork
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return newFork;
}

export async function addComment(
  owner: string,
  repo: string,
  filePath: string,
  comment: Omit<Comment, "id" | "createdAt" | "resolved" | "replies">,
  branch?: string
): Promise<Comment> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const userLogin = session.user.login ?? session.user.name ?? "anonymous";
  const target = await resolveCommentTarget(octokit, owner, repo, userLogin);

  await ensureCommentsBranch(octokit, target.owner, target.repo);

  const { data: existing, sha } = await readComments(octokit, target.owner, target.repo, filePath);

  const newComment: Comment = {
    ...comment,
    id: uuidv4(),
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
  await writeComments(octokit, target.owner, target.repo, filePath, updated, sha, metadata);
  return newComment;
}

export async function addReply(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string,
  body: string,
  branch?: string
): Promise<CommentReply> {
  const session = await auth();
  if (!session?.accessToken || !session.user.login) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const userLogin = session.user.login ?? session.user.name ?? "anonymous";
  const target = await resolveCommentTarget(octokit, owner, repo, userLogin);

  const { data: existing, sha } = await readComments(octokit, target.owner, target.repo, filePath);

  const reply: CommentReply = {
    id: uuidv4(),
    author: {
      login: session.user.login,
      avatarUrl: session.user.image ?? "",
    },
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
  await writeComments(octokit, target.owner, target.repo, filePath, updated, sha, metadata);
  return reply;
}

export async function resolveComment(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string,
  resolved: boolean,
  branch?: string
): Promise<void> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const userLogin = session.user.login ?? session.user.name ?? "anonymous";
  const target = await resolveCommentTarget(octokit, owner, repo, userLogin);

  const { data: existing, sha } = await readComments(octokit, target.owner, target.repo, filePath);

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.map((c) =>
      c.id === commentId ? { ...c, resolved } : c
    ),
  };

  const metadata = buildMetadata(owner, repo, filePath, branch);
  await writeComments(octokit, target.owner, target.repo, filePath, updated, sha, metadata);
}

export async function deleteComment(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string,
  branch?: string
): Promise<void> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const userLogin = session.user.login ?? session.user.name ?? "anonymous";
  const target = await resolveCommentTarget(octokit, owner, repo, userLogin);

  const { data: existing, sha } = await readComments(octokit, target.owner, target.repo, filePath);

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.filter((c) => c.id !== commentId),
  };

  const metadata = buildMetadata(owner, repo, filePath, branch);
  await writeComments(octokit, target.owner, target.repo, filePath, updated, sha, metadata);
}
