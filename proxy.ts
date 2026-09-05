import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, importX509 } from "jose";

let publicKeysCache: Record<string, string> | null = null;
let keysCacheTime = 0;

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (publicKeysCache && now - keysCacheTime < 1000 * 60 * 60) return publicKeysCache;

  try {
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } },
    );
    publicKeysCache = await res.json();
    keysCacheTime = now;
    return publicKeysCache;
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(token: string) {
  try {
    const header = JSON.parse(atob(token.split(".")[0]));
    const keys = await getFirebasePublicKeys();
    if (!keys || !keys[header.kid]) return null;

    const publicKey = await importX509(keys[header.kid], "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    return payload;
  } catch {
    return null;
  }
}

/** Page routes that require a verified logged-in user (any role). */
const MEMBER_ONLY_PAGE_PREFIXES = [
  "/geospatial-map",
  "/mouza-map",
  "/porcha",
  "/admin",
] as const;

function isMemberOnlyPage(pathname: string): boolean {
  return MEMBER_ONLY_PAGE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

// Best-effort per-instance burst protection only. Public endpoints that need
// cross-instance enforcement use the shared Upstash-aware rate limiter in
// their route handlers. Do not treat this map as a global security boundary.
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const windowMs = parseInt(process.env.PROXY_RATE_LIMIT_WINDOW || "60000", 10);
  const max = parseInt(process.env.PROXY_RATE_LIMIT_MAX || "100", 10);
  const now = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData || now > windowData.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
  } else if (windowData.count >= max) {
    return new NextResponse(JSON.stringify({ error: "Too Many Requests", requestId }), {
      status: 429,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
  } else {
    windowData.count++;
  }

  // Avoid retaining an unbounded number of expired IP buckets on a long-lived
  // Node.js instance. This is maintenance only; route-level distributed limits
  // remain authoritative where configured.
  if (rateLimitMap.size > 10_000) {
    for (const [key, value] of rateLimitMap) {
      if (value.expiresAt <= now) rateLimitMap.delete(key);
    }
  }

  const cookieToken = request.cookies.get("access_token")?.value ?? null;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const rawToken = cookieToken ?? bearerToken;

  let userPayload: Record<string, unknown> | null = null;
  if (rawToken) {
    userPayload = await verifyFirebaseToken(rawToken);
    if (userPayload) {
      requestHeaders.set(
        "x-user-id",
        String(userPayload.user_id || userPayload.sub || ""),
      );
      requestHeaders.set(
        "x-user-role",
        String(
          userPayload.role || (userPayload.admin === true ? "Admin" : "User"),
        ),
      );
    }
  }

  // Members-only product pages (GIS, mouza download, porcha) + admin shell.
  // Token validity is checked here; app roles for /admin UI are enforced in the admin layout.
  if (isMemberOnlyPage(pathname) && !userPayload) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  const publicApiPrefixes = [
    "/api/auth",
    "/api/metrics",
    "/api/rajuk/health",
    "/api/public",
    "/api/search",
    "/api/porcha",
    "/api/rajuk",
    "/api/mouza-map",
    "/api/unified",
    "/api/pages",
    "/api/blogs",
    "/api/comments",
    "/api/land-records",
  ];
  const isPublicApi = publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  // Do not perform role checks here. In particular, do not reject an Admin
  // just because the Firebase ID token has not yet received a custom claim.
  // Protected API handlers perform the authoritative admin check themselves.
  if (pathname.startsWith("/api/") && !isPublicApi && !userPayload) {
    return new NextResponse(JSON.stringify({ error: "Unauthorized", requestId }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...securityHeaders },
    });
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
