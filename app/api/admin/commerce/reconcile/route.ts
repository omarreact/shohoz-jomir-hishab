import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyAdminAuth, verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
import { verifyAndFulfillPinPay } from "@/src/features/pinpay/server/fulfillment";
import { isPinPayOrderId } from "@/src/features/pinpay/types";
import { recordAdminAudit } from "@/src/modules/security/adminSecurity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("inspect"), transactionId: z.string() }).strict(),
  z.object({
    action: z.literal("verify"),
    transactionId: z.string(),
    statementReference: z.string().trim().min(6).max(100),
    checkedReceiver: z.string().trim().min(6).max(120),
    checkedAmountBdt: z.number().positive().max(500000),
    statementChecked: z.literal(true),
  }).strict(),
]);

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Origin denied" }, { status: 403 });
  }
  let actor: Awaited<ReturnType<typeof verifyAdminAuth>>;
  try { actor = await verifyAdminAuth(req); }
  catch { return NextResponse.json({ error: "Admin access required" }, { status: 403 }); }
  try {
    if (!await allowDurableRateLimit("pinpay:admin-reconcile:" + actor.id, 12, 60)) {
      return NextResponse.json({ error: "অনেকবার চেষ্টা করেছেন।" }, { status: 429 });
    }
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success || !isPinPayOrderId(parsed.data.transactionId)) {
      return NextResponse.json({ error: "Invalid reconciliation request" }, { status: 400 });
    }
    const command = parsed.data;
    const ref = db.collection("landbdOrders").doc(command.transactionId);
    if (command.action === "inspect") {
      const snapshot = await ref.get();
      const order = snapshot.data();
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      // Historical SSLCommerz orders remain auditable without legacy API access.
      return NextResponse.json({
        ok: true, transactionId: command.transactionId,
        gateway: order.gateway === "pinpay" ? "pinpay" : "legacy",
        status: order.status, reconciliationStatus: order.reconciliationStatus ?? null,
        provider: order.provider ?? null, receiver: order.gateway === "pinpay" ? order.receiver : null,
        amountBdt: order.amountBdt, claimAt: order.claimAt ?? null,
        statementReference: order.statementReference ?? null,
        evidenceType: order.lastEvidenceId ? "android_candidate_unverified" : "none",
        message: "শুধু উৎসের স্বাধীন হিসাব বিবরণী যাচাই করলে Super Admin পেমেন্ট নিশ্চিত করতে পারবেন।",
      }, { headers: { "Cache-Control": "private, no-store" } });
    }
    await verifySuperAdminAuth(req);
    const result = await verifyAndFulfillPinPay({
      orderId: command.transactionId,
      statementReference: command.statementReference,
      checkedReceiver: command.checkedReceiver,
      checkedAmountBdt: command.checkedAmountBdt,
      actorId: actor.id,
    });
    await recordAdminAudit(req, actor, "pinpay.statement.verified", "landbdOrder", command.transactionId, {
      statementReference: command.statementReference,
      statementChecked: true, alreadyPaid: result.alreadyPaid,
    });
    return NextResponse.json({ ok: true, status: "paid", ...result },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.error("[PinPay reconcile]", msg);
    return NextResponse.json({
      error: /mismatch|already|eligible|required|not found|reference/i.test(msg)
        ? msg : "পেমেন্ট যাচাই করা যায়নি।",
    }, { status: /mismatch|already|eligible|required|not found|reference/i.test(msg) ? 409 : 503 });
  }
}
