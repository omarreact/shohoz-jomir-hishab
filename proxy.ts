import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// In-memory rate limit tracking for Edge (per Edge Node)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-only-insecure-key-DO-NOT-USE-IN-PROD' : (() => { throw new Error('JWT_SECRET environment variable is required in production'); })())
);

/**
 * Next.js Edge Proxy — Global API Gateway
 * Replaces the old middleware.ts convention.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Request ID + Security Headers
  const requestId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const securityHeaders: Record<string, string> = {
    "x-request-id": requestId,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  };

  // 2. Rate Limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const windowMs = parseInt(process.env.PROXY_RATE_LIMIT_WINDOW || "60000", 10);
  const max = parseInt(process.env.PROXY_RATE_LIMIT_MAX || "100", 10);
  const now = Date.now();

  const windowData = rateLimitMap.get(ip);
  if (!windowData || now > windowData.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
  } else {
    if (windowData.count >= max) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests", requestId }),
        { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    windowData.count++;
  }

  // 3. JWT resolution — check cookie first, then Authorization header
  const cookieToken = request.cookies.get("access_token")?.value ?? null;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const rawToken = cookieToken ?? bearerToken;

  let userPayload: { userId: string; role: string } | null = null;
  if (rawToken) {
    try {
      const { payload } = await jwtVerify(rawToken, JWT_SECRET);
      userPayload = {
        userId: payload.userId as string,
        role: payload.role as string,
      };
      requestHeaders.set("x-user-id", userPayload.userId);
      requestHeaders.set("x-user-role", userPayload.role);
    } catch {
      // Invalid / expired token — treat as unauthenticated
    }
  }

  // 4. Guard /admin pages
  if (pathname.startsWith("/admin")) {
    if (
      !userPayload ||
      (userPayload.role !== "Admin" && userPayload.role !== "Super Admin")
    ) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Guard /api/* routes (except public ones)
  const publicApiPrefixes = [
    "/api/auth",
    "/api/metrics",
    "/api/rajuk/health",
    "/api/admin/settings/maintenance",
    "/api/landbd",
    "/api/porcha",
    "/api/rajuk",
    "/api/unified",       // Core Unified API
    "/api/pages",         // public custom pages (footer links)
    "/api/blogs",         // public blog list + individual posts
    "/api/comments",      // public blog comments
    "/api/admin/stats",   // public stats for data monitor
  ];
  const isPublicApi = publicApiPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );
  if (pathname.startsWith("/api/") && !isPublicApi) {
    if (!userPayload) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", requestId }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: securityHeaders,
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)",
  ],
};
