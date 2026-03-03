import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  // Protect document routes (/:owner/:repo/blob/...) — require auth
  const isDocumentRoute = /^\/[^/]+\/[^/]+\/blob\//.test(req.nextUrl.pathname);

  if (isDocumentRoute && !req.auth) {
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
