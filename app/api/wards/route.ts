import { NextResponse } from "next/server";
import { MOCK_WARDS } from "@/src/features/warishsanad/data/mock-dncc";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ ok: true, data: MOCK_WARDS }, {
    headers: { "Cache-Control": "no-store" },
  });
}
