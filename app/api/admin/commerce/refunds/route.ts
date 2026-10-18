import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
import { isPinPayOrderId } from "@/src/features/pinpay/types";
import { recordAdminAudit } from "@/src/modules/security/adminSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("request"), orderId: z.string(),
    reason: z.string().trim().min(12).max(250),
    confirmation: z.string().max(80),
  }).strict(),
  z.object({
    action: z.literal("confirm"), orderId: z.string(),
    refundReference: z.string().trim().min(6).max(100),
    refundAmountBdt: z.number().positive(),
    fundsReturnedChecked: z.literal(true),
  }).strict(),
]);

/** Review-only refund workflow. NO endpoint triggers a bank/MFS transfer. */
export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Origin denied" }, { status: 403 });
  }
  let actor: Awaited<ReturnType<typeof verifySuperAdminAuth>>;
  try { actor = await verifySuperAdminAuth(req); }
  catch { return NextResponse.json({ error: "Super Admin required" }, { status: 403 }); }
  try {
    if (!await allowDurableRateLimit("pinpay:refund:" + actor.id, 6, 60)) {
      return NextResponse.json({ error: "অনুরোধ সীমা অতিক্রম করেছে" }, { status: 429 });
    }
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success || !isPinPayOrderId(parsed.data.orderId)) {
      return NextResponse.json({ error: "Invalid refund request" }, { status: 400 });
    }
    const input = parsed.data;
    const orderRef = db.collection("landbdOrders").doc(input.orderId);
    if (input.action === "request") {
      if (input.confirmation !== "REFUND " + input.orderId) {
        return NextResponse.json({ error: "Confirmation mismatch" }, { status: 400 });
      }
      await db.runTransaction(async tx => {
        const snapshot = await tx.get(orderRef);
        const d = snapshot.data();
        if (!d || d.gateway !== "pinpay" || d.status !== "paid" || d.refundStatus) {
          throw new Error("Refund request not allowed");
        }
        tx.update(orderRef, {
          refundStatus: "review", refundReason: input.reason,
          refundRequestedBy: actor.id, refundRequestedAt: new Date().toISOString(),
          refundRequiresEntitlementReview: true,
        });
      });
      await recordAdminAudit(req, actor, "pinpay.refund.requested", "landbdOrder", input.orderId);
      return NextResponse.json({
        ok: true, refundStatus: "review",
        message: "রিফান্ড রিভিউ তৈরি হয়েছে। অর্থ ফেরত পাঠানো হয়নি। অনুমোদিত অ্যাকাউন্ট থেকে আলাদা করে ফেরত দিন।",
      });
    }

    if (!/^[a-zA-Z0-9/_-]{6,100}$/.test(input.refundReference)) {
      return NextResponse.json({ error: "Independent refund reference required" }, { status: 400 });
    }
    const settlementRef = db.collection("landbdPinPayRefunds").doc(createHash("sha256").update(input.refundReference).digest("hex"));
    await db.runTransaction(async tx => {
      const orderSnap = await tx.get(orderRef);
      const order = orderSnap.data();
      if (!order || order.gateway !== "pinpay" || order.status !== "paid" ||
          order.refundStatus !== "review" || order.amountBdt !== input.refundAmountBdt) {
        throw new Error("Refund status or amount mismatch");
      }
      const entitlementRef = db.collection("landbdEntitlements").doc(order.uid + "_" + order.serviceId);
      const [refund, entitlement] = await Promise.all([tx.get(settlementRef), tx.get(entitlementRef)]);
      if (refund.exists) throw new Error("Refund reference already used");
      const lastPurchase = entitlement.data()?.lastTransactionId === input.orderId;
      const now = new Date().toISOString();
      tx.create(settlementRef, {
        orderId: input.orderId, provider: order.provider,
        amountBdt: order.amountBdt, refundReference: input.refundReference,
        verifiedBy: actor.id, source: "independent_refund_statement_review", createdAt: now,
      });
      if (lastPurchase) {
        tx.update(entitlementRef, {
          active: false, refundReviewHold: true, refundReviewOrderId: input.orderId,
          refundReviewAt: now,
        });
      }
      tx.update(orderRef, {
        status: "refunded", refundStatus: "refunded",
        refundReference: input.refundReference, refundedAt: now,
        refundVerifiedBy: actor.id, entitlementSuspended: lastPurchase,
        refundRequiresEntitlementReview: true,
      });
    });
    await recordAdminAudit(req, actor, "pinpay.refund.confirmed", "landbdOrder", input.orderId);
    return NextResponse.json({
      ok: true, refundStatus: "refunded",
      message: "বাইরের অ্যাকাউন্ট স্টেটমেন্ট অনুযায়ী ফেরত সম্পন্ন রেকর্ড করা হয়েছে।",
    });
  } catch (error) {
    console.error("[PinPay refund]", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "রিফান্ড যাচাই বা সংরক্ষণ করা যায়নি।" }, { status: 409 });
  }
}
