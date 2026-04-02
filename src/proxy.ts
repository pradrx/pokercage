import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicPaths = [
  "/",
  "/setup-username",
  "/api/auth",
  "/api/user/username",
];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Only enforce username setup for authenticated users
  if (req.auth?.user) {
    if (req.auth.user.username) {
      return NextResponse.next();
    }

    // No username set — block access
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Username setup required" },
        { status: 403 }
      );
    }

    const setupUrl = new URL("/setup-username", req.url);
    setupUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(setupUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
