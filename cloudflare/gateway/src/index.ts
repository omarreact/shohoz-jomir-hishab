import { importX509, jwtVerify } from "jose";

import {
  getDefaultPageAccessRules,
  getPageAccessLevel,
  type PageAccessLevel,
} from "../../../src/shared/config/pageAccess";
import {
  isAdminRole,
  isStaffRole,
  isSuperAdminRole,
} from "../../../src/modules/auth/roles";

type Fetcher = {
  fetch(request: Request): Promise<Response>;
};

export type GatewayEnv = {
  LANDBD_APP: Fetcher;
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: string;
  PROXY_RATE_LIMIT_WINDOW?: string;
  PROXY_RATE_LIMIT_MAX?: string;
};

type ProxyUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
};

type SiteAccessPolicy = {
  maintenanceMode: boolean;
  pageAccess: Record<string, PageAccessLevel>;
  pageAccessUpdatedAt: string | null;
  degraded: boolean;
  reason?: string;
  loadedAt: number;
};

const FIREBASE_KEYS_TTL_MS = 60 * 60 * 1000;
const POLICY_TTL_MS = 5_000;

let publicKeysCache: Record<string, string> | null = null;
let keysCacheTime = 0;
let policyCache:
  | {
      value: SiteAccessPolicy;
      expiresAt: number;
    }
  | null = null;

const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

const PUBLIC_API_PREFIXES = [
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
  "/api/ward-data",
  "/api/wards",
  "/api/zones",
  "/api/authorities",
  "/api/dncc-directory",
] as const;

const MAINTENANCE_ESSENTIAL_PATHS = new Set([
  "/login",
  "/maintenance",
  "/api/public/maintenance",
  "/api/public/access-policy",
]);

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

function isMaintenanceEssentialPath(pathname: string): boolean {
  if (MAINTENANCE_ESSENTIAL_PATHS.has(pathname)) return true;
  return matchesPrefix(pathname, "/api/auth");
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function isStaticBypass(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/_next/image") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    /\.(?:png|jpe?g|svg|webp|ico|woff2?)$/i.test(pathname)
  );
}

function securityHeaders(requestId: string): Record<string, string> {
  return {
    "x-request-id": requestId,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(self), payment=(self), usb=()",
  };
}

function withSecurityHeaders(response: Response, requestId: string): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(name, value);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;

  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;

    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }

  return null;
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

function failClosedPolicy(reason: string): SiteAccessPolicy {
  return {
    maintenanceMode: true,
    pageAccess: policyCache?.value.pageAccess ?? getDefaultPageAccessRules(),
    pageAccessUpdatedAt: policyCache?.value.pageAccessUpdatedAt ?? null,
    degraded: true,
    reason,
    loadedAt: Date.now(),
  };
}

async function getSiteAccessPolicy(
  request: Request,
  env: GatewayEnv,
): Promise<SiteAccessPolicy> {
  const now = Date.now();
  if (policyCache && policyCache.expiresAt > now) return policyCache.value;

  try {
    const url = new URL("/api/public/access-policy", request.url);
    const response = await env.LANDBD_APP.fetch(
      new Request(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "x-landbd-gateway-internal": "1",
        },
      }),
    );

    if (!response.ok) {
      throw new Error(`site-access-policy-${response.status}`);
    }

    const body = (await response.json()) as Partial<SiteAccessPolicy>;
    if (
      typeof body.maintenanceMode !== "boolean" ||
      !body.pageAccess ||
      typeof body.pageAccess !== "object" ||
      typeof body.degraded !== "boolean"
    ) {
      throw new Error("site-access-policy-invalid");
    }

    const policy: SiteAccessPolicy = {
      maintenanceMode: body.maintenanceMode,
      pageAccess: body.pageAccess as Record<string, PageAccessLevel>,
      pageAccessUpdatedAt:
        typeof body.pageAccessUpdatedAt === "string"
          ? body.pageAccessUpdatedAt
          : null,
      degraded: body.degraded,
      ...(typeof body.reason === "string" ? { reason: body.reason } : {}),
      loadedAt:
        typeof body.loadedAt === "number" ? body.loadedAt : Date.now(),
    };

    policyCache = { value: policy, expiresAt: now + POLICY_TTL_MS };
    return policy;
  } catch (error) {
    const reason =
      error instanceof Error ? error.message : "site-access-policy-failed";
    const policy = failClosedPolicy(reason);
    policyCache = { value: policy, expiresAt: now + POLICY_TTL_MS };
    return policy;
  }
}

