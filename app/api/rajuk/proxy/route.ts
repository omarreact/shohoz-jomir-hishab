import { NextResponse } from "next/server";
import { proxyRequest } from "@/lib/rajuk/proxy";
import { ProxyError } from "@/lib/rajuk/errors";
import { withTrace } from "@/lib/logger";
import { RAJUK_ALLOWED_DOMAINS } from "@/lib/rajuk/constants";

export async function GET(req: Request) {
  return handleProxy(req, "GET");
}

export async function POST(req: Request) {
  return handleProxy(req, "POST");
}

export async function PUT(req: Request) {
  return handleProxy(req, "PUT");
}

async function handleProxy(req: Request, method: string) {
  const traceId =
    req.headers.get("x-request-id") || req.headers.get("x-trace-id");

  return withTrace(traceId, async () => {
    try {
      const url = new URL(req.url);
      const targetUrl = url.searchParams.get("target");

      if (!targetUrl) {
        return NextResponse.json(
          { error: "Missing 'target' query parameter" },
          { status: 400 },
        );
      }

      // SSRF Protection: validate target URL against allowed domains
      let parsedTarget: URL;
      try {
        parsedTarget = new URL(targetUrl);
      } catch {
        return NextResponse.json(
          { error: "Invalid target URL" },
          { status: 400 },
        );
      }

      const isAllowed = RAJUK_ALLOWED_DOMAINS.some((domain) =>
        parsedTarget.hostname.endsWith(domain),
      );

      if (!isAllowed) {
        return NextResponse.json(
          { error: "Target domain not allowed" },
          { status: 403 },
        );
      }

      // Block requests to internal/private IP ranges
      const hostname = parsedTarget.hostname.toLowerCase();
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname.startsWith("192.168.") ||
        hostname.endsWith(".local") ||
        hostname.endsWith(".internal")
      ) {
        return NextResponse.json(
          { error: "Internal targets are not allowed" },
          { status: 403 },
        );
      }

      url.searchParams.delete("target");
      const params = Object.fromEntries(url.searchParams.entries());

      let data;
      if (method !== "GET" && method !== "HEAD") {
        const contentType = req.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await req.json();
        } else {
          data = await req.text();
        }
      }

      const responseData = await proxyRequest(targetUrl, {
        method,
        params,
        data,
      });

      return NextResponse.json(responseData);
    } catch (error: unknown) {
      if (error instanceof ProxyError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode },
        );
      }
      return NextResponse.json(
        { error: "Internal Proxy Error" },
        { status: 500 },
      );
    }
  });
}
