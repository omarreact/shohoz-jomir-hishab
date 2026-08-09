import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/modules/database/prisma";
import { requireAdmin } from "@/lib/middleware/requireAdmin";

const RAJUK_TOKEN_KEY = "rajuk_api_token";

// GET /api/admin/rajuk-config — get current token
export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
  try {
    const envToken = process.env.RAJUK_MAP_TOKEN || process.env.RAJUK_PORTAL_TOKEN;
    
    if (envToken) {
      const masked = envToken.length > 8 ? "•".repeat(envToken.length - 8) + envToken.slice(-8) : "••••••••";
      return NextResponse.json({
        token: masked,
        hasToken: true,
        source: "env" as const,
        updatedAt: null,
      }, { status: 200 });
    }

    const setting = await prisma.siteSetting.findUnique({
      where: { key: RAJUK_TOKEN_KEY },
    });

    const hasToken = Boolean(setting?.value);
    const masked = setting?.value && setting.value.length > 8
      ? "•".repeat(setting.value.length - 8) + setting.value.slice(-8)
      : "";

    return NextResponse.json({
      token: masked,
      hasToken,
      source: hasToken ? ("database" as const) : ("none" as const),
      updatedAt: setting?.updatedAt ?? null,
    }, { status: 200 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/rajuk-config — save token
export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if (authResult instanceof NextResponse) return authResult;
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

    // Invalidate runtime TokenManager cache (singleton)
    const { TokenManager } = await import("@/src/modules/unified/core/TokenManager");
    TokenManager.getInstance().invalidateCache();

    // Also invalidate RajukTokenManager cache (DI/tsyringe)
    try {
      const { container } = await import("@/lib/di/container");
      const { RajukTokenManager } = await import("@/lib/rajuk/manager");
      const rtm = container.resolve(RajukTokenManager);
      await rtm.forceRefresh();
    } catch (e) {
      // RajukTokenManager may not be initialized yet — safe to skip
    }

    const masked = setting.value && setting.value.length > 8
      ? "•".repeat(setting.value.length - 8) + setting.value.slice(-8)
      : "";

    return NextResponse.json(
      { token: masked, hasToken: true, source: "database", updatedAt: setting.updatedAt },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
