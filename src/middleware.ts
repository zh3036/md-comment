import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // GitHub URL prefix shortcut:
  // /https://github.com/owner/repo/blob/branch/path → /owner/repo/blob/branch/path
  const ghPrefix = "/https://github.com/";
  const ghPrefixEncoded = "/https%3A%2F%2Fgithub.com%2F";
  let strippedPath: string | null = null;

  if (pathname.startsWith(ghPrefix)) {
    strippedPath = "/" + pathname.slice(ghPrefix.length);
  } else if (pathname.toLowerCase().startsWith(ghPrefixEncoded.toLowerCase())) {
    strippedPath = "/" + decodeURIComponent(pathname.slice(1)).replace("https://github.com/", "");
  }

  if (strippedPath) {
    const redirectUrl = new URL(strippedPath, req.nextUrl.origin);
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
