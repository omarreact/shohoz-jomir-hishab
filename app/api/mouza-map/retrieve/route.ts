import { NextRequest, NextResponse } from "next/server";

import {
  getMouzaPdf,
  mouzaPdfStorageProvider,
} from "@/src/modules/storage/mouzaPdfStorage";
import { verifyPrivateDownloadToken } from "@/src/services/rajuk/privateMouzaPdfToken";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Missing download token" },
        { status: 400, headers: { "Cache-Control": "no-store" } },
      );
    }

    const claims = verifyPrivateDownloadToken(token);
    if (!claims) {
      return NextResponse.json(
        { error: "Invalid or expired download token" },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    const result = await getMouzaPdf(claims.pathname);
    if (!result) {
      return new NextResponse("Not found", {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    const filename =
      claims.pathname.split("/").pop() || "landbd-mouza-map.pdf";

    return new Response(result.stream, {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": `attachment; filename="${filename.replace(/[\r\n"\\]/g, "_")}"`,
        "Content-Length": String(result.size),
        "X-Content-Type-Options": "nosniff",
        "X-LandBD-Storage": mouzaPdfStorageProvider(),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("[LandBD][mouza-retrieve] failed", error);
    return NextResponse.json(
      { error: "Unable to retrieve the requested PDF" },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
