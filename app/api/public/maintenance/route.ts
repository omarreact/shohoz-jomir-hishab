import { NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

/**
 * Public endpoint — no auth required.
 * Returns the maintenance mode flag stored in the DB.
 * Falls back to false if the setting doesn't exist yet.
 */
export async function GET() {
  try {
    const settingDoc = await collections.settings.doc("maintenanceMode").get();
    const setting = settingDoc.data();

    const isMaintenanceMode = setting?.value === "true";
    return NextResponse.json(
      { maintenanceMode: isMaintenanceMode },
      { status: 200 },
    );
  } catch {
    // Collection doesn't exist yet — site is live
    return NextResponse.json({ maintenanceMode: false }, { status: 200 });
  }
}
