import { NextResponse } from "next/server";
import {
  getRajukAuthMode,
  getValidToken,
  hasRajukCredential,
  RAJUK_SERVER,
  RAJUK_PUBLIC_CONFIG,
} from "@/src/services/rajuk/rajukAuth.service";
import { hasUpstashConfig } from "@/src/services/rajuk/rajukRedis.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const mode = getRajukAuthMode();
  const base = {
    authMode: mode,
    portalTokenConfigured: Boolean(process.env.RAJUK_PORTAL_TOKEN || process.env.RAJUK_API_KEY),
    portalCredentialsConfigured: Boolean(process.env.RAJUK_PORTAL_USERNAME && process.env.RAJUK_PORTAL_PASSWORD),
    serverTokenConfigured: Boolean(process.env.RAJUK_SERVER_TOKEN),
    publicConfigFallback: RAJUK_PUBLIC_CONFIG,
    upstashConfigured: hasUpstashConfig(),
    server: RAJUK_SERVER,
  };

  try {
    if (!hasRajukCredential()) {
      return NextResponse.json(
        {
          ok: false,
          ...base,
          serverTokenGenerated: false,
          error: "No RAJUK auth method available.",
        },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }

    const token = await getValidToken(RAJUK_SERVER);
    return NextResponse.json(
      {
        ok: Boolean(token),
        ...base,
        serverTokenGenerated: Boolean(token),
        note: "Token value is intentionally never returned. Auth works without username/password via public config.json when env token is missing or expired.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK authentication failed";
    return NextResponse.json(
      {
        ok: false,
        ...base,
        serverTokenGenerated: false,
        error: message,
        fix: "If public-config failed, RAJUK may be down or config.json changed. Optional: set a fresh RAJUK_PORTAL_TOKEN from config.json or username/password on Vercel.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
