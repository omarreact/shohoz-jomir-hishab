import { NextRequest, NextResponse } from "next/server";
import { getZoneForWard } from "@/src/features/warishsanad/data/mock-dncc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ward = request.nextUrl.searchParams.get("ward")?.trim() ?? "";
  if (!ward) return NextResponse.json({ ok: false, error: "ward is required" }, { status: 400 });

  const zone = getZoneForWard(ward);
  if (!zone) return NextResponse.json({ ok: false, error: "Ward not found" }, { status: 404 });

  return NextResponse.json({ ok: true, data: zone }, {
    headers: { "Cache-Control": "no-store" },
  });
}
