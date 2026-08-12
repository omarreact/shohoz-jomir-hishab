import { NextRequest, NextResponse } from "next/server";
import { collections } from "@/src/modules/database/firebaseAdmin";

const RAJUK_TOKEN_KEY = "rajuk_api_token";

// GET /api/admin/rajuk-config — get current token
export async function GET() {
  try {
    const settingDoc = await collections.settings.doc(RAJUK_TOKEN_KEY).get();
    const setting = settingDoc.data();

    return NextResponse.json(
      {
        token: setting?.value ?? "",
        updatedAt: setting?.updatedAt ?? null,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/rajuk-config — save token
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "token is required" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();
    await collections.settings.doc(RAJUK_TOKEN_KEY).set(
      { key: RAJUK_TOKEN_KEY, value: token, updatedAt },
      { merge: true }
    );

    return NextResponse.json(
      { token, updatedAt },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
