import { NextRequest, NextResponse } from "next/server";

/** Paths that require a logged-in session (access_token cookie). */
const LOGIN_REQUIRED_PREFIXES = [
  "/geospatial-map",
  "/mouza-map",
  "/porcha",
] as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const needsLogin = LOGIN_REQUIRED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!needsLogin) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  if (token) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/geospatial-map/:path*", "/mouza-map/:path*", "/porcha/:path*"],
};
