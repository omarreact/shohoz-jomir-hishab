import { FieldValue } from "firebase-admin/firestore";
import type { NextRequest } from "next/server";

import type { ServerUser } from "@/src/modules/auth/serverAuth";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export class AdminRequestError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminRequestError";
    this.status = status;
  }
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Browser admin mutations must originate from the same origin.
 * SameSite cookies already reduce CSRF risk; this is a second server-side gate.
 */
export function assertSameOriginMutation(req: NextRequest): void {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method.toUpperCase())) return;

  const secFetchSite = req.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "none") {
    throw new AdminRequestError("Invalid request origin", 403);
  }

  const origin = req.headers.get("origin");
  if (!origin) return;

  try {
    if (new URL(origin).origin !== req.nextUrl.origin) {
      throw new AdminRequestError("Invalid request origin", 403);
    }
  } catch (error) {
    if (error instanceof AdminRequestError) throw error;
    throw new AdminRequestError("Invalid request origin", 403);
  }
}

export async function protectAdminMutation(
  req: NextRequest,
  action: string,
  options: { max?: number; windowSeconds?: number; maxBodyBytes?: number } = {},
): Promise<void> {
  assertSameOriginMutation(req);

  const maxBodyBytes = options.maxBodyBytes ?? 2_500_000;
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (Number.isFinite(contentLength) && contentLength > maxBodyBytes) {
    throw new AdminRequestError("Request body too large", 413);
  }

  const ip = clientIp(req).slice(0, 64);
  const allowed = await allowRateLimit(
    `admin:${action}:${ip}`,
    options.max ?? 30,
    options.windowSeconds ?? 60,
  );
  if (!allowed) {
    throw new AdminRequestError("Too many requests", 429);
  }
}

export function adminErrorStatus(error: unknown): number {
  if (error instanceof AdminRequestError) return error.status;
  const message = error instanceof Error ? error.message : "";
  if (message === "Unauthorized") return 401;
  if (
    message === "Account disabled" ||
    message === "Account locked" ||
    message.startsWith("Forbidden")
  ) {
    return 403;
  }
  if (message === "Firebase Admin unavailable") return 503;
  return 500;
}

function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> | undefined {
  if (!metadata) return undefined;
  const safe: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(safe).length >= 20) break;
    if (value === null || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    } else if (typeof value === "string") {
      safe[key] = value.slice(0, 300);
    }
  }
  return safe;
}

export async function recordAdminAudit(
  req: NextRequest,
  actor: ServerUser,
  action: string,
  targetType: string,
  targetId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { db } = await import("@/src/modules/database/firebaseAdmin");
    await db.collection("adminAuditLog").add({
      actorId: actor.id,
      actorEmail: actor.email || null,
      actorRole: actor.role,
      action: action.slice(0, 120),
      targetType: targetType.slice(0, 80),
      targetId: targetId ? targetId.slice(0, 200) : null,
      requestId: req.headers.get("x-request-id") || null,
      metadata: sanitizeAuditMetadata(metadata) ?? null,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    // Audit logging must never make an already-authorized admin action fail.
    console.error(
      "[admin-audit] write failed:",
      error instanceof Error ? error.message : String(error),
    );
  }
}
