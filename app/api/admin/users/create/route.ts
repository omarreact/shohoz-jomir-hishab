import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { claimsForRole, isSuperAdminRole } from "@/src/modules/auth/roles";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createUserSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
  name: z.string().trim().max(100).optional().default(""),
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

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  let createdUid: string | null = null;

  try {
    await protectAdminMutation(request, "users-create", {
      max: 10,
      windowSeconds: 60,
      maxBodyBytes: 20_000,
    });
    const actor = await verifyAdminAuth(request);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ success: false, message: "Request body must be valid JSON" }, 400, requestId);
    }

    const validated = createUserSchema.parse(body);

    if (validated.role === "Super Admin" && !isSuperAdminRole(actor.role)) {
      return json(
        { success: false, message: "শুধুমাত্র Super Admin নতুন Super Admin তৈরি করতে পারেন।" },
        403,
        requestId,
      );
    }

    const { auth, collections } = await import("@/src/modules/database/firebaseAdmin");
    const userRecord = await auth.createUser({
      email: validated.email,
      password: validated.password,
      ...(validated.name ? { displayName: validated.name } : {}),
    });
    createdUid = userRecord.uid;

    await auth.setCustomUserClaims(userRecord.uid, claimsForRole(validated.role));

    const now = new Date().toISOString();
    const userData = {
      email: validated.email,
      name: validated.name || null,
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
      throw new Error("Failed to create user profile in database");
    }

    await recordAdminAudit(
      request,
      actor,
      "user.create",
      "user",
      userRecord.uid,
      { role: validated.role, email: validated.email },
    );

    return json(
      { success: true, data: { id: userRecord.uid, ...userData }, requestId },
      201,
      requestId,
    );
  } catch (error: unknown) {
    console.error("POST /api/admin/users/create failed:", {
      requestId,
      uid: createdUid,
      error,
    });

    if (error instanceof z.ZodError) {
      return json(
        { success: false, message: "Invalid input data", error: error.issues, requestId },
        400,
        requestId,
      );
    }

    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code || "")
        : "";

    if (code === "auth/email-already-exists") {
      return json({ success: false, message: "A user with this email already exists." }, 409, requestId);
    }
    if (code === "auth/invalid-email" || code === "auth/invalid-password") {
      return json({ success: false, message: "Invalid email or password." }, 400, requestId);
    }

    const status = adminErrorStatus(error);
    return json(
      {
        success: false,
        message:
          status < 500 && error instanceof Error
            ? error.message
            : "Failed to create user",
        requestId,
      },
      status,
      requestId,
    );
  }
}
