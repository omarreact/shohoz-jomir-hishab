import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

// GET /api/admin/metrics - User metrics
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const adminService = new AdminService();
    const metrics = await adminService.getUserMetrics();
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("Admin metrics fetch failed:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "মেট্রিক্স লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}
