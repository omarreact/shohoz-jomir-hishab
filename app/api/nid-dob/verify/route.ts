import { NextRequest, NextResponse } from "next/server";
import { NidLookupRequestSchema } from "@/src/features/nid-dob/schema";
import { normalizeNidResponse } from "@/src/features/nid-dob/normalize";
import {
  PorichoyError,
  porichoyConfigured,
  verifyNidWithPorichoy,
} from "@/src/features/nid-dob/porichoy";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = "sin1";

const secureHeaders = {
  "cache-control": "private, no-store, no-cache, max-age=0, must-revalidate",
  pragma: "no-cache",
  expires: "0",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
};

function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return false;

  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function authErrorStatus(error: unknown): number {
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized") return 401;
  if (message.startsWith("Forbidden:")) return 403;
  if (message === "Account disabled" || message === "Account locked") return 403;
  return 500;
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  let user;
  try {
    user = await verifyAdminAuth(request);
  } catch (error) {
    const status = authErrorStatus(error);
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error:
          status === 401
            ? "Authentication required."
            : status === 403
              ? "Admin access required."
              : "Authentication could not be verified.",
      },
      { status, headers: secureHeaders },
    );
  }

  if (!sameOrigin(request)) {
    return NextResponse.json(
      { ok: false, requestId, error: "Cross-origin request rejected." },
      { status: 403, headers: secureHeaders },
    );
  }

  const allowed = await allowRateLimit(`nid-dob:${user.id}`, 12, 60);
  if (!allowed) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Too many verification requests. Please try again shortly.",
      },
      { status: 429, headers: secureHeaders },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, requestId, error: "Invalid JSON request." },
      { status: 400, headers: secureHeaders },
    );
  }

  const parsed = NidLookupRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: parsed.error.issues[0]?.message || "Invalid verification request.",
      },
      { status: 400, headers: secureHeaders },
    );
  }

  if (!porichoyConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        code: "PORICHOY_NOT_CONFIGURED",
        error: "Authorized NID provider is not enabled on this deployment.",
      },
      { status: 503, headers: secureHeaders },
    );
  }

  try {
    const result = await verifyNidWithPorichoy(parsed.data);
    const record = normalizeNidResponse(result.data);

    if (record.nidNumber && record.nidNumber !== parsed.data.nidNumber) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          code: "PROVIDER_IDENTITY_MISMATCH",
          error: "Provider returned a record for a different NID.",
        },
        { status: 502, headers: secureHeaders },
      );
    }

    if (record.dateOfBirth && record.dateOfBirth !== parsed.data.dateOfBirth) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          code: "PROVIDER_DOB_MISMATCH",
          error: "Provider returned a record with a different date of birth.",
        },
        { status: 502, headers: secureHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        requestId,
        provider: "Porichoy",
        responseTimeMs: result.durationMs,
        verifiedAt: new Date().toISOString(),
        record,
      },
      { status: 200, headers: secureHeaders },
    );
  } catch (error) {
    if (error instanceof PorichoyError) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          code: error.code,
          error: error.message,
          upstreamStatus: error.upstreamStatus ?? null,
        },
        { status: error.status, headers: secureHeaders },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Unexpected NID verification error.",
      },
      { status: 500, headers: secureHeaders },
    );
  }
}
