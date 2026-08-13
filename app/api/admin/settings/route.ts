import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

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
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
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
  } catch (error: any) {
    console.error("Failed to fetch settings:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "সেটিংস লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}

// POST /api/admin/settings — upsert multiple settings at once
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
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
  } catch (error: any) {
    console.error("Failed to update settings:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "সেটিংস আপডেট করা যায়নি।" },
      { status: 500 },
    );
  }
}
