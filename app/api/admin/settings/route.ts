import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

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
    const settingsSnapshot = await collections.settings.where("key", "in", ALLOWED_KEYS).get();
    const rows = settingsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));

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
        collections.settings.doc(key).set(
          { key, value: String(val) },
          { merge: true }
        )
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
