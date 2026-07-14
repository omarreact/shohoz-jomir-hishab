import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const remoteBaseUrl =
  process.env.LANDBD_API_BASE_URL || "https://landbd.pincodeit.com";

function sanitizeHeaders(headers: Headers) {
  const sanitized = new Headers(headers);
  sanitized.delete("host");
  sanitized.delete("connection");
  sanitized.delete("content-length");
  sanitized.delete("transfer-encoding");
  sanitized.delete("content-encoding");
  sanitized.delete("keep-alive");
  sanitized.delete("proxy-connection");
  sanitized.set("accept-encoding", "identity");
  return sanitized;
}

async function proxyRequest(request: NextRequest, path: string[] = []) {
  const requestPath = path.length > 0 ? `/${path.join("/")}` : "/";
  const targetUrl = new URL(
    request.nextUrl.search,
    `${remoteBaseUrl}${requestPath}`,
  );

  const headers = sanitizeHeaders(request.headers);
  headers.set("x-forwarded-host", request.headers.get("host") || "localhost");
  headers.set(
    "x-forwarded-proto",
    request.url.startsWith("https://") ? "https" : "http",
  );

  const method = request.method;
  let body: BodyInit | undefined;
  if (method !== "GET" && method !== "HEAD") {
    body = await request.arrayBuffer();
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");
  responseHeaders.delete("transfer-encoding");
  responseHeaders.set("access-control-allow-origin", "*");
  responseHeaders.set(
    "access-control-allow-methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  responseHeaders.set(
    "access-control-allow-headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  responseHeaders.set("cache-control", "no-store");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path || []);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path || []);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path || []);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path || []);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> },
) {
  const resolvedParams = await params;
  return proxyRequest(request, resolvedParams.path || []);
}

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 204 });
  response.headers.set("access-control-allow-origin", "*");
  response.headers.set(
    "access-control-allow-methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  );
  response.headers.set(
    "access-control-allow-headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  response.headers.set("access-control-max-age", "86400");
  return response;
}
