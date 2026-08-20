import { NextResponse } from "next/server";
import { generateToken, getRajukAuthMode, getValidToken, hasRajukCredential, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const mode = getRajukAuthMode();
  try {
    if (!hasRajukCredential()) {
      return NextResponse.json({
        ok: false,
        authMode: mode,
        portalTokenConfigured: Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY),
        portalCredentialsConfigured: Boolean(process.env.RAJUK_PORTAL_USERNAME && process.env.RAJUK_PORTAL_PASSWORD),
        serverTokenConfigured: Boolean(process.env.RAJUK_SERVER_TOKEN),
        upstashConfigured: hasUpstashConfig(),
        server: RAJUK_SERVER,
        error: "No authorized RAJUK credential is configured. Public layers can work tokenlessly; protected layers require RAJUK_PORTAL_TOKEN, RAJUK_PORTAL_USERNAME/RAJUK_PORTAL_PASSWORD, or a temporary RAJUK_SERVER_TOKEN.",
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    const token = await getValidToken(RAJUK_SERVER);
    return NextResponse.json({
      ok: Boolean(token),
      authMode: mode,
      portalTokenConfigured: Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY),
      portalCredentialsConfigured: Boolean(process.env.RAJUK_PORTAL_USERNAME && process.env.RAJUK_PORTAL_PASSWORD),
      serverTokenConfigured: Boolean(process.env.RAJUK_SERVER_TOKEN),
      serverTokenGenerated: Boolean(token),
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
      note: "Token value is intentionally never returned.",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      authMode: mode,
      portalTokenConfigured: Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY),
      portalCredentialsConfigured: Boolean(process.env.RAJUK_PORTAL_USERNAME && process.env.RAJUK_PORTAL_PASSWORD),
      serverTokenConfigured: Boolean(process.env.RAJUK_SERVER_TOKEN),
      serverTokenGenerated: false,
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
      error: error instanceof Error ? error.message : "RAJUK authentication failed",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
