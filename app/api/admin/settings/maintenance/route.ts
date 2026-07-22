import { NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

/**
 * Public endpoint — no auth required.
 * Returns the maintenance mode flag stored in the DB.
 * Falls back to false if the setting doesn't exist yet.
 */
export async function GET() {
  try {
    // We store site-wide settings as key/value pairs.
    // If you haven't added a Settings model yet, this simply returns false.
    // To enable maintenance mode, insert a row: key="maintenanceMode", value="true"
    const setting = await prisma.siteSetting
      .findUnique({ where: { key: "maintenanceMode" } })
      .catch(() => null);

    const isMaintenanceMode = setting?.value === "true";
    return NextResponse.json(
      { maintenanceMode: isMaintenanceMode },
      { status: 200 },
    );
  } catch {
    // Table doesn't exist yet — site is live
    return NextResponse.json({ maintenanceMode: false }, { status: 200 });
  }
}
