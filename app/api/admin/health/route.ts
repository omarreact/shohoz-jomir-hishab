import { NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import "reflect-metadata";
import { container } from "tsyringe";
import { logger } from "@/lib/logger";

const adminService = container.resolve(AdminService);

// GET /api/admin/health - System health check
export async function GET() {
  try {
    const health = await adminService.getSystemHealth();
    return NextResponse.json(health);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: msg }, "Admin health check failed");
    return NextResponse.json({ error: "Health check failed" }, { status: 500 });
  }
}
