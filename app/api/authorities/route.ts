import { NextRequest, NextResponse } from "next/server";
import { getAuthorityForWard } from "@/src/features/warishsanad/data/mock-dncc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";
  const zoneId = request.nextUrl.searchParams.get("zoneId")?.trim() ?? "";

  if (!ward || !zoneId) {
    return NextResponse.json({ ok: false, error: "ward and zoneId are required" }, { status: 400 });
  }

  const authority = getAuthorityForWard(ward, zoneId);
  if (!authority) return NextResponse.json({ ok: false, error: "Authority not found" }, { status: 404 });

  return NextResponse.json({ ok: true, data: authority }, {
    headers: { "Cache-Control": "no-store" },
  });
}
