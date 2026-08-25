import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { claimsForRole } from "@/src/modules/auth/roles";
import { auth, collections } from "@/src/modules/database/firebaseAdmin";
import { z } from "zod";

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]).optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyAdminAuth(request);
    const { id } = await params;

    const body = await request.json();
    const validated = updateUserSchema.parse(body);

    const docRef = collections.users.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (validated.name) {
      await auth.updateUser(id, {
        displayName: validated.name,
      });
    }

    if (validated.role) {
      await auth.setCustomUserClaims(id, claimsForRole(validated.role));
    }

    const dataToUpdate: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (validated.name) dataToUpdate.name = validated.name;
    if (validated.role) dataToUpdate.role = validated.role;

    await docRef.update(dataToUpdate);

    const updatedDoc = await docRef.get();

    return NextResponse.json(
      {
        success: true,
        data: { id: updatedDoc.id, ...updatedDoc.data() },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid input data", error: error.issues },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to update user" },
      { status: error.message === "Unauthorized" ? 403 : 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await verifyAdminAuth(request);
    const { id } = await params;

    const docRef = collections.users.doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    try {
      await auth.deleteUser(id);
    } catch (authError: any) {
      if (authError.code !== "auth/user-not-found") {
        throw authError;
      }
    }

    await docRef.update({
      status: "deleted",
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("Error deleting user:", error);

    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete user" },
      { status: error.message === "Unauthorized" ? 403 : 500 },
    );
  }
}
