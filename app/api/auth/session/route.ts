import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/src/modules/database/firebaseAdmin";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "access_token";
const MAX_COOKIE_AGE_SECONDS = 60 * 60;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

function bearerToken(req: NextRequest): string | null {
  const header = req.headers.get("authorization");
  return header?.startsWith("Bearer ") ? header.slice(7).trim() || null : null;
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

/**
 * Exchanges a Firebase ID token for LandBD's server-readable auth cookie.
 *
 * The cookie intentionally stores the short-lived Firebase ID token because
 * proxy.ts verifies that token with Google's public keys before privileged
 * routing decisions. The important hardening here is that the browser can no
 * longer read or overwrite the cookie through document.cookie.
 */
export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) {
    return json({ error: "Invalid request origin" }, 403);
  }

  const ip = clientIp(req).slice(0, 64);
  if (!(await allowRateLimit(`auth-session:${ip}`, 30, 60))) {
    return json({ error: "Too many authentication requests" }, 429);
  }

  const token = bearerToken(req);
  if (!token) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    // Check Firebase Auth revocation/disable state when the browser refreshes
    // the server session. Route-level auth remains server-authoritative.
    const decoded = await auth.verifyIdToken(token, true);
    const user = await verifyServerAuth(req);

    const now = Math.floor(Date.now() / 1000);
    const maxAge = Math.max(
      1,
      Math.min(MAX_COOKIE_AGE_SECONDS, decoded.exp - now),
    );

    const response = json({ ok: true, user }, 200);
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge,
      priority: "high",
    });
    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status =
      message === "Account disabled" || message === "Account locked" ? 403 : 401;
    return json({ error: status === 403 ? message : "Unauthorized" }, status);
  }
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) {
    return json({ error: "Invalid request origin" }, 403);
  }

  const response = json({ ok: true }, 200);
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    priority: "high",
  });
  return response;
}
