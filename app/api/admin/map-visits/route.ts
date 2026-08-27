import { NextRequest, NextResponse } from "next/server";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/admin/map-visits?limit=50 */
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    if (!isFirebaseAdminReady()) {
      return NextResponse.json({ success: false, message: "Database not ready" }, { status: 503 });
    }

    const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get("limit") || 50), 1), 200);
    const snap = await collections.mapVisits.orderBy("createdAt", "desc").limit(limit).get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      const createdAt = data.createdAt?.toDate?.()
        ? data.createdAt.toDate().toISOString()
        : data.createdAt ?? null;
      return { id: d.id, ...data, createdAt };
    });

    return NextResponse.json({ success: true, count: items.length, data: items });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "Unauthorized" || msg.includes("Forbidden")) {
      return NextResponse.json({ success: false, message: "অনুমতি নেই" }, { status: 403 });
    }
    console.error("[admin/map-visits]", error);
    return NextResponse.json({ success: false, message: "লোড ব্যর্থ" }, { status: 500 });
  }
}
