"use client";

import { useState, useCallback } from "react";
import { FileTree } from "./file-tree";
import { getTree } from "@/actions/get-tree";
import type { TreeNode } from "@/lib/github/tree";

interface FileSidebarProps {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
}

export function FileSidebar({ owner, repo, branch, filePath }: FileSidebarProps) {
  const [open, setOpen] = useState(false);
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    if (tree) return; // already loaded
    setLoading(true);
    setError(null);
    try {
      const data = await getTree(owner, repo, branch);
      setTree(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load file tree");
    } finally {
      setLoading(false);
    }
  }, [tree, owner, repo, branch]);

  const handleToggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next) loadTree();
  }, [open, loadTree]);

  return (
    <>
      {/* Toggle button — always visible */}
      <button
        onClick={handleToggle}
        className="absolute top-0 left-0 z-10 h-8 w-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-br"
        title={open ? "Close file tree" : "Open file tree"}
      >
        {open ? "✕" : "☰"}
      </button>

      {/* Sidebar panel */}
      {open && (
        <div className="w-60 shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 overflow-y-auto">
          <div className="pt-10 pb-4 px-2">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide px-2 mb-2">
              Files
            </h3>
            {loading && (
              <p className="text-xs text-neutral-400 px-2">Loading...</p>
            )}
            {error && (
              <p className="text-xs text-red-500 px-2">{error}</p>
            )}
            {tree && (
              <FileTree
                tree={tree}
                owner={owner}
                repo={repo}
                branch={branch}
                currentPath={filePath}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
