import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { importX509, jwtVerify } from "jose";

import { getPageAccessLevel } from "@/src/shared/config/pageAccess";
import { getSiteAccessPolicy } from "@/src/modules/access/server/siteAccessPolicy";
import { verifyServerAuth, type ServerUser } from "@/src/modules/auth/serverAuth";
import { getAdminMinimumRole } from "@/src/shared/routing/route-registry";
import { isAnonymousApiRequest } from "@/src/shared/routing/api-route-registry";
import {
  isAdminRole,
  isStaffRole,
  isSuperAdminRole,
} from "@/src/modules/auth/roles";

let publicKeysCache: Record<string, string> | null = null;
let keysCacheTime = 0;

const FIREBASE_KEYS_TTL_MS = 60 * 60 * 1000;

async function getFirebasePublicKeys() {
  const now = Date.now();

  if (publicKeysCache && now - keysCacheTime < FIREBASE_KEYS_TTL_MS) {
    return publicKeysCache;
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } },
    );

    if (!response.ok) return null;

    publicKeysCache = (await response.json()) as Record<string, string>;
    keysCacheTime = now;
    return publicKeysCache;
  } catch {
    return null;
  }
}

function decodeJwtHeader(token: string): Record<string, unknown> | null {
  try {
    const encoded = token.split(".")[0];
    if (!encoded) return null;

    const normalized = encoded
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encoded.length / 4) * 4, "=");

    return JSON.parse(atob(normalized)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function verifyFirebaseToken(token: string) {
  try {
    const header = decodeJwtHeader(token);
    const kid = typeof header?.kid === "string" ? header.kid : null;
    if (!kid) return null;

    const keys = await getFirebasePublicKeys();
    if (!keys?.[kid]) return null;

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return null;

    const publicKey = await importX509(keys[kid], "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return payload;
  } catch {
    return null;
  }
}

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

const MAINTENANCE_ESSENTIAL_PATHS = new Set([
  "/login",
  "/maintenance",
  "/api/public/maintenance",
]);

function adminPathAllowed(pathname: string, role: unknown): boolean {
  const minimum = getAdminMinimumRole(pathname);
  if (minimum === "super_admin") return isSuperAdminRole(role);
  if (minimum === "admin") return isAdminRole(role);
  return isStaffRole(role);
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isMaintenanceEssentialPath(pathname: string): boolean {
  if (MAINTENANCE_ESSENTIAL_PATHS.has(pathname)) return true;
  return matchesPrefix(pathname, "/api/auth");
}

function securityResponseHeaders(requestId: string, pathname: string): Record<string, string> {
  // Browser PDF blobs inherit the viewer page's CSP. Keep reports same-origin
  // frameable for their local PDF viewer, without allowing external embedding.
  const pdfViewerPage = pathname === "/dlrms-khatian" || pathname === "/mouza-porcha-report";
  return {
    "x-request-id": requestId,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": pdfViewerPage ? "SAMEORIGIN" : "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": pdfViewerPage
      ? "base-uri 'self'; object-src 'none'; frame-ancestors 'self'; frame-src 'self' blob:; form-action 'self'"
      : "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
    "Cross-Origin-Opener-Policy": "same-origin",
    "X-DNS-Prefetch-Control": "off",
    "X-Permitted-Cross-Domain-Policies": "none",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(self), payment=(self), usb=()",
  };
}

function loginRedirect(
  request: NextRequest,
  headers: Record<string, string>,
) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set(
    "from",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.redirect(loginUrl, { headers });
}

function forbiddenRedirect(
  request: NextRequest,
  headers: Record<string, string>,
) {
  return NextResponse.redirect(new URL("/403", request.url), { headers });
}

function hiddenPageResponse(
  request: NextRequest,
  headers: Record<string, string>,
) {
  return NextResponse.rewrite(new URL("/403", request.url), {
    status: 404,
    headers: {
      ...headers,
      "Cache-Control": "no-store",
    },
  });
}

function maintenancePageResponse(
  request: NextRequest,
  headers: Record<string, string>,
) {
  const url = request.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";

  return NextResponse.rewrite(url, {
    status: 503,
    headers: {
      ...headers,
      "Cache-Control": "no-store",
      "Retry-After": "300",
      "x-landbd-maintenance": "1",
    },
  });
}

function maintenanceApiResponse(
  requestId: string,
  headers: Record<string, string>,
) {
  return NextResponse.json(
    {
      error: "maintenance",
      maintenanceMode: true,
      message: "LandBD is temporarily under maintenance.",
      requestId,
    },
    {
      status: 503,
      headers: {
        ...headers,
        "Cache-Control": "no-store",
        "Retry-After": "300",
        "x-landbd-maintenance": "1",
      },
    },
  );
}

function unauthorizedApiResponse(
  requestId: string,
  headers: Record<string, string>,
) {
  return NextResponse.json(
    { error: "Unauthorized", requestId },
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    },
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  const securityHeaders = securityResponseHeaders(requestId, pathname);

  // Best-effort per-instance burst protection only. Route-level distributed
  // limits remain authoritative where configured.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const windowMs = parseInt(process.env.PROXY_RATE_LIMIT_WINDOW || "60000", 10);
  const max = parseInt(process.env.PROXY_RATE_LIMIT_MAX || "100", 10);
  const now = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData || now > windowData.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
  } else if (windowData.count >= max) {
    return new NextResponse(
      JSON.stringify({ error: "Too Many Requests", requestId }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...securityHeaders,
        },
      },
    );
  } else {
    windowData.count++;
  }

  if (rateLimitMap.size > 10_000) {
    for (const [key, value] of rateLimitMap) {
      if (value.expiresAt <= now) rateLimitMap.delete(key);
    }
  }

  const cookieToken = request.cookies.get("access_token")?.value ?? null;
  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;
  const rawToken = bearerToken ?? cookieToken;

  let userPayload: Record<string, unknown> | null = null;

  // Admin routes rely on Firebase Admin verification, not an extra Google X509
  // network request that can fail while the signed server session is valid.
  if (rawToken && !isAdminPath) {
    userPayload = (await verifyFirebaseToken(rawToken)) as Record<
      string,
      unknown
    > | null;

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

  let authoritativeUserPromise: Promise<ServerUser> | null = null;
  let privilegedAdminUserPromise: Promise<ServerUser> | null = null;

  async function authoritativeUser(): Promise<ServerUser> {
    if (!rawToken) throw new Error("Unauthorized");

    if (!authoritativeUserPromise) {
      authoritativeUserPromise = verifyServerAuth(request);
    }

    const user = await authoritativeUserPromise;
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-role", user.role);
    return user;
  }

  async function privilegedAdminUser(): Promise<ServerUser> {
    if (!rawToken) throw new Error("Unauthorized");
    if (!privilegedAdminUserPromise) {
      // Fail closed: require Admin SDK, current account state, and non-revoked
      // Firebase session on all privileged pages (including Editor dashboard).
      privilegedAdminUserPromise = verifyServerAuth(request, {
        requireAdminBackend: true,
        checkRevoked: true,
      });
    }
    const user = await privilegedAdminUserPromise;
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-role", user.role);
    return user;
  }

  const authenticatedFullAccess =
    process.env.LANDBD_AUTHENTICATED_FULL_ACCESS === "true";
  let hasAuthenticatedFullAccess = false;

  if (authenticatedFullAccess && userPayload) {
    try {
      await authoritativeUser();
      hasAuthenticatedFullAccess = true;
    } catch {
      hasAuthenticatedFullAccess = false;
    }
  }

  const maintenanceEssential = isMaintenanceEssentialPath(pathname);

  // Firestore is authoritative: OFF keeps public pages available; ON blocks
  // anonymous traffic while allowing verified users and essential auth routes.
  const policy = maintenanceEssential ? null : await getSiteAccessPolicy();

  if (policy?.maintenanceMode && !maintenanceEssential) {
    if (!rawToken) {
      return pathname.startsWith("/api/")
        ? maintenanceApiResponse(requestId, securityHeaders)
        : maintenancePageResponse(request, securityHeaders);
    }

    try {
      if (isAdminPath) await privilegedAdminUser();
      else await authoritativeUser();
    } catch {
      return pathname.startsWith("/api/")
        ? maintenanceApiResponse(requestId, securityHeaders)
        : maintenancePageResponse(request, securityHeaders);
    }
  }

  // Admin is excluded from the configurable page registry so a bad page rule
  // can never lock the control plane itself.
  if (isAdminPath) {
    if (!rawToken) {
      return loginRedirect(request, securityHeaders);
    }

    try {
      const user = await privilegedAdminUser();

      // Never trust unverified client roles or the general full-access flag.
      if (!adminPathAllowed(pathname, user.role)) {
        return forbiddenRedirect(request, securityHeaders);
      }
    } catch (error) {
      if (error instanceof Error && error.message === "Firebase Admin unavailable") {
        return new NextResponse("Admin authentication is temporarily unavailable.", {
          status: 503,
          headers: { ...securityHeaders, "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" },
        });
      }
      return loginRedirect(request, securityHeaders);
    }
  }

  const shouldApplyPagePolicy =
    !pathname.startsWith("/api/") &&
    pathname !== "/login" &&
    pathname !== "/maintenance" &&
    pathname !== "/403" &&
    !pathname.startsWith("/admin");

  if (shouldApplyPagePolicy && policy && !hasAuthenticatedFullAccess) {
    const required = getPageAccessLevel(pathname, policy.pageAccess);

    if (required === "hidden") {
      return hiddenPageResponse(request, securityHeaders);
    }

    if (required === "logged_in") {
      if (!userPayload) {
        return loginRedirect(request, securityHeaders);
      }

      try {
        await authoritativeUser();
      } catch {
        return loginRedirect(request, securityHeaders);
      }
    }

    if (required === "admin" || required === "super_admin") {
      if (!userPayload) {
        return loginRedirect(request, securityHeaders);
      }

      try {
        const user = await authoritativeUser();
        const permitted =
          required === "admin"
            ? isAdminRole(user.role)
            : isSuperAdminRole(user.role);

        if (!permitted) {
          return forbiddenRedirect(request, securityHeaders);
        }
      } catch {
        return loginRedirect(request, securityHeaders);
      }
    }
  }

  // Route-method classifications are exact, not broad /api/* prefix exemptions.
  // Presence of a session only permits routing onward: handlers verify signed
  // identity and permissions authoritatively, avoiding duplicate SDK calls here.
  if (pathname.startsWith("/api/") && !isAnonymousApiRequest(pathname, request.method) && !rawToken) {
    return unauthorizedApiResponse(requestId, securityHeaders);
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
