import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { logger } from "@/src/shared/logger";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

const adminService = new AdminService();

// GET /api/admin/health - System health check
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const health = await adminService.getSystemHealth();
    return NextResponse.json(health);
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    logger.error({ err: msg }, "Admin health check failed");
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json({ error: "হেলথ চেক ব্যর্থ হয়েছে।" }, { status: 500 });
  }
}
