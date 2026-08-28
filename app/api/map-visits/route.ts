import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { collections, db, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hits = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}
function rateLimit(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > WINDOW_MS) { hits.set(ip, { n: 1, t: now }); return true; }
  if (row.n >= MAX_HITS) return false;
  row.n += 1;
  return true;
}

type Body = {
  consent: boolean;
  visitorId?: string;
  locationGranted?: boolean;
  location?: { latitude?: number; longitude?: number; accuracy?: number; altitude?: number | null; heading?: number | null; speed?: number | null } | null;
  device?: Record<string, unknown>;
  page?: string;
  referrer?: string;
};

export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseAdminReady()) return NextResponse.json({ ok: false, error: "Database not configured" }, { status: 503 });
    const ip = clientIp(req);
    if (!rateLimit(ip)) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    const body = (await req.json()) as Body;
    if (!body?.consent) return NextResponse.json({ ok: false, error: "Consent required" }, { status: 400 });

    const ua = req.headers.get("user-agent") || "";
    const acceptLang = req.headers.get("accept-language") || "";
    const safeVisitorId = String(body.visitorId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || null;
    const safeDevice: Record<string, unknown> = {};
    if (body.device && typeof body.device === "object" && !Array.isArray(body.device)) {
      for (const [k, v] of Object.entries(body.device)) {
        if (Object.keys(safeDevice).length >= 40) break;
        if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) safeDevice[k] = typeof v === "string" ? v.slice(0, 500) : v;
      }
    }

    let location: Record<string, number | null> | null = null;
    if (body.locationGranted && body.location) {
      const lat = Number(body.location.latitude), lng = Number(body.location.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        location = {
          latitude: lat, longitude: lng,
          accuracy: Number.isFinite(Number(body.location.accuracy)) ? Number(body.location.accuracy) : null,
          altitude: body.location.altitude != null && Number.isFinite(Number(body.location.altitude)) ? Number(body.location.altitude) : null,
          heading: body.location.heading != null && Number.isFinite(Number(body.location.heading)) ? Number(body.location.heading) : null,
          speed: body.location.speed != null && Number.isFinite(Number(body.location.speed)) ? Number(body.location.speed) : null,
        };
      }
    }

    const doc = {
      visitorId: safeVisitorId,
      page: String(body.page || "/geospatial-map").slice(0, 120),
      referrer: String(body.referrer || "").slice(0, 400),
      locationGranted: Boolean(body.locationGranted),
      location,
      device: safeDevice,
      userAgent: ua.slice(0, 500),
      acceptLanguage: acceptLang.slice(0, 120),
      ip: ip === "unknown" ? null : ip.slice(0, 64),
      createdAt: FieldValue.serverTimestamp(),
      source: "geospatial-map-consent",
    };

    const ref = await collections.mapVisits.add(doc);

    // Maintain a compact per-visitor aggregate. The transaction makes concurrent
    // visits safe and avoids the admin dashboard scanning only the latest 200 events.
    if (safeVisitorId) {
      const visitorRef = collections.mapVisitors.doc(safeVisitorId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(visitorRef);
        const current = snap.exists ? snap.data() || {} : {};
        const now = FieldValue.serverTimestamp();
        const aggregate: Record<string, unknown> = {
          visitorId: safeVisitorId,
          firstSeen: current.firstSeen ?? now,
          lastSeen: now,
          visitCount: (typeof current.visitCount === "number" ? current.visitCount : 0) + 1,
          lastPage: doc.page,
          lastReferrer: doc.referrer || null,
          locationGranted: doc.locationGranted,
          updatedAt: now,
        };
        if (location) {
          aggregate.lastLocation = location;
          aggregate.locationUpdatedAt = now;
        } else if (current.lastLocation) {
          aggregate.lastLocation = current.lastLocation;
          aggregate.locationUpdatedAt = current.locationUpdatedAt ?? null;
        }
        if (doc.device && Object.keys(safeDevice).length) aggregate.device = safeDevice;
        if (doc.userAgent) aggregate.userAgent = doc.userAgent;
        if (doc.acceptLanguage) aggregate.acceptLanguage = doc.acceptLanguage;
        if (doc.ip) aggregate.ip = doc.ip;
        tx.set(visitorRef, aggregate, { merge: true });
      });
    }

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("[map-visits] POST", error);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
