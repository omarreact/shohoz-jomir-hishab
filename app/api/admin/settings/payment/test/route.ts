import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";
import { getPinPaySettings, availablePinPayMethods } from "@/src/features/pinpay/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (req.headers.get("origin") !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Origin denied" }, { status: 403 });
  }
  try {
    await verifyAdminAuth(req);
    const settings = await getPinPaySettings();
    const active = availablePinPayMethods(settings);
    return NextResponse.json({
      ok: active.length > 0,
      configuredProviders: active,
      message: active.length
        ? "PinPay রিসিভিং অ্যাকাউন্ট প্রস্তুত। এটি লাইভ অর্থপ্রদানের নিশ্চয়তা নয়।"
        : "অনুমোদিত পেমেন্ট অ্যাকাউন্ট সক্রিয় করুন।",
    }, { status: active.length ? 200 : 409 });
  } catch {
    return NextResponse.json({ error: "অনুমতি বা সংযোগ ব্যর্থ।" }, { status: 503 });
  }
}
