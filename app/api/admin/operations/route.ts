import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { db, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";
import { getServiceCatalog } from "@/src/lib/services-registry";
import { availablePinPayMethods, getPinPaySettings } from "@/src/features/pinpay/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const started = Date.now();
    const [pinpay, ai, reviewRequests, refunds, services] = await Promise.all([
      getPinPaySettings(),
      db.collection("landbdPrivateConfig").doc("aiProvider").get(),
      db.collection("landbdOrders").where("status", "==", "review_requested").count().get(),
      db.collection("landbdOrders").where("refundRequiresEntitlementReview", "==", true).count().get(),
      getServiceCatalog(),
    ]);
    const provider = ai.data() ?? {};
    let redisStatus: "connected" | "unavailable" | "not_configured" = "not_configured";
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      try {
        const pong = await new Redis({
          url: process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }).ping();
        redisStatus = pong === "PONG" ? "connected" : "unavailable";
      } catch { redisStatus = "unavailable"; }
    }
    const methods = availablePinPayMethods(pinpay);
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      deployment: { commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "unknown", region: process.env.VERCEL_REGION ?? "unknown" },
      firebase: { configured: isFirebaseAdminReady(), connected: true, latencyMs: Date.now() - started },
      redis: { status: redisStatus, distributedRateLimiting: redisStatus === "connected" },
      payments: {
        enabled: pinpay.enabled,
        mode: "manual_statement_verification",
        merchantConfigured: methods.length > 0,
        availableMethods: methods,
        riskReviewCount: reviewRequests.data().count,
        refundReviewCount: refunds.data().count,
      },
      ai: {
        enabled: provider.enabled === true,
        provider: provider.provider === "gemini" ? "gemini" : "openai",
        credentialConfigured: typeof provider.encryptedKey === "string" && provider.encryptedKey.length > 0,
      },
      cms: { versionHistoryEnabled: true },
      services: { total: services.length, enabled: services.filter(s => s.enabled).length, paid: services.filter(s => s.enabled && s.paid).length },
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    console.error("[LandBD operations]", e instanceof Error ? e.message : "Unavailable");
    return NextResponse.json({ error: "অপারেশন স্বাস্থ্য যাচাই সম্ভব হয়নি" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
