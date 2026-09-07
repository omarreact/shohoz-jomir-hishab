import { NextResponse } from "next/server";

// Compatibility endpoint retained intentionally so older clients receive an
// explicit 410 instead of ever receiving a raw ArcGIS credential.
//
// RAJUK credentials are server-only. Current map tiles are served through the
// allow-listed canonical route: /api/rajuk/tile/[layer]/[z]/[y]/[x].

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

export async function GET() {
  return NextResponse.json(
    {
      error:
        "Token endpoint disabled. RAJUK credentials are managed server-side only.",
      tileEndpoint: "/api/rajuk/tile/[layer]/[z]/[y]/[x]",
    },
    { status: 410, headers },
  );
}

export async function POST() {
  return NextResponse.json(
    { error: "Token endpoint disabled. Tokens are managed server-side only." },
    { status: 410, headers },
  );
}
