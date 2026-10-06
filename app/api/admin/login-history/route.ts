import { NextRequest, NextResponse } from "next/server";
import { AdminService } from "@/src/modules/admin/admin.service";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

// GET /api/admin/login-history?page=1&limit=50
export async function GET(request: NextRequest) {
  try {
    await verifyAdminAuth(request);
    const adminService = new AdminService();
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(searchParams.get("limit") || "50", 10) || 50),
    );

    const result = await adminService.getLoginHistory(page, limit);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Failed to fetch login history:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "লগিন হিস্ট্রি লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}
