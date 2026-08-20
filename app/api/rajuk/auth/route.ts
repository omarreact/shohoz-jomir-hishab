import { NextResponse } from "next/server";
import { getRajukAuthMode, getValidToken, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const mode = getRajukAuthMode();
  if (mode === "missing") {
    return NextResponse.json({
      ok: false,
      authenticated: false,
      mode,
      redisConfigured: hasUpstashConfig(),
      message: "RAJUK server authentication is not configured on the server.",
    }, { status: 503 });
  }

  try {
    // The token itself is intentionally never returned to the browser.
    await getValidToken(RAJUK_SERVER);
    return NextResponse.json({
      ok: true,
      authenticated: true,
      mode,
      redisConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      authenticated: false,
      mode,
      redisConfigured: hasUpstashConfig(),
      message: error instanceof Error ? error.message : "RAJUK authentication failed",
    }, { status: 502 });
  }
}
