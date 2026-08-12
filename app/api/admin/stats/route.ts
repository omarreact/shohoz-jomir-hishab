import { NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

// GET /api/admin/stats — data monitor dashboard stats
export async function GET() {
  try {
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
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
