import { NextResponse } from "next/server";

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
  try {
    const result: Record<string, string> = { ...DEFAULT_SETTINGS };

    if (process.env.LANDBD_PLATFORM === "cloudflare-workers") {
      const { adminQueryFirestore, hasFirebaseRestAdminCredentials } = await import(
        "@/src/modules/database/firebaseRest"
      );
      if (!hasFirebaseRestAdminCredentials()) {
        return NextResponse.json({ settings: result }, { status: 200 });
      }
      const docs = await adminQueryFirestore("siteSettings", [
        { field: "key", op: "IN", value: ALLOWED_KEYS },
      ]);
      for (const data of docs) {
        if (
          data.public === true &&
          typeof data.key === "string" &&
          ALLOWED_KEYS.includes(data.key) &&
          typeof data.value === "string"
        ) {
          result[data.key] = data.value;
        }
      }
      return NextResponse.json({ settings: result }, { status: 200 });
    }

    const { collections, isFirebaseAdminReady } = await import(
      "@/src/modules/database/firebaseAdmin"
    );
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ settings: result }, { status: 200 });
    }
    const settingsSnapshot = await collections.settings.where("key", "in", ALLOWED_KEYS).get();
    for (const doc of settingsSnapshot.docs) {
      const data = doc.data();
      result[data.key] = data.value;
    }
    return NextResponse.json({ settings: result }, { status: 200 });
  } catch (error) {
    console.error("Failed to fetch public settings:", error);
    return NextResponse.json({ settings: DEFAULT_SETTINGS }, { status: 200 });
  }
}
