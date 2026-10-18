import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/src/modules/database/firebaseAdmin";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
import { PINPAY_PROVIDERS, normalizePinPayAmount } from "@/src/features/pinpay/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  eventId: z.string().uuid(),
  deviceId: z.string().min(8).max(100),
  provider: z.enum(PINPAY_PROVIDERS),
  receiver: z.string().trim().min(6).max(120),
  amountBdt: z.number().positive().max(500000),
  receivedAt: z.string().datetime(),
  providerReference: z.string().trim().max(100).optional(),
}).strict();

function verifySignature(secret: string, timestamp: string, raw: string, incoming: string) {
  if (!/^sha256=[a-f0-9]{64}$/i.test(incoming)) return false;
  const expected = createHmac("sha256", secret).update(timestamp + "." + raw).digest();
  const actual = Buffer.from(incoming.slice(7), "hex");
  return actual.length === expected.length && timingSafeEqual(expected, actual);
}

/**
 * Optional explicitly-consented Android bridge endpoint. HMAC authenticates
 * one registered device but does not authenticate the SMS / app notification.
 * SMS evidence NEVER transitions a payment to paid.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.PINPAY_BRIDGE_HMAC_SECRET;
  const registeredDevice = process.env.PINPAY_BRIDGE_DEVICE_ID;
  if (!secret || Buffer.byteLength(secret) < 32 || !registeredDevice) {
    return NextResponse.json({ error: "Bridge disabled" }, { status: 503 });
  }
  const timestamp = req.headers.get("x-pinpay-timestamp") ?? "";
  const signature = req.headers.get("x-pinpay-signature") ?? "";
  if (!/^\d{13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 90_000) {
    return NextResponse.json({ error: "Expired signed request" }, { status: 401 });
  }
  if (Number(req.headers.get("content-length") ?? "0") > 5000) {
    return NextResponse.json({ error: "Request too large" }, { status: 413 });
  }
  const raw = await req.text();
  if (Buffer.byteLength(raw) > 5000 || !verifySignature(secret, timestamp, raw, signature)) {
    return NextResponse.json({ error: "Invalid device signature" }, { status: 401 });
  }
  let input: z.infer<typeof eventSchema>;
  try {
    const parsed = eventSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) throw new Error("Bad evidence");
    input = parsed.data;
  } catch {
    return NextResponse.json({ error: "Invalid evidence" }, { status: 400 });
  }
  if (input.deviceId !== registeredDevice) return NextResponse.json({ error: "Unknown device" }, { status: 403 });

  try {
    if (!await allowDurableRateLimit("pinpay-bridge:" + registeredDevice, 30, 60)) {
      return NextResponse.json({ error: "Too many events" }, { status: 429 });
    }
    const amountPaisa = normalizePinPayAmount(input.amountBdt);
    const evidenceId = createHash("sha256").update(input.deviceId + ":" + input.eventId).digest("hex");
    const eventRef = db.collection("landbdPinPayEvidence").doc(evidenceId);

    // This bounded best-effort lookup cannot establish payment authenticity.
    // If more than one candidate fits, leave the event ambiguous for review.
    const recent = await db.collection("landbdOrders").orderBy("createdAt", "desc").limit(180).get();
    const signalTime = Date.parse(input.receivedAt);
    if (!Number.isFinite(signalTime) || Math.abs(signalTime - Date.now()) > 15 * 60_000) {
      return NextResponse.json({ error: "Evidence timestamp out of range" }, { status: 400 });
    }
    const candidates = recent.docs.filter(doc => {
      const d = doc.data();
      const created = Date.parse(d.createdAt);
      return d.gateway === "pinpay" && d.provider === input.provider &&
        d.receiver === input.receiver && d.amountPaisa === amountPaisa &&
        ["pending", "review_requested", "detected"].includes(d.status) &&
        Number.isFinite(created) && signalTime >= created - 60_000 &&
        signalTime <= created + 20 * 60_000;
    });

    const result = await db.runTransaction(async tx => {
      const seen = await tx.get(eventRef);
      if (seen.exists) return { duplicate: true, state: "duplicate" };
      const target = candidates.length === 1 ? candidates[0].ref : null;
      const snapshot = target ? await tx.get(target) : null;
      const matches = snapshot?.exists && snapshot.data()?.gateway === "pinpay" &&
        snapshot.data()?.amountPaisa === amountPaisa &&
        snapshot.data()?.receiver === input.receiver &&
        snapshot.data()?.provider === input.provider &&
        ["pending", "review_requested", "detected"].includes(snapshot.data()?.status);
      const state = candidates.length === 0 ? "unmatched" :
        candidates.length !== 1 || !matches ? "ambiguous" : "detected";
      tx.create(eventRef, {
        source: "android_notification_candidate",
        provider: input.provider, receiver: input.receiver,
        amountPaisa, reportedAt: input.receivedAt,
        deviceId: input.deviceId, providerReference: input.providerReference || null,
        candidateOrderIds: candidates.slice(0, 10).map(c => c.id),
        matchState: state, createdAt: new Date().toISOString(),
      });
      if (state === "detected" && target && snapshot?.data()?.status === "pending") {
        tx.update(target, { status: "detected", detectedAt: new Date().toISOString(),
          lastEvidenceId: evidenceId, updatedAt: new Date().toISOString() });
      }
      return { duplicate: false, state };
    });
    return NextResponse.json({ accepted: true, ...result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[PinPay bridge] evidence ingest failure", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Unable to store evidence" }, { status: 503 });
  }
}
