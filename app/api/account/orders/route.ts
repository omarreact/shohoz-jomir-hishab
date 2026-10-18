import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { db } from "@/src/modules/database/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const member = await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true });
    const snapshot = await db.collection("landbdOrders").where("uid", "==", member.id).limit(100).get();
    const orders = snapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id, serviceId: String(d.serviceId || ""),
        amountBdt: Number(d.amountBdt || 0), gateway: d.gateway === "pinpay" ? "pinpay" : "legacy",
        status: String(d.status || "unknown"),
        createdAt: String(d.createdAt || ""), paidAt: d.paidAt || null,
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return NextResponse.json({ orders }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "প্রবেশ করতে লগইন প্রয়োজন" }, { status: 401 });
  }
}
