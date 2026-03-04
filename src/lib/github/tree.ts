import type { Octokit } from "@octokit/rest";

export interface TreeNode {
  name: string;
  path: string;
  type: "file" | "directory";
  children?: TreeNode[];
}

export async function fetchRepoTree(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string
): Promise<TreeNode[]> {
  const { data } = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: branch,
    recursive: "true",
  });

  // Build nested tree from flat list
  const root: TreeNode[] = [];
  const dirs = new Map<string, TreeNode>();

  // Sort so directories come before files at same depth
  const sorted = [...data.tree].sort((a, b) => {
    const aDepth = (a.path?.split("/").length ?? 0);
    const bDepth = (b.path?.split("/").length ?? 0);
    if (aDepth !== bDepth) return aDepth - bDepth;
    // directories first
    if (a.type === "tree" && b.type !== "tree") return -1;
    if (a.type !== "tree" && b.type === "tree") return 1;
    return (a.path ?? "").localeCompare(b.path ?? "");
  });

  for (const item of sorted) {
    if (!item.path) continue;

    const parts = item.path.split("/");
    const name = parts[parts.length - 1];
    const parentPath = parts.slice(0, -1).join("/");

    const node: TreeNode = {
      name,
      path: item.path,
      type: item.type === "tree" ? "directory" : "file",
    };

    if (node.type === "directory") {
      node.children = [];
      dirs.set(item.path, node);
    }

    if (parentPath === "") {
      root.push(node);
    } else {
      const parent = dirs.get(parentPath);
      parent?.children?.push(node);
    }
  }

  return root;
}
