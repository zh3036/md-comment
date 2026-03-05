interface ForkBannerProps {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  forkInfo: { owner: string; repo: string } | null;
}

export function ForkBanner({ owner, repo, branch, filePath, forkInfo }: ForkBannerProps) {
  if (forkInfo) {
    const forkUrl = `/${forkInfo.owner}/${forkInfo.repo}/blob/${branch}/${filePath}`;
    return (
      <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-6 py-2 text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
        <span>
          Comments will be saved to your fork <strong>{forkInfo.owner}/{forkInfo.repo}</strong>
        </span>
        <a
          href={forkUrl}
          className="text-xs bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800 text-blue-700 dark:text-blue-300 px-3 py-1 rounded font-medium transition-colors"
        >
          View on fork
        </a>
      </div>
    );
  }

  const githubForkUrl = `https://github.com/${owner}/${repo}/fork`;
  return (
    <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-6 py-2 text-sm text-blue-700 dark:text-blue-300 flex items-center justify-between">
      <span>You don&apos;t have write access to {owner}/{repo}. Fork this repo to add comments.</span>
      <a
        href={githubForkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded font-medium transition-colors"
      >
        Fork on GitHub
      </a>
    </div>
  );
}
