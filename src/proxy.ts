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
    // Fast check: cookie set when username is created
    const hasUsernameCookie = req.cookies.get("has_username")?.value === "1";
    if (hasUsernameCookie) {
      return NextResponse.next();
    }

    // Fallback: check session (covers users who already had a username before cookie existed)
    if (req.auth.user.username) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/setup-username", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
