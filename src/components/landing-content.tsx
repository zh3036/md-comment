"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function LandingContent() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleNavigate = () => {
    setError("");

    // Parse GitHub URL or owner/repo/path format
    const parsed = parseGitHubUrl(url.trim());
    if (!parsed) {
      setError(
        "Enter a GitHub URL like: https://github.com/owner/repo/blob/main/README.md"
      );
      return;
    }

    router.push(
      `/${parsed.owner}/${parsed.repo}/blob/${parsed.branch}/${parsed.path}`
    );
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-2">Open a Markdown File</h2>
      <p className="text-neutral-500 mb-6">
        Paste a GitHub URL to a markdown file to start commenting.
      </p>

      <div className="flex gap-2 max-w-2xl">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://github.com/owner/repo/blob/main/README.md"
          className="flex-1 px-4 py-2 border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleNavigate();
          }}
        />
        <Button onClick={handleNavigate} disabled={!url.trim()}>
          Open
        </Button>
      </div>

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

      <div className="mt-12">
        <h3 className="text-lg font-semibold mb-4">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-2xl mb-2">1</div>
            <h4 className="font-medium mb-1">Open a file</h4>
            <p className="text-sm text-neutral-500">
              Paste any GitHub markdown file URL. Works with both public and
              private repos.
            </p>
          </div>
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-2xl mb-2">2</div>
            <h4 className="font-medium mb-1">Select & comment</h4>
            <p className="text-sm text-neutral-500">
              Highlight text in the rendered markdown and add threaded comments,
              just like Google Docs.
            </p>
          </div>
          <div className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg">
            <div className="text-2xl mb-2">3</div>
            <h4 className="font-medium mb-1">AI-readable storage</h4>
            <p className="text-sm text-neutral-500">
              Comments are stored as clean JSON on a separate branch
              (md-comments) — easy for AI to read and process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function parseGitHubUrl(
  input: string
): { owner: string; repo: string; branch: string; path: string } | null {
  // Try full GitHub URL
  const urlMatch = input.match(
    /github\.com\/([^/]+)\/([^/]+)\/blob\/([^/]+)\/(.+)/
  );
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      branch: urlMatch[3],
      path: urlMatch[4],
    };
  }

  // Try owner/repo/path format (assume main branch)
  const shortMatch = input.match(/^([^/]+)\/([^/]+)\/(.+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
      branch: "main",
      path: shortMatch[3],
    };
  }

  return null;
}
