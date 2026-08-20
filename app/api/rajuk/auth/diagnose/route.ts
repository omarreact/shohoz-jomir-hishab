import { NextResponse } from "next/server";
import {
  generateToken,
  getRajukAuthMode,
  getValidToken,
  hasRajukCredential,
  RAJUK_SERVER,
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
          error:
            "No authorized RAJUK credential is configured. Set RAJUK_PORTAL_USERNAME + RAJUK_PORTAL_PASSWORD (preferred), a fresh RAJUK_PORTAL_TOKEN, or RAJUK_SERVER_TOKEN on Vercel and redeploy.",
          fix: "Vercel → Project → Settings → Environment Variables → Production",
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
        note: "Token value is intentionally never returned.",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "RAJUK authentication failed";
    const expiredStaticPortal =
      base.portalTokenConfigured &&
      !base.portalCredentialsConfigured &&
      (message.includes("498") || message.toLowerCase().includes("invalid token") || message.toLowerCase().includes("expired"));

    return NextResponse.json(
      {
        ok: false,
        ...base,
        serverTokenGenerated: false,
        error: message,
        fix: expiredStaticPortal
          ? "Your RAJUK_PORTAL_TOKEN / RAJUK_API_KEY is expired. Generate a new portal token from https://masterplan.rajuk.gov.bd/portal (or set username/password), update Vercel env, remove the stale token if switching to credentials, then Redeploy."
          : "Check Vercel env vars for RAJUK_PORTAL_USERNAME/PASSWORD or a valid portal/server token, then Redeploy.",
      },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
