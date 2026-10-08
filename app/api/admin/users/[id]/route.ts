import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { claimsForRole, isSuperAdminRole, normalizeRole } from "@/src/modules/auth/roles";
import {
  adminErrorStatus,
  protectAdminMutation,
  recordAdminAudit,
} from "@/src/modules/security/adminSecurity";

const firebaseUidSchema = z
  .string()
  .trim()
  .min(1)
  .max(128)
  .refine((value) => !value.includes("/"), "Invalid Firebase UID");

const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]).optional(),
  })
  .refine((value) => value.name !== undefined || value.role !== undefined, {
    message: "No changes supplied",
  });

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await protectAdminMutation(request, "user-update", { max: 20, windowSeconds: 60 });
    const actor = await verifyAdminAuth(request);
    const { id: rawId } = await params;
    const id = firebaseUidSchema.parse(rawId);
    const validated = updateUserSchema.parse(await request.json());
    const { auth, collections } = await import("@/src/modules/database/firebaseAdmin");

    const docRef = collections.users.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return json({ success: false, message: "User not found" }, 404);
    }

    const existingRole = normalizeRole(docSnap.data()?.role);

    if (validated.role && id === actor.id && validated.role !== existingRole) {
      return json(
        { success: false, message: "নিজের রোল পরিবর্তন করা যাবে না।" },
        400,
      );
    }

    if (
      (existingRole === "Super Admin" || validated.role === "Super Admin") &&
      !isSuperAdminRole(actor.role)
    ) {
      return json(
        { success: false, message: "শুধুমাত্র Super Admin এই রোল পরিবর্তন করতে পারেন।" },
        403,
      );
    }

    if (validated.name) {
      await auth.updateUser(id, { displayName: validated.name });
    }

    if (validated.role) {
      await auth.setCustomUserClaims(id, claimsForRole(validated.role));
      await auth.revokeRefreshTokens(id);
    }

    const dataToUpdate: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };
    if (validated.name) dataToUpdate.name = validated.name;
    if (validated.role) dataToUpdate.role = validated.role;

    await docRef.update(dataToUpdate);

    await recordAdminAudit(
      request,
      actor,
      "user.update",
      "user",
      id,
      {
        changedName: Boolean(validated.name),
        fromRole: existingRole,
        toRole: validated.role || existingRole,
      },
    );

    const updatedDoc = await docRef.get();
    return json({
      success: true,
      data: { id: updatedDoc.id, ...updatedDoc.data() },
    });
  } catch (error: unknown) {
    console.error("Error updating user:", error);
    if (error instanceof z.ZodError) {
      return json(
        { success: false, message: "Invalid input data", error: error.issues },
        400,
      );
    }
    const status = adminErrorStatus(error);
    return json(
      {
        success: false,
        message:
          status < 500 && error instanceof Error
            ? error.message
            : "Failed to update user",
      },
      status,
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await protectAdminMutation(request, "user-delete", { max: 10, windowSeconds: 60 });
    const actor = await verifyAdminAuth(request);
    const { id: rawId } = await params;
    const id = firebaseUidSchema.parse(rawId);
    const { auth, collections } = await import("@/src/modules/database/firebaseAdmin");

    if (id === actor.id) {
      return json(
        { success: false, message: "নিজের অ্যাকাউন্ট মুছতে পারবেন না।" },
        400,
      );
    }

    const docRef = collections.users.doc(id);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      return json({ success: false, message: "User not found" }, 404);
    }

    const targetRole = normalizeRole(docSnap.data()?.role);
    if (targetRole === "Super Admin" && !isSuperAdminRole(actor.role)) {
      return json(
        { success: false, message: "Super Admin মুছে ফেলার অনুমতি নেই।" },
        403,
      );
    }

    try {
      await auth.deleteUser(id);
    } catch (authError: unknown) {
      const code =
        typeof authError === "object" && authError && "code" in authError
          ? String((authError as { code?: unknown }).code || "")
          : "";
      if (code !== "auth/user-not-found") throw authError;
    }

    await docRef.update({
      status: "deleted",
      updatedAt: new Date().toISOString(),
    });

    await recordAdminAudit(
      request,
      actor,
      "user.delete",
      "user",
      id,
      { targetRole, email: String(docSnap.data()?.email || "") },
    );

    return json({ success: true });
  } catch (error: unknown) {
    console.error("Error deleting user:", error);
    if (error instanceof z.ZodError) {
      return json({ success: false, message: "Invalid user id" }, 400);
    }
    const status = adminErrorStatus(error);
    return json(
      {
        success: false,
        message:
          status < 500 && error instanceof Error
            ? error.message
            : "Failed to delete user",
      },
      status,
    );
  }
}
