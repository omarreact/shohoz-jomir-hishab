import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

// GET /api/admin/stats — data monitor dashboard stats
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const [
      blogCountRes,
      pageCountRes,
      userCountRes,
      rajukTokenDoc,
      maintenanceSettingDoc,
      announcementDoc,
    ] = await Promise.all([
      collections.blogs.count().get(),
      collections.pages.count().get(),
      collections.users.count().get(),
      collections.settings.doc("rajuk_api_token").get(),
      collections.settings.doc("maintenanceMode").get(),
      collections.settings.doc("announcement").get(),
    ]);

    const rajukToken = rajukTokenDoc.data();
    const maintenanceSetting = maintenanceSettingDoc.data();
    const announcement = announcementDoc.data();

    return NextResponse.json(
      {
        blogCount: blogCountRes.data().count,
        pageCount: pageCountRes.data().count,
        userCount: userCountRes.data().count,
        rajukTokenSet: !!rajukToken?.value,
        maintenanceMode: maintenanceSetting?.value === "true",
        announcement: announcement?.value ?? "",
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to load stats:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "স্ট্যাটস লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}
