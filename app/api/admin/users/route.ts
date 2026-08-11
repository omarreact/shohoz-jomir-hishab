import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { z } from "zod";

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
  const adminService = new AdminService();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await adminService.getUsers(page, limit);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch users");
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// PATCH /api/admin/users - Update user role
export async function PATCH(request: NextRequest) {
  const adminService = new AdminService();
  try {
    const body = await request.json();
    const validated = roleSchema.parse(body);
    const result = await adminService.updateUserRole(
      validated.userId,
      validated.role,
    );
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to update user role");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST /api/admin/users - Suspend or unsuspend user
export async function POST(request: NextRequest) {
  const adminService = new AdminService();
  try {
    const body = await request.json();
    const { action, userId, durationHours } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "suspend") {
      const validated = suspendSchema.parse({ userId, durationHours });
      const result = await adminService.suspendUser(
        validated.userId,
        validated.durationHours,
      );
      return NextResponse.json(result);
    } else if (action === "unsuspend") {
      const result = await adminService.unsuspendUser(userId);
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: "Invalid action. Use 'suspend' or 'unsuspend'" },
        { status: 400 },
      );
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 },
      );
    }
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to process user action");
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
