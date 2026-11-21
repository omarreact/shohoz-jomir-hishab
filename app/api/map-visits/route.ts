import { NextRequest, NextResponse } from "next/server";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WINDOW_SECONDS = 10 * 60;
const MAX_HITS = 5;
const RETENTION_DAYS = 90;

type Body = {
  consent: boolean;
  visitorId?: string;
  locationGranted?: boolean;
  location?: { latitude?: number; longitude?: number; accuracy?: number; altitude?: number | null; heading?: number | null; speed?: number | null } | null;
  device?: Record<string, unknown>;
  page?: string;
  referrer?: string;
};

function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

function buildVisit(req: NextRequest, body: Body, ip: string) {
  const ua = req.headers.get("user-agent") || "";
  const acceptLang = req.headers.get("accept-language") || "";
  const safeVisitorId = String(body.visitorId || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) || null;
  const safeDevice: Record<string, unknown> = {};
  if (body.device && typeof body.device === "object" && !Array.isArray(body.device)) {
    for (const [k, v] of Object.entries(body.device)) {
      if (Object.keys(safeDevice).length >= 40) break;
      if (typeof v === "string" || typeof v === "number" || typeof v === "boolean" || v === null) {
        safeDevice[k] = typeof v === "string" ? v.slice(0, 500) : v;
      }
    }
  }

  let location: Record<string, number | null> | null = null;
  if (body.locationGranted && body.location) {
    const lat = Number(body.location.latitude), lng = Number(body.location.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      location = {
        latitude: lat,
        longitude: lng,
        accuracy: Number.isFinite(Number(body.location.accuracy)) ? Number(body.location.accuracy) : null,
        altitude: body.location.altitude != null && Number.isFinite(Number(body.location.altitude)) ? Number(body.location.altitude) : null,
        heading: body.location.heading != null && Number.isFinite(Number(body.location.heading)) ? Number(body.location.heading) : null,
        speed: body.location.speed != null && Number.isFinite(Number(body.location.speed)) ? Number(body.location.speed) : null,
      };
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return {
    safeVisitorId,
    safeDevice,
    location,
    now,
    expiresAt,
    doc: {
      visitorId: safeVisitorId,
      page: String(body.page || "/geospatial-map").slice(0, 120),
      referrer: String(body.referrer || "").slice(0, 400),
      locationGranted: Boolean(body.locationGranted),
      location,
      device: safeDevice,
      userAgent: ua.slice(0, 500),
      acceptLanguage: acceptLang.slice(0, 120),
      ip: ip === "unknown" ? null : ip.slice(0, 64),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      source: "geospatial-map-consent",
    },
  };
}

async function saveCloudflareVisit(
  visit: ReturnType<typeof buildVisit>,
): Promise<string> {
  const {
    adminCreateFirestoreDocument,
    adminGetFirestoreDocument,
    adminSetFirestoreDocument,
    hasFirebaseRestAdminCredentials,
    stripFirestoreMetadata,
  } = await import("@/src/modules/database/firebaseRest");

  if (!hasFirebaseRestAdminCredentials()) throw new Error("Database not configured");

  const id = await adminCreateFirestoreDocument("mapVisits", visit.doc);
  if (!visit.safeVisitorId) return id;

  const path = "mapVisitors/" + visit.safeVisitorId;
  for (let attempt = 0; attempt < 3; attempt++) {
    const current = await adminGetFirestoreDocument(path);
    const updateTime =
      current && typeof current.__updateTime === "string"
        ? current.__updateTime
        : undefined;
    const base = current ? stripFirestoreMetadata(current) : {};
    const aggregate: Record<string, unknown> = {
      ...base,
      visitorId: visit.safeVisitorId,
      firstSeen: base.firstSeen ?? visit.now.toISOString(),
      lastSeen: visit.now.toISOString(),
      visitCount: (typeof base.visitCount === "number" ? base.visitCount : 0) + 1,
      lastPage: visit.doc.page,
      lastReferrer: visit.doc.referrer || null,
      locationGranted: visit.doc.locationGranted,
      updatedAt: visit.now.toISOString(),
      expiresAt: visit.expiresAt.toISOString(),
    };
    if (visit.location) {
      aggregate.lastLocation = visit.location;
      aggregate.locationUpdatedAt = visit.now.toISOString();
    }
    if (Object.keys(visit.safeDevice).length) aggregate.device = visit.safeDevice;
    if (visit.doc.userAgent) aggregate.userAgent = visit.doc.userAgent;
    if (visit.doc.acceptLanguage) aggregate.acceptLanguage = visit.doc.acceptLanguage;
    if (visit.doc.ip) aggregate.ip = visit.doc.ip;

    try {
      await adminSetFirestoreDocument(path, aggregate, { updateTime });
      return id;
    } catch (error) {
      const conflict =
        error instanceof Error &&
        error.message.includes("optimistic concurrency conflict");
      if (!conflict || attempt === 2) throw error;
    }
  }
  return id;
}

async function saveFirebaseAdminVisit(
  visit: ReturnType<typeof buildVisit>,
): Promise<string> {
  const [{ FieldValue }, { collections, db, isFirebaseAdminReady }] = await Promise.all([
    import("firebase-admin/firestore"),
    import("@/src/modules/database/firebaseAdmin"),
  ]);
  if (!isFirebaseAdminReady()) throw new Error("Database not configured");

  const ref = await collections.mapVisits.add({
    ...visit.doc,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: visit.expiresAt,
  });

  if (visit.safeVisitorId) {
    const visitorRef = collections.mapVisitors.doc(visit.safeVisitorId);
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(visitorRef);
      const current = snap.exists ? snap.data() || {} : {};
      const now = FieldValue.serverTimestamp();
      const aggregate: Record<string, unknown> = {
        visitorId: visit.safeVisitorId,
        firstSeen: current.firstSeen ?? now,
        lastSeen: now,
        visitCount: (typeof current.visitCount === "number" ? current.visitCount : 0) + 1,
        lastPage: visit.doc.page,
        lastReferrer: visit.doc.referrer || null,
        locationGranted: visit.doc.locationGranted,
        updatedAt: now,
        expiresAt: visit.expiresAt,
      };
      if (visit.location) {
        aggregate.lastLocation = visit.location;
        aggregate.locationUpdatedAt = now;
      } else if (current.lastLocation) {
        aggregate.lastLocation = current.lastLocation;
        aggregate.locationUpdatedAt = current.locationUpdatedAt ?? null;
      }
      if (Object.keys(visit.safeDevice).length) aggregate.device = visit.safeDevice;
      if (visit.doc.userAgent) aggregate.userAgent = visit.doc.userAgent;
      if (visit.doc.acceptLanguage) aggregate.acceptLanguage = visit.doc.acceptLanguage;
      if (visit.doc.ip) aggregate.ip = visit.doc.ip;
      tx.set(visitorRef, aggregate, { merge: true });
    });
  }
  return ref.id;
}

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    const rateKey = ip === "unknown" ? "unknown" : ip.slice(0, 64);
    if (!(await allowRateLimit(`map-visits:ip:${rateKey}`, MAX_HITS, WINDOW_SECONDS))) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json()) as Body;
    if (!body?.consent) return NextResponse.json({ ok: false, error: "Consent required" }, { status: 400 });

    const visit = buildVisit(req, body, ip);
    const id =
      process.env.LANDBD_PLATFORM === "cloudflare-workers"
        ? await saveCloudflareVisit(visit)
        : await saveFirebaseAdminVisit(visit);

    return NextResponse.json({ ok: true, id });
  } catch (error) {
    console.error("[map-visits] POST", error);
    const message =
      error instanceof Error && error.message === "Database not configured"
        ? "Database not configured"
        : "Failed to save";
    return NextResponse.json(
      { ok: false, error: message },
      { status: message === "Database not configured" ? 503 : 500 },
    );
  }
}
