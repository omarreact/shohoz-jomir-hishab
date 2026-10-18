import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, verifySuperAdminAuth } from "@/src/modules/auth/serverAuth";
import { protectAdminMutation, adminErrorStatus, recordAdminAudit } from "@/src/modules/security/adminSecurity";
import { adminPinPaySettingsSchema } from "@/src/features/pinpay/types";
import { availablePinPayMethods, getPinPaySettings, savePinPaySettings } from "@/src/features/pinpay/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const actor = await verifyAdminAuth(req);
    const settings = await getPinPaySettings();
    return NextResponse.json({
      gateway: "pinpay", settings, availableMethods: availablePinPayMethods(settings),
      canManage: actor.role === "Super Admin",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "সেটিংস পাওয়া যায়নি।" }, { status: 503 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await protectAdminMutation(req, "pinpay-settings", { max: 12, maxBodyBytes: 6000 });
    const actor = await verifySuperAdminAuth(req);
    const parsed = adminPinPaySettingsSchema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "কনফিগারেশন সঠিক নয়।" }, { status: 400 });
    await savePinPaySettings(parsed.data, actor.id);
    await recordAdminAudit(req, actor, "pinpay.settings.update", "paymentGateway", "pinpay", {
      enabled: parsed.data.enabled,
      providers: Object.entries(parsed.data.methods).filter(([, method]) => method.enabled).map(([key]) => key).join(","),
    });
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const reason = e instanceof Error ? e.message : "";
    const status = adminErrorStatus(e);
    return NextResponse.json({
      error: status >= 500 ? (
        reason.includes("receiving account") || reason.includes("approved receiving account") ?
          "অনুমোদিত ব্যবসায়িক পেমেন্ট নম্বর ও নাম সঠিকভাবে দিন।" : "সেটিংস সংরক্ষণ করা যায়নি।"
      ) : "এই পরিবর্তনের অনুমতি নেই।",
    }, { status: reason.includes("receiving account") || reason.includes("Activate at least") ? 400 : status });
  }
}
