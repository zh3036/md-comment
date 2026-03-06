import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { createOctokit } from "@/lib/github/client";
import { fetchFileContent, checkWriteAccess } from "@/lib/github/files";
import { DocumentViewer } from "@/components/document/document-viewer";
import { FileSidebar } from "@/components/document/file-sidebar";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    owner: string;
    repo: string;
    branch: string;
    path: string[];
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { owner, repo, path } = await params;
  const fileName = path[path.length - 1];
  return {
    title: `${fileName} · ${owner}/${repo}`,
  };
}

export default async function DocumentPage({ params }: PageProps) {
  const { owner, repo, branch, path } = await params;
  const session = await auth();

  if (!session?.accessToken) {
    redirect("/api/auth/signin");
  }

  const filePath = path.join("/");
  const octokit = createOctokit(session.accessToken);

  let fileContent: string;
  let canWrite: boolean;
  let commitSha: string;

  try {
    const [file, writeAccess] = await Promise.all([
      fetchFileContent(octokit, owner, repo, filePath, branch),
      checkWriteAccess(octokit, owner, repo),
    ]);
    fileContent = file.content;
    canWrite = writeAccess;
    commitSha = file.commitSha;
  } catch (error: unknown) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">File Not Found</h1>
          <p className="text-neutral-500 mb-4">
            Could not load {owner}/{repo}/{filePath} on branch {branch}
          </p>
          <p className="text-sm text-neutral-400">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link href="/" className="text-blue-500 hover:underline mt-4 inline-block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  // Breadcrumbs
  const pathParts = filePath.split("/");
  const breadcrumbs = [
    { label: owner, href: `https://github.com/${owner}` },
    { label: repo, href: `https://github.com/${owner}/${repo}` },
    ...pathParts.map((part, i) => ({
      label: part,
      href: `/${owner}/${repo}/blob/${branch}/${pathParts.slice(0, i + 1).join("/")}`,
    })),
  ];

  return (
    <div>
      {/* Header */}
      <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 flex items-center px-6 bg-white dark:bg-neutral-950">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-neutral-400">/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="text-blue-500 hover:underline"
                  target={i < 2 ? "_blank" : undefined}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {!canWrite && (
            <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-2 py-1 rounded">
              Read-only
            </span>
          )}
          <span className="text-xs text-neutral-500">
            Branch: {branch}
          </span>
        </div>
      </header>

      {/* Document viewer with file sidebar */}
      <div className="flex h-[calc(100vh-64px)] relative">
        <FileSidebar
          owner={owner}
          repo={repo}
          branch={branch}
          filePath={filePath}
        />
        <div className="flex-1 min-w-0">
          <DocumentViewer
            owner={owner}
            repo={repo}
            branch={branch}
            filePath={filePath}
            content={fileContent}
            commitSha={commitSha}
            canWrite={canWrite}
            userLogin={session.user.login ?? session.user.name ?? "anonymous"}
            userAvatar={session.user.image ?? ""}
          />
        </div>
      </div>
    </div>
  );
}
