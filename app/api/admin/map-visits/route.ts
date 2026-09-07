import { NextRequest, NextResponse } from "next/server";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MapVisitor = {
  id: string;
  visitorId?: string | null;
  firstSeen: string | null;
  lastSeen: string | null;
  visitCount: number;
  lastLocation?: Record<string, unknown> | null;
  locationUpdatedAt?: string | null;
  [key: string]: unknown;
};

function timestampToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const date = (value as { toDate?: () => Date }).toDate?.();
    return date instanceof Date ? date.toISOString() : null;
  }
  return typeof value === "string" ? value : null;
}

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    if (!isFirebaseAdminReady()) return NextResponse.json({ success: false, message: "Database not ready" }, { status: 503 });

    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") || 100), 1), 500);
    const snap = await collections.mapVisitors.orderBy("lastSeen", "desc").limit(limit).get();

    const data: MapVisitor[] = snap.docs.map((d) => {
      const value = d.data();
      return {
        id: d.id,
        ...value,
        firstSeen: timestampToIso(value.firstSeen),
        lastSeen: timestampToIso(value.lastSeen),
        locationUpdatedAt: timestampToIso(value.locationUpdatedAt),
        visitCount: typeof value.visitCount === "number" ? value.visitCount : 0,
      };
    });

    return NextResponse.json({ success: true, count: data.length, data });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "Unauthorized" || msg.includes("Forbidden")) return NextResponse.json({ success: false, message: "অনুমতি নেই" }, { status: 403 });
    console.error("[admin/map-visits]", error);
    return NextResponse.json({ success: false, message: "লোড ব্যর্থ" }, { status: 500 });
  }
}
