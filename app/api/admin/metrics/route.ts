import { NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";

// GET /api/admin/metrics - User metrics
export async function GET() {
  const adminService = new AdminService();
  try {
    const metrics = await adminService.getUserMetrics();
    return NextResponse.json(metrics);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin metrics fetch failed");
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
