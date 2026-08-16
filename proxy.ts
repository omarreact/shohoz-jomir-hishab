import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, importX509 } from "jose";

// Cache for Google's public keys
let publicKeysCache: Record<string, string> | null = null;
let keysCacheTime = 0;

async function getFirebasePublicKeys() {
  const now = Date.now();
  if (publicKeysCache && now - keysCacheTime < 1000 * 60 * 60) {
    return publicKeysCache;
  }
  try {
    const res = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } }
    );
    publicKeysCache = await res.json();
    keysCacheTime = now;
    return publicKeysCache;
  } catch (e) {
    console.error("Failed to fetch Firebase public keys", e);
    return null;
  }
}

async function verifyFirebaseToken(token: string) {
  try {
    const headerBase64 = token.split(".")[0];
    const header = JSON.parse(atob(headerBase64));
    const kid = header.kid;

    const keys = await getFirebasePublicKeys();
    if (!keys || !keys[kid]) {
      return null;
    }

    const publicKey = await importX509(keys[kid], "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`,
      audience: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });

    return payload;
  } catch (e) {
    return null;
  }
}

// In-memory rate limit tracking for Edge
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
  } else {
    if (windowData.count >= max) {
      return new NextResponse(
        JSON.stringify({ error: "Too Many Requests", requestId }),
        { status: 429, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    windowData.count++;
  }

  const cookieToken = request.cookies.get("access_token")?.value ?? null;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const rawToken = cookieToken ?? bearerToken;

  let userPayload: any = null;
  if (rawToken) {
    userPayload = await verifyFirebaseToken(rawToken);
    if (userPayload) {
      requestHeaders.set("x-user-id", userPayload.user_id);
      // The role must come securely from the custom claims. 
      // Do not use insecure fallbacks like email matching on the edge.
      const role = userPayload.role || 'User';
      requestHeaders.set("x-user-role", role);
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!userPayload) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    
    // Strict admin path check
    const role = requestHeaders.get("x-user-role");
    if (role !== "Admin" && role !== "Super Admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const publicApiPrefixes = [
    "/api/auth",
    "/api/metrics",
    "/api/rajuk/health",
    "/api/public",
    "/api/search",
    "/api/porcha",
    "/api/rajuk",
    "/api/unified",
    "/api/tiles",
    "/api/pages",
    "/api/blogs",
    "/api/comments",
  ];
  
  const isPublicApi = publicApiPrefixes.some((prefix) => pathname.startsWith(prefix));

  // Protect all internal APIs (unless public)
  if (pathname.startsWith("/api/") && !isPublicApi) {
    if (!userPayload) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized", requestId }),
        { status: 401, headers: { "Content-Type": "application/json", ...securityHeaders } }
      );
    }
    
    // Strict edge guard for ALL admin API routes
    if (pathname.startsWith("/api/admin/")) {
      const role = requestHeaders.get("x-user-role");
      if (role !== "Admin" && role !== "Super Admin") {
        return new NextResponse(
          JSON.stringify({ error: "Forbidden: Admin access required", requestId }),
          { status: 403, headers: { "Content-Type": "application/json", ...securityHeaders } }
        );
      }
    }
  }

  // Rewrite /dap-map API calls to ArcGIS backend using our server
  if (pathname.startsWith("/server/")) {
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
    headers: securityHeaders,
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|.*\\.png|.*\\.jpg|.*\\.svg|.*\\.webp).*)"],
};
