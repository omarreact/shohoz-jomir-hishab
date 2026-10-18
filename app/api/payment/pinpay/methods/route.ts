import { NextResponse } from "next/server";
import { availablePinPayMethods, getPinPaySettings } from "@/src/features/pinpay/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getPinPaySettings();
    return NextResponse.json({
      gateway: "pinpay",
      methods: availablePinPayMethods(settings),
      enabled: settings.enabled,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(
      { gateway: "pinpay", methods: [], enabled: false },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
