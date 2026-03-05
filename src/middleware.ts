import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // GitHub URL prefix shortcut:
  // /https://github.com/owner/repo/blob/branch/path → /owner/repo/blob/branch/path
  // Note: servers normalize // to / so we also match /https:/github.com/
  const ghPrefixes = [
    "/https://github.com/",
    "/https:/github.com/",
    "/http://github.com/",
    "/http:/github.com/",
  ];
  const ghPrefixEncoded = "/https%3A%2F%2Fgithub.com%2F";
  let strippedPath: string | null = null;

  for (const prefix of ghPrefixes) {
    if (pathname.startsWith(prefix)) {
      strippedPath = "/" + pathname.slice(prefix.length);
      break;
    }
  }
  if (!strippedPath && pathname.toLowerCase().startsWith(ghPrefixEncoded.toLowerCase())) {
    strippedPath = "/" + decodeURIComponent(pathname.slice(1)).replace(/https?:\/\/github\.com\//, "");
  }

  if (strippedPath) {
    const redirectUrl = new URL(strippedPath, req.nextUrl.origin);
    return NextResponse.redirect(redirectUrl, 307);
  }

  // Repo root: /owner/repo → /owner/repo/blob/main/README.md
  const repoRootMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/?$/);
  if (repoRootMatch && !["api", "_next"].includes(repoRootMatch[1])) {
    const redirectUrl = new URL(
      `/${repoRootMatch[1]}/${repoRootMatch[2]}/blob/main/README.md`,
      req.nextUrl.origin
    );
    return NextResponse.redirect(redirectUrl, 307);
  }

  // /tree/ URLs (folder browsing): /owner/repo/tree/branch/folder → /owner/repo/blob/branch/folder/README.md
  const treeMatch = pathname.match(/^\/([^/]+)\/([^/]+)\/tree\/([^/]+)(\/.*)?$/);
  if (treeMatch) {
    const [, treeOwner, treeRepo, treeBranch, treePath] = treeMatch;
    const folder = treePath ? treePath.replace(/\/$/, "") : "";
    const redirectUrl = new URL(
      `/${treeOwner}/${treeRepo}/blob/${treeBranch}${folder}/README.md`,
      req.nextUrl.origin
    );
    return NextResponse.redirect(redirectUrl, 307);
  }

  // Protect document routes (/:owner/:repo/blob/...) — require auth
  const isDocumentRoute = /^\/[^/]+\/[^/]+\/blob\//.test(pathname);

  if (isDocumentRoute && !req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
