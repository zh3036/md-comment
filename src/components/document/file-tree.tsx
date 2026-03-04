"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { TreeNode } from "@/lib/github/tree";

const MARKDOWN_EXT = /\.(md|mdx)$/i;

interface FileTreeProps {
  tree: TreeNode[];
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
}

export function FileTree({ tree, owner, repo, branch, currentPath }: FileTreeProps) {
  return (
    <ul className="text-sm select-none">
      {tree.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          owner={owner}
          repo={repo}
          branch={branch}
          currentPath={currentPath}
          defaultExpanded={isAncestorOf(node, currentPath)}
        />
      ))}
    </ul>
  );
}

function isAncestorOf(node: TreeNode, path: string): boolean {
  if (node.type === "directory") {
    return path.startsWith(node.path + "/");
  }
  return false;
}

interface FileTreeNodeProps {
  node: TreeNode;
  owner: string;
  repo: string;
  branch: string;
  currentPath: string;
  defaultExpanded: boolean;
}

function FileTreeNode({ node, owner, repo, branch, currentPath, defaultExpanded }: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const isMarkdown = node.type === "file" && MARKDOWN_EXT.test(node.name);
  const isCurrent = node.path === currentPath;

  // Auto-expand to reveal current file when currentPath changes
  useEffect(() => {
    if (node.type === "directory" && currentPath.startsWith(node.path + "/")) {
      setExpanded(true);
    }
  }, [currentPath, node.path, node.type]);

  if (node.type === "directory") {
    return (
      <li>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 w-full px-2 py-1 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded text-left"
        >
          <span className="text-neutral-400 w-4 text-center text-xs">
            {expanded ? "▾" : "▸"}
          </span>
          <span className="text-neutral-400">📁</span>
          <span className="truncate">{node.name}</span>
        </button>
        {expanded && node.children && (
          <ul className="ml-3">
            {node.children.map((child) => (
              <FileTreeNode
                key={child.path}
                node={child}
                owner={owner}
                repo={repo}
                branch={branch}
                currentPath={currentPath}
                defaultExpanded={isAncestorOf(child, currentPath)}
              />
            ))}
          </ul>
        )}
      </li>
    );
  }

  // File node
  const href = `/${owner}/${repo}/blob/${branch}/${node.path}`;

  if (isMarkdown) {
    return (
      <li>
        <Link
          href={href}
          className={`flex items-center gap-1 w-full px-2 py-1 rounded truncate ${
            isCurrent
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
              : "hover:bg-neutral-100 dark:hover:bg-neutral-800"
          }`}
        >
          <span className="w-4" />
          <span className="text-neutral-400">📄</span>
          <span className="truncate">{node.name}</span>
        </Link>
      </li>
    );
  }

  // Non-markdown file — visible but not clickable
  return (
    <li>
      <div className="flex items-center gap-1 w-full px-2 py-1 text-neutral-400 truncate cursor-default">
        <span className="w-4" />
        <span>📄</span>
        <span className="truncate">{node.name}</span>
      </div>
    </li>
  );
}
