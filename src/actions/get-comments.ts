"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { readComments } from "@/lib/github/comments-crud";
import type { CommentFile } from "@/lib/comments/types";

export async function getComments(
  owner: string,
  repo: string,
  filePath: string
): Promise<{ data: CommentFile; sha: string | null }> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  return readComments(octokit, owner, repo, filePath);
}
