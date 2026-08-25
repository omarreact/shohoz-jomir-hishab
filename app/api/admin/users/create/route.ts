import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { claimsForRole } from "@/src/modules/auth/roles";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
  name: z.string().trim().min(1),
  role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]).default("Basic User"),
});

function json(data: unknown, status = 200, requestId?: string) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      ...(requestId ? { "X-Request-Id": requestId } : {}),
    },
  });
}

function jsonError(message: string, status = 500, error?: unknown, requestId?: string) {
  return json(
    {
      success: false,
      message: message || "Internal server error",
      ...(requestId ? { requestId } : {}),
      ...(error ? { error } : {}),
    },
    status,
    requestId,
  );
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  let createdUid: string | null = null;

  try {
    await verifyAdminAuth(request);
    const { auth, collections } = await import("@/src/modules/database/firebaseAdmin");

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Request body must be valid JSON", 400, undefined, requestId);
    }

    const validated = createUserSchema.parse(body);

    const userRecord = await auth.createUser({
      email: validated.email,
      password: validated.password,
      displayName: validated.name,
    });
    createdUid = userRecord.uid;

    // Custom claims for Security Rules + client (role + admin flag)
    await auth.setCustomUserClaims(userRecord.uid, claimsForRole(validated.role));

    const now = new Date().toISOString();
    const userData = {
      email: validated.email,
      name: validated.name,
      role: validated.role,
      isVerified: false,
      status: "active",
      createdAt: now,
      updatedAt: now,
      failedAttempts: 0,
      lastLogin: null,
      lockedUntil: null,
    };

    try {
      await collections.users.doc(userRecord.uid).set(userData);
    } catch {
      try {
        await auth.deleteUser(userRecord.uid);
        createdUid = null;
      } catch (rollbackError) {
        console.error("User create rollback failed:", rollbackError);
      }
      throw new Error(
        "Failed to create user profile in database. Auth account was rolled back where possible.",
      );
    }

    return json(
      { success: true, data: { id: userRecord.uid, ...userData }, requestId },
      201,
      requestId,
    );
  } catch (error: any) {
    console.error("POST /api/admin/users/create failed:", {
      requestId,
      uid: createdUid,
      error,
    });

    if (error instanceof z.ZodError) {
      return jsonError("Invalid input data", 400, error.issues, requestId);
    }

    if (error?.code === "auth/email-already-exists") {
      return jsonError("A user with this email already exists.", 409, undefined, requestId);
    }

    if (error?.code === "auth/invalid-password") {
      return jsonError("Password must be at least 6 characters.", 400, undefined, requestId);
    }

    if (error?.code === "auth/invalid-email") {
      return jsonError("Please provide a valid email address.", 400, undefined, requestId);
    }

    const status =
      error?.message === "Unauthorized"
        ? 401
        : error?.message?.startsWith("Forbidden")
          ? 403
          : 500;

    return jsonError(error?.message || "Failed to create user", status, undefined, requestId);
  }
}
