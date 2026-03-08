"use server";

import { auth } from "@/auth";
import { createOctokit, createPublicOctokit } from "@/lib/github/client";
import { fetchRepoTree, type TreeNode } from "@/lib/github/tree";

export async function getTree(
  owner: string,
  repo: string,
  branch: string
): Promise<TreeNode[]> {
  const session = await auth();
  const octokit = session?.accessToken
    ? createOctokit(session.accessToken)
    : createPublicOctokit();

  return fetchRepoTree(octokit, owner, repo, branch);
}
