import { NextResponse } from "next/server";
import { getRajukAuthMode, getValidToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const mode = getRajukAuthMode();
  if (mode === "none") {
    return NextResponse.json({
      ok: false,
      authenticated: false,
      mode,
      redisConfigured: hasUpstashConfig(),
      message: "RAJUK server authentication is not configured on the server.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  try {
    await getValidToken(RAJUK_SERVER);
    return NextResponse.json({
      ok: true,
      authenticated: true,
      mode,
      redisConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      authenticated: false,
      mode,
      redisConfigured: hasUpstashConfig(),
      message: error instanceof Error ? error.message : "RAJUK authentication failed",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
