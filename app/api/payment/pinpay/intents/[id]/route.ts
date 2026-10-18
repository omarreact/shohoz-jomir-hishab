import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { getPinPayOrder } from "@/src/features/pinpay/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let uid: string;
  try {
    uid = (await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true })).id;
  } catch {
    return NextResponse.json({ error: "লগইন করুন।" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const order = await getPinPayOrder(uid, id);
    if (!order) return NextResponse.json({ error: "অর্ডার পাওয়া যায়নি।" }, { status: 404 });
    return NextResponse.json({ order }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "পেমেন্টের অবস্থা দেখা যাচ্ছে না।" }, { status: 503 });
  }
}
