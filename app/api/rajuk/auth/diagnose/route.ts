import { NextResponse } from "next/server";
import { generateToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const credentialConfigured = Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY);
  try {
    if (!credentialConfigured) {
      return NextResponse.json({
        ok: false,
        portalTokenConfigured: false,
        upstashConfigured: hasUpstashConfig(),
        server: RAJUK_SERVER,
        error: "RAJUK_PORTAL_TOKEN is not configured",
      }, { status: 503 });
    }

    const token = await generateToken(RAJUK_SERVER);
    return NextResponse.json({
      ok: true,
      portalTokenConfigured: true,
      serverTokenGenerated: Boolean(token.token),
      expiresAt: token.expiresAt,
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      portalTokenConfigured: true,
      serverTokenGenerated: false,
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
      error: error instanceof Error ? error.message : "RAJUK authentication failed",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
