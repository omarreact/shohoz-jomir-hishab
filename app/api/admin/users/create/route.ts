import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { auth, collections } from "@/src/modules/database/firebaseAdmin";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]).default("Basic User"),
});

export async function POST(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    
    const body = await request.json();
    const validated = createUserSchema.parse(body);

    // 1. Create Firebase Auth user
    const userRecord = await auth.createUser({
      email: validated.email,
      password: validated.password,
      displayName: validated.name,
    });

    // 2. Set Custom Claims if Admin
    if (["Admin", "Super Admin"].includes(validated.role)) {
      await auth.setCustomUserClaims(userRecord.uid, { admin: true });
    }

    // 3. Create Firestore Profile
    const now = new Date();
    const userData = {
      email: validated.email,
      name: validated.name,
      role: validated.role,
      isVerified: false,
      status: "active",
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      failedAttempts: 0,
      lastLogin: null,
      lockedUntil: null,
    };

    try {
      await collections.users.doc(userRecord.uid).set(userData);
    } catch (firestoreError) {
      // Rollback Auth creation if Firestore fails
      await auth.deleteUser(userRecord.uid);
      throw new Error("Failed to create user profile in database. Auth account rolled back.");
    }

    return NextResponse.json({ 
      success: true, 
      data: { id: userRecord.uid, ...userData } 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error creating user:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, message: "Invalid input data", error: error.issues }, { status: 400 });
    }

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json({ success: false, message: "A user with this email already exists." }, { status: 409 });
    }

    return NextResponse.json(
      { success: false, message: error.message || "Failed to create user" }, 
      { status: error.message === "Unauthorized" ? 403 : 500 }
    );
  }
}
