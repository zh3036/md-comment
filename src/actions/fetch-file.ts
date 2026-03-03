"use server";

import { auth } from "@/auth";
import { createOctokit } from "@/lib/github/client";
import { fetchFileContent, checkWriteAccess } from "@/lib/github/files";

export async function fetchFile(
  owner: string,
  repo: string,
  path: string,
  branch: string
) {
  const session = await auth();
  if (!session?.accessToken) {
    throw new Error("Not authenticated");
  }

  const octokit = createOctokit(session.accessToken);
  const file = await fetchFileContent(octokit, owner, repo, path, branch);
  const canWrite = await checkWriteAccess(octokit, owner, repo);

  return {
    content: file.content,
    sha: file.sha,
    path: file.path,
    canWrite,
  };
}
