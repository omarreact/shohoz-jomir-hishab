import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { verifyPrivateDownloadToken } from "@/src/services/rajuk/privateMouzaPdfToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) return NextResponse.json({ error: "Missing download token" }, { status: 400, headers: { "Cache-Control": "no-store" } });

    const claims = verifyPrivateDownloadToken(token);
    if (!claims) return NextResponse.json({ error: "Invalid or expired download token" }, { status: 403, headers: { "Cache-Control": "no-store" } });

    const result = await get(claims.pathname, { access: "private" });
    if (!result || result.statusCode !== 200) return new NextResponse("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

    const filename = claims.pathname.split("/").pop() || "landbd-mouza-map.pdf";
    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename.replace(/[\r\n"\\]/g, "_")}"`,
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
