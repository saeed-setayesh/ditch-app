/**
 * Next.js 16 expects middleware to be the exported `auth` function itself —
 * not `auth((req) => …)`. Route protection lives in `callbacks.authorized` in auth.ts.
 * @see https://authjs.dev/reference/nextjs#middleware
 */
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    // Match everything except _next/static, _next/image
    "/((?!_next/static|_next/image).*)",
  ],
};
