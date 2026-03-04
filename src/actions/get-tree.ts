"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { fetchRepoTree, type TreeNode } from "@/lib/github/tree";

export async function getTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeNode[]> {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  return fetchRepoTree(octokit, owner, repo, branch);
}
