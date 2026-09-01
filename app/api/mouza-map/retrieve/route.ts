import { createHmac, timingSafeEqual } from "node:crypto";
import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const TOKEN_TTL_SECONDS = 10 * 60;
const TOKEN_VERSION = "v1";
const PATH_PREFIX = "landbd/mouza-pdf/";

type DownloadClaims = {
  pathname: string;
  exp: number;
};

function signingSecret(): string {
  const secret = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret) throw new Error("BLOB_READ_WRITE_TOKEN is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", signingSecret()).update(payload).digest("base64url");
}

function issueToken(pathname: string, exp: number): string {
  const payload = `${TOKEN_VERSION}.${exp}.${pathname}`;
  return `${Buffer.from(payload, "utf8").toString("base64url")}.${sign(payload)}`;
}

function verifyToken(token: string): DownloadClaims | null {
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  let payload: string;
  try {
    payload = Buffer.from(encoded, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const firstDot = payload.indexOf(".");
  const secondDot = payload.indexOf(".", firstDot + 1);
  if (firstDot < 0 || secondDot < 0) return null;

  const version = payload.slice(0, firstDot);
  const expText = payload.slice(firstDot + 1, secondDot);
  const pathname = payload.slice(secondDot + 1);
  if (version !== TOKEN_VERSION || !pathname.startsWith(PATH_PREFIX)) return null;

  const exp = Number(expText);
  if (!Number.isSafeInteger(exp) || exp <= Math.floor(Date.now() / 1000)) return null;

  const expected = sign(payload);
  const providedBytes = Buffer.from(signature, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  if (providedBytes.length !== expectedBytes.length || !timingSafeEqual(providedBytes, expectedBytes)) return null;

  return { pathname, exp };
}

export function createPrivateDownloadToken(pathname: string): string {
  if (!pathname.startsWith(PATH_PREFIX)) throw new Error("Invalid private Blob pathname");
  return issueToken(pathname, Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS);
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing download token" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const claims = verifyToken(token);
    if (!claims) return NextResponse.json({ error: "Invalid or expired download token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const result = await get(claims.pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${claims.pathname.split("/").pop() || "landbd-mouza-map.pdf"}"`,
        "Content-Length": String(result.blob.size),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[LandBD][mouza-retrieve] failed", error);
    return NextResponse.json({ error: "Unable to retrieve the requested PDF" }, { status: 502, headers: { "Cache-Control": "no-store" } });
  }
}
