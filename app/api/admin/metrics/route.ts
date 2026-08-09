import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { container } from "tsyringe";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/admin/metrics - User metrics
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  const adminService = container.resolve(AdminService);
  try {
    const metrics = await adminService.getUserMetrics();
    return NextResponse.json(metrics);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Admin metrics fetch failed:", msg);
    return NextResponse.json(
      { error: "Failed to fetch metrics" },
      { status: 500 },
    );
  }
}
