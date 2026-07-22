import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

// Keys we persist in SiteSetting
const ALLOWED_KEYS = [
  "siteName",
  "contactEmail",
  "contactPhone",
  "facebookUrl",
  "youtubeUrl",
  "maintenanceMode",
  "announcement",
];

// GET /api/admin/settings — returns all settings as a flat object
export async function GET() {
  try {
    const rows = await prisma.siteSetting.findMany({
      where: { key: { in: ALLOWED_KEYS } },
    });

    const result: Record<string, string | boolean> = {
      siteName: "LandBD",
      contactEmail: "",
      contactPhone: "",
      facebookUrl: "",
      youtubeUrl: "",
      maintenanceMode: false,
      announcement: "",
    };

    for (const row of rows) {
      if (row.key === "maintenanceMode") {
        result[row.key] = row.value === "true";
      } else {
        result[row.key] = row.value;
      }
    }

    return NextResponse.json({ settings: result }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/settings — upsert multiple settings at once
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const ops = Object.entries(body)
      .filter(([key]) => ALLOWED_KEYS.includes(key))
      .map(([key, val]) =>
        prisma.siteSetting.upsert({
          where: { key },
          update: { value: String(val) },
          create: { key, value: String(val) },
        }),
      );

    await Promise.all(ops);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
