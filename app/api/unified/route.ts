import { NextRequest, NextResponse } from "next/server";
import { UnifiedGateway } from "@/src/modules/unified/core/UnifiedGateway";
import { ProviderQuery } from "@/src/modules/unified/types";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const gateway = new UnifiedGateway();

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function gatewayError(
  message: string,
  status: number,
  requestId: string,
) {
  return NextResponse.json(
    {
      success: false,
      generatedAt: new Date().toISOString(),
      executionTime: 0,
      version: "3.0.0",
      data: {},
      metadata: { requestId },
      errors: [{ provider: "Gateway", message }],
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
        ...(status === 429 ? { "Retry-After": "60" } : {}),
      },
    },
  );
}

async function rateLimitRequest(
  req: NextRequest,
  requestId: string,
  max: number,
): Promise<boolean> {
  try {
    return await allowRateLimit(
      `unified:${req.method}:${clientIp(req)}`,
      max,
      60,
    );
  } catch (error) {
    // Redis is an optional resilience layer. A Redis outage must not make the
    // public LandBD gateway unavailable.
    console.warn("Unified gateway rate limiter unavailable", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return true;
  }
}

function responseHeaders(requestId: string) {
  return {
    "Cache-Control": "no-store",
    "X-Request-Id": requestId,
  };
}

export async function GET(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (!(await rateLimitRequest(req, requestId, 90))) {
    return gatewayError(
      "অল্প সময়ে অনেক অনুরোধ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
      429,
      requestId,
    );
  }

  try {
    const url = req.nextUrl;
    const includes = url.searchParams.get("include")?.trim() || "";

    if (includes.length > 256) {
      return gatewayError("Invalid include parameter.", 400, requestId);
    }

    const query: ProviderQuery = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "include") query[key] = value;
    });

    const response = await gateway.handleRequest(includes, query);
    response.metadata = { ...response.metadata, requestId };

    return NextResponse.json(response, {
      status: response.success ? 200 : 502,
      headers: responseHeaders(requestId),
    });
  } catch (error: unknown) {
    console.error("Unified gateway GET failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return gatewayError("Gateway request failed.", 500, requestId);
  }
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  if (!(await rateLimitRequest(req, requestId, 30))) {
    return gatewayError(
      "অল্প সময়ে অনেক অনুরোধ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
      429,
      requestId,
    );
  }

  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return gatewayError("Request body must be a JSON object.", 400, requestId);
    }

    const body = parsed as Record<string, unknown>;
    const includes = typeof body.include === "string" ? body.include.trim() : "";
    if (includes.length > 256) {
      return gatewayError("Invalid include parameter.", 400, requestId);
    }

    const query: ProviderQuery = {};
    for (const [key, value] of Object.entries(body)) {
      if (key !== "include") query[key] = value;
    }

    const response = await gateway.handleRequest(includes, query);
    response.metadata = { ...response.metadata, requestId };

    if (response.errors.length > 0) {
      console.warn("Unified gateway provider failures", {
        requestId,
        providers: response.errors.map((item) => item.provider),
      });
    }

    return NextResponse.json(response, {
      status: response.success ? 200 : 502,
      headers: responseHeaders(requestId),
    });
  } catch (error: unknown) {
    console.error("Unified gateway POST failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return gatewayError("Gateway request failed.", 500, requestId);
  }
}
