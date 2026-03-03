"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { ensureCommentsBranch } from "@/lib/github/comments-branch";

export async function ensureBranch(owner: string, repo: string) {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  await ensureCommentsBranch(octokit, owner, repo);
}
