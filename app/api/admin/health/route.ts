import "reflect-metadata";
import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { container } from "tsyringe";
import { logger } from "@/lib/logger";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/admin/health - System health check
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const adminService = container.resolve(AdminService);
    const health = await adminService.getSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: msg }, "Admin health check failed");
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
