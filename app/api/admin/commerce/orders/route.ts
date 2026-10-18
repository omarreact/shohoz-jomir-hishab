import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import { db } from "@/src/modules/database/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyAdminAuth(req);
    const snapshot = await db.collection("landbdOrders").orderBy("createdAt", "desc").limit(75).get();
    const orders = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id, serviceId: String(d.serviceId || ""),
        gateway: d.gateway === "pinpay" ? "pinpay" : "legacy",
        provider: d.gateway === "pinpay" ? d.provider : null,
        receiver: d.gateway === "pinpay" ? d.receiver : null,
        amountBdt: Number(d.amountBdt || 0),
        status: String(d.status || ""), createdAt: String(d.createdAt || ""),
        paidAt: d.paidAt || null, claimAt: d.claimAt ?? null, lastEvidenceId: d.lastEvidenceId ?? null,
        statementReference: d.statementReference ?? null,
        refundStatus: d.refundStatus || null, refundReference: d.refundReference || null,
        refundRequiresEntitlementReview: d.refundRequiresEntitlementReview === true,
      };
    });
    return NextResponse.json({ orders, canManageRefunds: isSuperAdminRole(actor.role) },
      { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "অর্ডারের তথ্য পাওয়া যায়নি।" }, { status: 503 });
  }
}
