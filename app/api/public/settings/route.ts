import { NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

const ALLOWED_KEYS = [
  "siteName",
  "contactEmail",
  "contactPhone",
  "facebookUrl",
  "youtubeUrl",
  "announcement",
];

export async function GET() {
  try {
    const settingsSnapshot = await collections.settings.where("key", "in", ALLOWED_KEYS).get();
    const result: Record<string, string> = {
      siteName: "LandBD",
      contactEmail: "",
      contactPhone: "",
      facebookUrl: "",
      youtubeUrl: "",
      announcement: "",
    };

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
