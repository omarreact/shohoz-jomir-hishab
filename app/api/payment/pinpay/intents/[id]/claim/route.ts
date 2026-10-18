import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
import { claimPinPaySchema, isPinPayOrderId } from "@/src/features/pinpay/types";
import { claimPinPayPayment } from "@/src/features/pinpay/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Origin denied" }, { status: 403 });
  }
  let uid: string;
  try { uid = (await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true })).id; }
  catch { return NextResponse.json({ error: "লগইন প্রয়োজন।" }, { status: 401 }); }
  const { id } = await params;
  if (!isPinPayOrderId(id)) return NextResponse.json({ error: "Invalid order" }, { status: 400 });
  try {
    if (!await allowDurableRateLimit("pinpay:claim:" + uid + ":" + id, 4, 3600)) {
      return NextResponse.json({ error: "অনুরোধ সীমা অতিক্রম করেছে।" }, { status: 429 });
    }
    if (Number(req.headers.get("content-length") || 0) > 2000) {
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    }
    const parsed = claimPinPaySchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid claim" }, { status: 400 });
    const result = await claimPinPayPayment(uid, id, parsed.data.message ?? "");
    // A customer claim NEVER verifies payment or grants entitlements.
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Request failed";
    return NextResponse.json(
      { error: message === "Order not found" ? "অর্ডার পাওয়া যায়নি।" : "পেমেন্ট যাচাইয়ের অনুরোধ নেওয়া যায়নি।" },
      { status: message === "Order not found" ? 404 : 409 },
    );
  }
}
