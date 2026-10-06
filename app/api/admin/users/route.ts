import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { claimsForRole, isSuperAdminRole, normalizeRole } from "@/src/modules/auth/roles";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";
import { AdminService } from "@/src/modules/admin/admin.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const firebaseUidSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes("/"), "Invalid Firebase UID");

const roleSchema = z.object({
  userId: firebaseUidSchema,
  role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]),
});

const userActionSchema = z.object({
  action: z.enum(["suspend", "unsuspend"]),
  userId: firebaseUidSchema,
  durationHours: z.coerce.number().int().min(1).max(720).optional().default(72),
});

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function GET(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const adminService = new AdminService();
    const page = Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(request.nextUrl.searchParams.get("limit") || "50", 10) || 50),
    );

    const result = await adminService.getUsers(page, limit);
    return json({ success: true, data: result });
  } catch (error: unknown) {
    console.error("Failed to fetch users:", error);
    return json(
      {
        success: false,
        message: adminErrorStatus(error) < 500
          ? "আপনার অনুমতি নেই।"
          : "ব্যবহারকারীদের তথ্য লোড করা যায়নি।",
      },
      adminErrorStatus(error),
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await protectAdminMutation(request, "users-role", { max: 20, windowSeconds: 60 });
    const actor = await verifyAdminAuth(request);
    const validated = roleSchema.parse(await request.json());
    const { auth, collections } = await import("@/src/modules/database/firebaseAdmin");

    if (validated.userId === actor.id) {
      return json(
        { success: false, message: "নিজের রোল পরিবর্তন করা যাবে না।" },
        400,
      );
    }

    const ref = collections.users.doc(validated.userId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return json({ success: false, message: "User not found" }, 404);
    }

    const currentRole = normalizeRole(snapshot.data()?.role);
    if (
      (currentRole === "Super Admin" || validated.role === "Super Admin") &&
      !isSuperAdminRole(actor.role)
    ) {
      return json(
        { success: false, message: "শুধুমাত্র Super Admin এই রোল পরিবর্তন করতে পারেন।" },
        403,
      );
    }

    await auth.setCustomUserClaims(validated.userId, claimsForRole(validated.role));
    await ref.update({
      role: validated.role,
      updatedAt: new Date().toISOString(),
    });

    await recordAdminAudit(
      request,
      actor,
      "user.role.update",
      "user",
      validated.userId,
      { fromRole: currentRole, toRole: validated.role },
    );

    return json({
      success: true,
      data: {
        id: validated.userId,
        email: snapshot.data()?.email || "",
        name: snapshot.data()?.name || null,
        role: validated.role,
      },
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "অবৈধ ইনপুট", error: error.issues }, 400);
    }
    console.error("Failed to update user role:", error);
    return json(
      {
        success: false,
        message: adminErrorStatus(error) < 500
          ? (error instanceof Error ? error.message : "আপনার অনুমতি নেই।")
          : "ভূমিকা পরিবর্তন করা যায়নি।",
      },
      adminErrorStatus(error),
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await protectAdminMutation(request, "users-state", { max: 20, windowSeconds: 60 });
    const actor = await verifyAdminAuth(request);
    const validated = userActionSchema.parse(await request.json());
    const { collections } = await import("@/src/modules/database/firebaseAdmin");

    if (validated.userId === actor.id) {
      return json(
        { success: false, message: "নিজের অ্যাকাউন্ট সাসপেন্ড/আনসাসপেন্ড করা যাবে না।" },
        400,
      );
    }

    const ref = collections.users.doc(validated.userId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      return json({ success: false, message: "User not found" }, 404);
    }

    const targetRole = normalizeRole(snapshot.data()?.role);
    if (targetRole === "Super Admin" && !isSuperAdminRole(actor.role)) {
      return json(
        { success: false, message: "Super Admin অ্যাকাউন্ট পরিবর্তনের অনুমতি নেই।" },
        403,
      );
    }

    if (validated.action === "suspend") {
      const lockedUntil = new Date(
        Date.now() + validated.durationHours * 60 * 60 * 1000,
      );
      await ref.update({
        lockedUntil,
        failedAttempts: 5,
        updatedAt: new Date().toISOString(),
      });
      await recordAdminAudit(
        request,
        actor,
        "user.suspend",
        "user",
        validated.userId,
        { durationHours: validated.durationHours, targetRole },
      );
      return json({
        success: true,
        data: { id: validated.userId, lockedUntil: lockedUntil.toISOString() },
      });
    }

    await ref.update({
      lockedUntil: null,
      failedAttempts: 0,
      updatedAt: new Date().toISOString(),
    });
    await recordAdminAudit(
      request,
      actor,
      "user.unsuspend",
      "user",
      validated.userId,
      { targetRole },
    );

    return json({ success: true, data: { id: validated.userId, lockedUntil: null } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "অবৈধ ইনপুট", error: error.issues }, 400);
    }
    console.error("Failed to process user action:", error);
    return json(
      {
        success: false,
        message: adminErrorStatus(error) < 500
          ? (error instanceof Error ? error.message : "আপনার অনুমতি নেই।")
          : "অ্যাকশন সম্পন্ন করা যায়নি।",
      },
      adminErrorStatus(error),
    );
  }
}
