import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware — runs before every request.
 *
 * Protects /admin/* routes from unauthenticated access.
 * Firebase client SDK cannot run in the Edge runtime, so we check for
 * the presence of the Firebase Auth session cookie that Firebase sets
 * automatically when a user logs in with `setPersistence(browserLocalPersistence)`.
 *
 * If the cookie is absent, we redirect to /login with a `from` param
 * so the login page can redirect back after successful auth.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only guard /admin routes
  if (pathname.startsWith("/admin")) {
    // Firebase stores its auth token in a cookie named after the projectId.
    // We look for any cookie whose key starts with "firebase:authUser" to check
    // if the user is logged in (this is what Firebase Web SDK sets in localStorage
    // but we check cookies here at the edge as a first-pass guard).
    // The admin layout also does a full Firebase auth check client-side as a fallback.
    const hasAuthCookie = Array.from(request.cookies.getAll()).some(
      (c) =>
        c.name.startsWith("firebase:authUser") ||
        c.name === "sb-auth-token" || // Supabase fallback
        c.name === "__session"         // Firebase session cookie if using Admin SDK
    );

    if (!hasAuthCookie) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except Next.js internals and static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|.*\\.png|.*\\.jpg|.*\\.svg).*)",
  ],
};
