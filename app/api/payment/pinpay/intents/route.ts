import { NextRequest, NextResponse } from "next/server";
import { verifyServerAuth } from "@/src/modules/auth/serverAuth";
import { allowDurableRateLimit } from "@/src/lib/durable-rate-limit";
import { initiatePinPaySchema } from "@/src/features/pinpay/types";
import { createPinPayOrder } from "@/src/features/pinpay/server/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function response(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return response({ error: "Origin denied" }, 403);
  }
  if (Number(req.headers.get("content-length") || 0) > 3000) {
    return response({ error: "Request too large" }, 413);
  }
  let user: Awaited<ReturnType<typeof verifyServerAuth>>;
  try {
    user = await verifyServerAuth(req, { requireAdminBackend: true, checkRevoked: true });
  } catch { return response({ error: "লগইন করে আবার চেষ্টা করুন।" }, 401); }
  try {
    if (!await allowDurableRateLimit("pinpay:intent:" + user.id, 5, 60)) {
      return response({ error: "অনেকবার পেমেন্ট অনুরোধ করেছেন।" }, 429);
    }
    const requestId = req.headers.get("x-idempotency-key") ?? "";
    if (!/^[0-9a-f]{8}-[0-9a-f-]{27,40}$/i.test(requestId)) {
      return response({ error: "Idempotency key is required" }, 400);
    }
    const parsed = initiatePinPaySchema.safeParse(await req.json());
    if (!parsed.success) return response({ error: "সেবা বা পেমেন্ট পদ্ধতি সঠিক নয়।" }, 400);
    const order = await createPinPayOrder(user.id, parsed.data.serviceId, parsed.data.provider, requestId);
    return response({ order, checkoutUrl: "/checkout/pinpay?tran_id=" + encodeURIComponent(order.id) }, 201);
  } catch (e) {
    const reason = e instanceof Error ? e.message : "Payment unavailable";
    console.error("[PinPay] initiate:", reason);
    const clientError = /পেমেন্ট|সেবা|অনুরোধ|Invalid PinPay amount/.test(reason);
    return response({ error: clientError ? reason : "পেমেন্ট অর্ডার তৈরি করা যায়নি।" }, clientError ? 409 : 503);
  }
}
