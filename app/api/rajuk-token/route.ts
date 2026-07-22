import { NextResponse } from "next/server";

// This endpoint is intentionally removed for security.
// Raw ArcGIS tokens are NEVER exposed to the frontend.
// All tile requests are proxied server-side via /api/tiles/route.ts
// which injects the token securely behind the scenes.

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Token endpoint disabled. Use /api/tiles with service parameter instead.",
    },
    { status: 410 },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Token endpoint disabled. Tokens are managed server-side only." },
    { status: 410 },
  );
}
