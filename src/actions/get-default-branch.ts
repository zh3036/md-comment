"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { getDefaultBranch } from "@/lib/github/files";

export async function getDefaultBranchAction(
  owner: string,
  repo: string
): Promise<string> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  return getDefaultBranch(octokit, owner, repo);
}
