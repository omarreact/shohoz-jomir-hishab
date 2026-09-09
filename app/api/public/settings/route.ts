import { NextResponse } from "next/server";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";

const ALLOWED_KEYS = [
  "siteName",
  "contactEmail",
  "contactPhone",
  "facebookUrl",
  "youtubeUrl",
  "announcement",
];

const DEFAULT_SETTINGS: Record<string, string> = {
  siteName: "LandBD",
  contactEmail: "",
  contactPhone: "",
  facebookUrl: "",
  youtubeUrl: "",
  announcement: "",
};

export async function GET() {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ settings: DEFAULT_SETTINGS }, { status: 200 });
  }

  try {
    const settingsSnapshot = await collections.settings.where("key", "in", ALLOWED_KEYS).get();
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };

    for (const doc of settingsSnapshot.docs) {
      const data = doc.data();
      result[data.key] = data.value;
    }

    return NextResponse.json({ settings: result }, { status: 200 });
  } catch (error: any) {
    console.error("Failed to fetch public settings:", error);
    return NextResponse.json({ settings: {} }, { status: 200 });
  }
}
