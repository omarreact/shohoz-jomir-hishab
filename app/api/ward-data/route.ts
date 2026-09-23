import { NextRequest, NextResponse } from "next/server";
import {
  MOCK_WARDS,
  getAuthorityForWard,
  getZoneForWard,
} from "@/src/features/warishsanad/data/mock-dncc";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const scope = searchParams.get("scope") ?? "wards";
  const ward = searchParams.get("ward")?.trim() ?? "";
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  if (scope === "wards") {
    return NextResponse.json({ ok: true, data: MOCK_WARDS }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (scope === "zone") {
    if (!ward) return NextResponse.json({ ok: false, error: "ward is required" }, { status: 400 });
    const zone = getZoneForWard(ward);
    if (!zone) return NextResponse.json({ ok: false, error: "Ward not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: zone }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (scope === "authority") {
    if (!ward || !zoneId) {
      return NextResponse.json({ ok: false, error: "ward and zoneId are required" }, { status: 400 });
    }
    const authority = getAuthorityForWard(ward, zoneId);
    if (!authority) return NextResponse.json({ ok: false, error: "Authority not found" }, { status: 404 });
    return NextResponse.json({ ok: true, data: authority }, {
      headers: { "Cache-Control": "no-store" },
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown scope" }, { status: 400 });
}
