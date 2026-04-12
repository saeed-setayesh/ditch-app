import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = [
  "/",                // landing page
  "/login",
  "/register",
  "/api/auth",        // Auth.js endpoints
];

const PUBLIC_PREFIXES = [
  "/api/auth/",       // Auth.js sub-routes
  "/_next/",          // Next.js internals
];

const PUBLIC_FILES = [
  "/sw.js",
  "/manifest.webmanifest",
  "/favicon.ico",
];

function isPublic(pathname: string): boolean {
  // exact matches
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // prefix matches
  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  // static files
  if (PUBLIC_FILES.includes(pathname)) return true;
  // icon files and other PWA assets in /public
  if (pathname.startsWith("/icon-")) return true;
  // Next.js static assets
  if (pathname.startsWith("/_next")) return true;
  // public static files (images, etc.)
  if (pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|webmanifest|js|css|woff|woff2)$/)) return true;
  return false;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  if (!req.auth) {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Match everything except _next/static, _next/image
    "/((?!_next/static|_next/image).*)",
  ],
};
