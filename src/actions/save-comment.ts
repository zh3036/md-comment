"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { ensureCommentsBranch } from "@/lib/github/comments-branch";
import { readComments, writeComments } from "@/lib/github/comments-crud";
import type { Comment, CommentFile, CommentReply } from "@/lib/comments/types";
import { v4 as uuidv4 } from "uuid";

export async function addComment(
  owner: string,
  repo: string,
  filePath: string,
  comment: Omit<Comment, "id" | "createdAt" | "resolved" | "replies">
): Promise<Comment> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  await ensureCommentsBranch(octokit, owner, repo);

  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

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

  await writeComments(octokit, owner, repo, filePath, updated, sha);
  return newComment;
}

export async function addReply(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string,
  body: string
): Promise<CommentReply> {
  const session = await auth();
  if (!session?.accessToken || !session.user.login) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

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

  await writeComments(octokit, owner, repo, filePath, updated, sha);
  return reply;
}

export async function resolveComment(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string,
  resolved: boolean
): Promise<void> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.map((c) =>
      c.id === commentId ? { ...c, resolved } : c
    ),
  };

  await writeComments(octokit, owner, repo, filePath, updated, sha);
}

export async function deleteComment(
  owner: string,
  repo: string,
  filePath: string,
  commentId: string
): Promise<void> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const { data: existing, sha } = await readComments(octokit, owner, repo, filePath);

  const updated: CommentFile = {
    ...existing,
    comments: existing.comments.filter((c) => c.id !== commentId),
  };

  await writeComments(octokit, owner, repo, filePath, updated, sha);
}
