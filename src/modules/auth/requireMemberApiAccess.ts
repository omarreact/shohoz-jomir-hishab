import "server-only";

import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";

/** Fail closed for member APIs exposing personal record data. */
export async function requireMemberApiAccess(request: NextRequest): Promise<NextResponse | null> {
  try {
    await verifyServerAuth(request, { requireAdminBackend: true, checkRevoked: true });
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    const status = message === "Firebase Admin unavailable" ? 503
      : message === "Account disabled" || message === "Account locked" ? 403 : 401;
    const code = status === 503 ? "AUTH_BACKEND_UNAVAILABLE"
      : status === 403 ? "ACCOUNT_UNAVAILABLE" : "AUTH_REQUIRED";
    return NextResponse.json(
      { ok: false, code, error: status === 503
        ? "Authentication service is temporarily unavailable."
        : status === 403 ? "Account unavailable." : "Sign in to use this service." },
      { status, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
