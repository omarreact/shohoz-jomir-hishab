import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

// GET /api/admin/stats — data monitor dashboard stats
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const [
      blogCount,
      pageCount,
      userCount,
      rajukToken,
      maintenanceSetting,
      announcement,
    ] = await Promise.all([
      prisma.blog.count(),
      prisma.customPage.count(),
      prisma.user.count(),
      prisma.siteSetting.findUnique({ where: { key: "rajuk_api_token" } }),
      prisma.siteSetting.findUnique({ where: { key: "maintenanceMode" } }),
      prisma.siteSetting.findUnique({ where: { key: "announcement" } }),
    ]);

    return NextResponse.json(
      {
        blogCount,
        pageCount,
        userCount,
        rajukTokenSet: !!rajukToken?.value,
        maintenanceMode: maintenanceSetting?.value === "true",
        announcement: announcement?.value ?? "",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
