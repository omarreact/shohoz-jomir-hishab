import { NextResponse } from "next/server";
import { generateToken, getValidToken, hasRajukCredential, RAJUK_SERVER } from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const portalTokenConfigured = Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY);
  const serverTokenConfigured = Boolean(process.env.RAJUK_SERVER_TOKEN);

  try {
    if (!hasRajukCredential()) {
      return NextResponse.json({
        ok: false,
        portalTokenConfigured,
        serverTokenConfigured,
        upstashConfigured: hasUpstashConfig(),
        server: RAJUK_SERVER,
        error: "No RAJUK server credential is configured. Set RAJUK_PORTAL_TOKEN for automatic Portal → Server exchange, or RAJUK_SERVER_TOKEN as a temporary bootstrap credential.",
      }, { status: 503, headers: { "Cache-Control": "no-store" } });
    }

    if (portalTokenConfigured) {
      const token = await generateToken(RAJUK_SERVER);
      return NextResponse.json({
        ok: true,
        portalTokenConfigured: true,
        serverTokenConfigured,
        serverTokenGenerated: Boolean(token.token),
        expiresAt: token.expiresAt,
        upstashConfigured: hasUpstashConfig(),
        server: RAJUK_SERVER,
        mode: "portal-to-server-exchange",
      }, { headers: { "Cache-Control": "no-store" } });
    }

    // Do not expose the token. This only verifies that the configured server credential
    // can be used by the backend and, when Redis is configured, can be cached.
    const token = await getValidToken(RAJUK_SERVER);
    return NextResponse.json({
      ok: Boolean(token),
      portalTokenConfigured: false,
      serverTokenConfigured: true,
      serverTokenGenerated: Boolean(token),
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
      mode: "configured-server-token",
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      portalTokenConfigured,
      serverTokenConfigured,
      serverTokenGenerated: false,
      upstashConfigured: hasUpstashConfig(),
      server: RAJUK_SERVER,
      error: error instanceof Error ? error.message : "RAJUK authentication failed",
    }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
