"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { readComments } from "@/lib/github/comments-crud";
import { checkWriteAccess } from "@/lib/github/files";
import { checkForkExists } from "@/lib/github/fork";
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

  // Try original repo first
  const result = await readComments(octokit, owner, repo, filePath);
  if (result.data.comments.length > 0) return result;

  // If no comments on original and user doesn't have write access, check fork
  const canWrite = await checkWriteAccess(octokit, owner, repo);
  if (!canWrite) {
    const userLogin = session.user.login ?? session.user.name ?? "anonymous";
    const fork = await checkForkExists(octokit, owner, repo, userLogin);
    if (fork) {
      const forkResult = await readComments(octokit, fork.owner, fork.repo, filePath);
      if (forkResult.data.comments.length > 0) return forkResult;
    }
  }

  return result;
}
