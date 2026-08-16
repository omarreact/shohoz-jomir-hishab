import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";
import { verifyAdminAuth } from "@/src/modules/auth/serverAuth";

const RAJUK_TOKEN_KEY = "rajuk_api_token";

// Utility to mask the token so it's not exposed to the browser fully
function maskToken(token: string | undefined): string {
  if (!token) return "";
  if (token.length <= 15) return "***...*** (masked)";
  const start = token.slice(0, 10);
  const end = token.slice(-5);
  return `${start}...[MASKED]...${end}`;
}

// GET /api/admin/rajuk-config — get current token
export async function GET(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const settingDoc = await collections.settings.doc(RAJUK_TOKEN_KEY).get();
    const setting = settingDoc.data();

    return NextResponse.json(
      {
        token: maskToken(setting?.value),
        updatedAt: setting?.updatedAt ?? null,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to get rajuk config:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "রাজউক কনফিগারেশন লোড করা যায়নি।" },
      { status: 500 },
    );
  }
}

// POST /api/admin/rajuk-config — save token
export async function POST(req: NextRequest) {
  try {
    await verifyAdminAuth(req);
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "টোকেন প্রয়োজন" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    await collections.settings.doc(RAJUK_TOKEN_KEY).set(
      { key: RAJUK_TOKEN_KEY, value: token, updatedAt },
      { merge: true }
    );

    return NextResponse.json(
      { token: maskToken(token), updatedAt },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Failed to save rajuk config:", error);
    if (error.message === "Unauthorized" || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: "আপনার অনুমতি নেই।" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "রাজউক টোকেন সেভ করা যায়নি।" },
      { status: 500 },
    );
  }
}
