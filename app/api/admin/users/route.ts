import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { z } from "zod";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["Basic User", "Editor", "Admin", "Super Admin"]),
});

const suspendSchema = z.object({
  userId: z.string().uuid(),
  durationHours: z.number().min(1).max(720).optional().default(24),
});

// GET /api/admin/users?page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const adminService = new AdminService();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await adminService.getUsers(page, limit);
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Failed to fetch users:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { success: false, message: "ব্যবহারকারীদের তথ্য লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const adminService = new AdminService();
    const body = await request.json();
    const validated = roleSchema.parse(body);
    const result = await adminService.updateUserRole(
      validated.userId,
      validated.role,
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "অবৈধ ইনপুট", error: error.issues },
        { status: 400 },
      );
    }
    console.error("Failed to update user role:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "ভূমিকা পরিবর্তন করা যায়নি।" }, { status: 500 });
  }
}

// POST /api/admin/users - Suspend or unsuspend user
export async function POST(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const adminService = new AdminService();
    const body = await request.json();
    const { action, userId, durationHours } = body;

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId প্রয়োজন" }, { status: 400 });
    }

    if (action === "suspend") {
      const validated = suspendSchema.parse({ userId, durationHours });
      const result = await adminService.suspendUser(
        validated.userId,
        validated.durationHours,
      );
      return NextResponse.json({ success: true, data: result });
    } else if (action === "unsuspend") {
      const result = await adminService.unsuspendUser(userId);
      return NextResponse.json({ success: true, data: result });
    } else {
      return NextResponse.json(
        { success: false, message: "অবৈধ অ্যাকশন" },
        { status: 400 },
      );
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "অবৈধ ইনপুট", error: error.issues },
        { status: 400 },
      );
    }
    console.error("Failed to process user action:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json({ success: false, message: "অ্যাকশন সম্পন্ন করা যায়নি।" }, { status: 500 });
  }
}