async function getFirebasePublicKeys(): Promise<Record<string, string> | null> {
  const now = Date.now();
  if (publicKeysCache && now - keysCacheTime < FIREBASE_KEYS_TTL_MS) {
    return publicKeysCache;
  }

  try {
    const response = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { cache: "no-store" },
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

async function verifyFirebaseToken(
  token: string,
  projectId: string,
): Promise<Record<string, unknown> | null> {
  try {
    if (!projectId) return null;

    const header = decodeJwtHeader(token);
    const kid = typeof header?.kid === "string" ? header.kid : null;
    if (!kid) return null;

    const keys = await getFirebasePublicKeys();
    if (!keys?.[kid]) return null;

    const publicKey = await importX509(keys[kid], "RS256");
    const { payload } = await jwtVerify(token, publicKey, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function getAuthoritativeUser(
  request: Request,
  env: GatewayEnv,
  token: string,
): Promise<ProxyUser> {
  const url = new URL("/api/auth/me", request.url);
  const response = await env.LANDBD_APP.fetch(
    new Request(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        "x-landbd-gateway-internal": "1",
      },
    }),
  );

  if (!response.ok) {
    throw new Error(
      response.status === 403 ? "Account disabled or locked" : "Unauthorized",
    );
  }

  const body = (await response.json()) as { user?: ProxyUser };
  if (!body.user?.id) throw new Error("Unauthorized");
  return body.user;
}

async function forwardToApp(
  request: Request,
  env: GatewayEnv,
  requestHeaders: Headers,
  requestId: string,
): Promise<Response> {
  const upstream = await env.LANDBD_APP.fetch(
    new Request(request, { headers: requestHeaders }),
  );
  return withSecurityHeaders(upstream, requestId);
}

function loginRedirect(request: Request, requestId: string): Response {
  const url = new URL(request.url);
  const login = new URL("/login", url.origin);
  login.searchParams.set("from", url.pathname + url.search);

  return new Response(null, {
    status: 307,
    headers: {
      Location: login.toString(),
      ...securityHeaders(requestId),
    },
  });
}

function forbiddenRedirect(request: Request, requestId: string): Response {
  return new Response(null, {
    status: 307,
    headers: {
      Location: new URL("/403", request.url).toString(),
      ...securityHeaders(requestId),
    },
  });
}

async function maintenancePageResponse(
  request: Request,
  env: GatewayEnv,
  requestId: string,
): Promise<Response> {
  const upstream = await env.LANDBD_APP.fetch(
    new Request(new URL("/maintenance", request.url), {
      method: "GET",
      headers: { Accept: "text/html", "x-landbd-gateway-internal": "1" },
    }),
  );
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("Retry-After", "300");
  headers.set("x-landbd-maintenance", "1");
  for (const [name, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(name, value);
  }

  return new Response(upstream.body, { status: 503, headers });
}

function maintenanceApiResponse(requestId: string): Response {
  return Response.json(
    {
      error: "maintenance",
      maintenanceMode: true,
      message: "LandBD is temporarily under maintenance.",
      requestId,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "300",
        "x-landbd-maintenance": "1",
        ...securityHeaders(requestId),
      },
    },
  );
}

async function hiddenPageResponse(
  request: Request,
  env: GatewayEnv,
  requestId: string,
): Promise<Response> {
  const upstream = await env.LANDBD_APP.fetch(
    new Request(new URL("/403", request.url), {
      method: "GET",
      headers: { Accept: "text/html", "x-landbd-gateway-internal": "1" },
    }),
  );
  const headers = new Headers(upstream.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex, nofollow");
  for (const [name, value] of Object.entries(securityHeaders(requestId))) {
    headers.set(name, value);
  }

  return new Response(upstream.body, { status: 404, headers });
}

function unauthorizedApiResponse(requestId: string): Response {
  return Response.json(
    { error: "Unauthorized", requestId },
    {
      status: 401,
      headers: securityHeaders(requestId),
    },
  );
}

function tooManyRequestsResponse(requestId: string): Response {
  return Response.json(
    { error: "Too Many Requests", requestId },
    {
      status: 429,
      headers: {
        "Retry-After": "60",
        ...securityHeaders(requestId),
      },
    },
  );
}

export function __resetGatewayStateForTests(): void {
  publicKeysCache = null;
  keysCacheTime = 0;
  policyCache = null;
  rateLimitMap.clear();
}

export async function handleGatewayRequest(
  request: Request,
  env: GatewayEnv,
): Promise<Response> {
  const url = new URL(request.url);
  const { pathname } = url;
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-request-id", requestId);

  if (isStaticBypass(pathname)) {
    return forwardToApp(request, env, requestHeaders, requestId);
  }

  const ip = clientIp(request);
  const windowMs = Number.parseInt(env.PROXY_RATE_LIMIT_WINDOW || "60000", 10);
  const max = Number.parseInt(env.PROXY_RATE_LIMIT_MAX || "100", 10);
  const now = Date.now();
  const windowData = rateLimitMap.get(ip);

  if (!windowData || now > windowData.expiresAt) {
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
  } else if (windowData.count >= max) {
    return tooManyRequestsResponse(requestId);
  } else {
    windowData.count += 1;
  }

  if (rateLimitMap.size > 10_000) {
    for (const [key, value] of rateLimitMap) {
      if (value.expiresAt <= now) rateLimitMap.delete(key);
    }
  }

  const rawToken = readCookie(request, "access_token") ?? bearerToken(request);
  let userPayload: Record<string, unknown> | null = null;

  if (rawToken) {
    userPayload = await verifyFirebaseToken(
      rawToken,
      env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    );

    if (userPayload) {
      requestHeaders.set(
        "x-user-id",
        String(userPayload.user_id || userPayload.sub || ""),
      );
      requestHeaders.set(
        "x-user-role",
        String(
          userPayload.role ||
            (userPayload.admin === true ? "Admin" : "User"),
        ),
      );
    }
  }

  let authoritativeUserPromise: Promise<ProxyUser> | null = null;
  async function authoritativeUser(): Promise<ProxyUser> {
    if (!rawToken) throw new Error("Unauthorized");

    authoritativeUserPromise ??= getAuthoritativeUser(request, env, rawToken);
    const user = await authoritativeUserPromise;
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-role", user.role);
    return user;
  }

  const maintenanceEssential = isMaintenanceEssentialPath(pathname);
  const policy = maintenanceEssential
    ? null
    : await getSiteAccessPolicy(request, env);

  if (policy?.maintenanceMode && !maintenanceEssential) {
    if (!userPayload) {
      return pathname.startsWith("/api/")
        ? maintenanceApiResponse(requestId)
        : maintenancePageResponse(request, env, requestId);
    }

    try {
      await authoritativeUser();
    } catch {
      return pathname.startsWith("/api/")
        ? maintenanceApiResponse(requestId)
        : maintenancePageResponse(request, env, requestId);
    }
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!userPayload) return loginRedirect(request, requestId);

    try {
      const user = await authoritativeUser();
      if (!isStaffRole(user.role)) {
        return forbiddenRedirect(request, requestId);
      }
    } catch {
      return loginRedirect(request, requestId);
    }
  }

  const shouldApplyPagePolicy =
    !pathname.startsWith("/api/") &&
    pathname !== "/login" &&
    pathname !== "/maintenance" &&
    pathname !== "/403" &&
    !pathname.startsWith("/admin");

  if (shouldApplyPagePolicy && policy) {
    const required = getPageAccessLevel(pathname, policy.pageAccess);

    if (required === "hidden") {
      return hiddenPageResponse(request, env, requestId);
    }

    if (required === "logged_in") {
      if (!userPayload) return loginRedirect(request, requestId);
      try {
        await authoritativeUser();
      } catch {
        return loginRedirect(request, requestId);
      }
    }

    if (required === "admin" || required === "super_admin") {
      if (!userPayload) return loginRedirect(request, requestId);

      try {
        const user = await authoritativeUser();
        const permitted =
          required === "admin"
            ? isAdminRole(user.role)
            : isSuperAdminRole(user.role);
        if (!permitted) return forbiddenRedirect(request, requestId);
      } catch {
        return loginRedirect(request, requestId);
      }
    }
  }

  if (pathname.startsWith("/api/") && !isPublicApi(pathname) && !userPayload) {
    return unauthorizedApiResponse(requestId);
  }

  return forwardToApp(request, env, requestHeaders, requestId);
}

export default {
  fetch(request: Request, env: GatewayEnv): Promise<Response> {
    return handleGatewayRequest(request, env);
  },
};
