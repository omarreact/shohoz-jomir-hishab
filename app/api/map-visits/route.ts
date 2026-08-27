import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Simple in-memory rate limit: max 5 posts per IP per 10 minutes */
const hits = new Map<string, { n: number; t: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 5;

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const row = hits.get(ip);
  if (!row || now - row.t > WINDOW_MS) {
    hits.set(ip, { n: 1, t: now });
    return true;
  }
  if (row.n >= MAX_HITS) return false;
  row.n += 1;
  return true;
}

type Body = {
  consent: boolean;
  locationGranted?: boolean;
  location?: {
    latitude?: number;
    longitude?: number;
    accuracy?: number;
  } | null;
  page?: string;
};

/**
 * POST /api/map-visits — location-only (no device fingerprint fields).
 */
export async function POST(req: NextRequest) {
  try {
    if (!isFirebaseAdminReady()) {
      return NextResponse.json(
        { ok: false, error: "Database not configured" },
        { status: 503 },
      );
    }

    const ip = clientIp(req);
    if (!rateLimit(ip)) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json()) as Body;
    if (!body?.consent) {
      return NextResponse.json({ ok: false, error: "Consent required" }, { status: 400 });
    }

    let location: Record<string, number | null> | null = null;
    if (body.locationGranted && body.location) {
      const lat = Number(body.location.latitude);
      const lng = Number(body.location.longitude);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
      ) {
        location = {
          latitude: lat,
          longitude: lng,
          accuracy: Number.isFinite(Number(body.location.accuracy))
            ? Number(body.location.accuracy)
            : null,
        };
      }
    }

    const doc = {
      page: String(body.page || "/geospatial-map").slice(0, 120),
      locationGranted: Boolean(body.locationGranted),
      location,
      createdAt: FieldValue.serverTimestamp(),
      source: "geospatial-map-consent",
    };

    const ref = await collections.mapVisits.add(doc);

    return NextResponse.json({ ok: true, id: ref.id });
  } catch (error) {
    console.error("[map-visits] POST", error);
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}
