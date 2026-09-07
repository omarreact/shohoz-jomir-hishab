import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin-only one-time helper for populating the dashboard with clearly labelled demo records. */
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ success: false, message: "Database not ready" }, { status: 503 });
    }

    const existing = await collections.mapVisits.limit(1).get();
    if (!existing.empty) {
      return NextResponse.json({ success: true, created: 0, message: "বিদ্যমান ডেটা আছে—ডেমো ডেটা যোগ করা হয়নি।" });
    }

    const now = Date.now();
    const demo = [
      {
        page: "/geospatial-map",
        referrer: "direct",
        locationGranted: true,
        location: { latitude: 23.810331, longitude: 90.412521, accuracy: 35, altitude: null, heading: null, speed: null },
        device: { platform: "Android", language: "bn-BD", timezone: "Asia/Dhaka", screenWidth: 1080, screenHeight: 2412, connectionType: "4g", userAgent: "Demo Android device" },
        userAgent: "Demo Android device — sample record",
        ip: null,
        acceptLanguage: "bn-BD,bn,en-US,en",
        source: "demo-seed",
        demo: true,
        createdAt: new Date(now - 15 * 60 * 1000),
      },
      {
        page: "/geospatial-map",
        referrer: "https://landbd.pincodeit.com/",
        locationGranted: false,
        location: null,
        device: { platform: "Android", language: "en-US", timezone: "Asia/Dhaka", screenWidth: 1080, screenHeight: 2412, connectionType: "4g", userAgent: "Demo Android browser" },
        userAgent: "Demo Android browser — sample record",
        ip: null,
        acceptLanguage: "en-US,en,bn;q=0.8",
        source: "demo-seed",
        demo: true,
        createdAt: new Date(now - 42 * 60 * 1000),
      },
      {
        page: "/geospatial-map",
        referrer: "https://www.google.com/",
        locationGranted: true,
        location: { latitude: 23.780573, longitude: 90.407013, accuracy: 80, altitude: null, heading: null, speed: null },
        device: { platform: "Android", language: "bn-BD", timezone: "Asia/Dhaka", screenWidth: 1080, screenHeight: 2412, connectionType: "wifi", userAgent: "Demo Android browser" },
        userAgent: "Demo Android browser — sample record",
        ip: null,
        acceptLanguage: "bn-BD,bn,en-US,en",
        source: "demo-seed",
        demo: true,
        createdAt: new Date(now - 95 * 60 * 1000),
      },
    ];

    const batch = collections.mapVisits.firestore.batch();
    for (const row of demo) {
      const ref = collections.mapVisits.doc();
      batch.set(ref, { ...row, createdAt: FieldValue.serverTimestamp() });
    }
    await batch.commit();

    return NextResponse.json({ success: true, created: demo.length, message: "ডেমো ডেটা তৈরি হয়েছে।" });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "Unauthorized" || msg.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "অনুমতি নেই" }, { status: 403 });
    }
    console.error("[admin/map-visits/seed-demo]", error);
    return NextResponse.json({ success: false, message: "ডেমো ডেটা তৈরি ব্যর্থ" }, { status: 500 });
  }
}
