"use server";

import { auth } from "@/auth";
import { createOctokit, createPublicOctokit } from "@/lib/github/client";
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
  const octokit = session?.accessToken
    ? createOctokit(session.accessToken)
    : createPublicOctokit();

  // Try original repo first
  const result = await readComments(octokit, owner, repo, filePath);
  if (result.data.comments.length > 0) return result;

  // If authenticated and no comments on original, check user's fork
  if (session?.accessToken) {
    const canWrite = await checkWriteAccess(octokit, owner, repo);
    if (!canWrite) {
      const userLogin = session.user.login ?? session.user.name ?? "anonymous";
      const fork = await checkForkExists(octokit, owner, repo, userLogin);
      if (fork) {
        const forkResult = await readComments(octokit, fork.owner, fork.repo, filePath);
        if (forkResult.data.comments.length > 0) return forkResult;
      }
    }
  }

  return result;
}
