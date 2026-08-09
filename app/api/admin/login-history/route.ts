import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { container } from "tsyringe";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/admin/login-history?page=1&limit=50
export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const adminService = container.resolve(AdminService);
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await adminService.getLoginHistory(page, limit);
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Failed to fetch login history");
    return NextResponse.json(
      { error: "Failed to fetch login history" },
      { status: 500 },
    );
  }
}
