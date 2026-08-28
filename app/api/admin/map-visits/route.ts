import { NextRequest, NextResponse } from "next/server";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MapVisit = {
  id: string;
  visitorId?: string | null;
  createdAt: string | null;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number | null;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
  } | null;
  locationGranted?: boolean;
  page?: string;
  referrer?: string;
  device?: Record<string, unknown>;
  userAgent?: string;
  acceptLanguage?: string;
  ip?: string | null;
  source?: string;
  [key: string]: any;
};

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ success: false, message: "Database not ready" }, { status: 503 });
    }

    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") || 100), 1), 200);
    const snap = await collections.mapVisits.orderBy("createdAt", "desc").limit(limit).get();

    const raw: MapVisit[] = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? null;

      return {
        id: d.id,
        ...data,
        createdAt,
      } as MapVisit;
    });

    // Group visits by the browser's stable visitorId.
    // A visit without a new GPS fix never erases that visitor's previously known location.
    const visitors = new Map<string, any>();

    for (const visit of raw) {
      const key = visit.visitorId || `legacy:${visit.id}`;
      const existing = visitors.get(key);

      if (!existing) {
        visitors.set(key, {
          ...visit,
          lastSeen: visit.createdAt,
          lastLocation: visit.location || null,
          locationUpdatedAt: visit.location ? visit.createdAt : null,
          visitCount: 1,
        });
      } else {
        existing.visitCount += 1;
        if (visit.location && !existing.lastLocation) {
          existing.lastLocation = visit.location;
          existing.locationUpdatedAt = visit.createdAt;
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: visitors.size,
      data: Array.from(visitors.values()),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "Unauthorized" || msg.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "অনুমতি নেই" }, { status: 403 });
    }
    console.error("[admin/map-visits]", error);
    return NextResponse.json({ success: false, message: "লোড ব্যর্থ" }, { status: 500 });
  }
}
