import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";

// GET /api/admin/login-history?page=1&limit=50
export async function GET(request: NextRequest) {
  const adminService = new AdminService();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const result = await adminService.getLoginHistory(page, limit);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Failed to fetch login history");
    return NextResponse.json(
      { error: "Failed to fetch login history" },
      { status: 500 },
    );
  }
}
