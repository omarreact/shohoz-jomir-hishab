import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";

const RAJUK_TOKEN_KEY = "rajuk_api_token";

// GET /api/admin/rajuk-config — get current token
export async function GET() {
  try {
    const setting = await prisma.siteSetting.findUnique({
      where: { key: RAJUK_TOKEN_KEY },
    });

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

    const setting = await prisma.siteSetting.upsert({
      where: { key: RAJUK_TOKEN_KEY },
      update: { value: token },
      create: { key: RAJUK_TOKEN_KEY, value: token },
    });

    return NextResponse.json(
      { token: setting.value, updatedAt: setting.updatedAt },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
