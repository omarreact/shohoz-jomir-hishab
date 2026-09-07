import { NextRequest, NextResponse } from "next/server";
import { getValidToken } from "@/src/services/rajuk/rajukAuth.service";
import { DATA_MONITOR_SERVICES } from "@/src/features/admin/data-monitor/api-registry";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("service");
    const service = DATA_MONITOR_SERVICES.find((item) => item.id === id);
    if (!service) return NextResponse.json({ error: "Unknown service" }, { status: 404 });

    const url = new URL(service.endpoint);
    url.searchParams.set("f", "json");

    const requiresToken = service.kind === "feature" || service.id === "ms-mauza-tiles" || service.id === "flood";
    if (requiresToken) url.searchParams.set("token", await getValidToken(service.endpoint));

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json();
    if (!response.ok || data.error) return NextResponse.json({ error: data.error?.message || `Metadata failed (${response.status})` }, { status: response.status || 502 });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Metadata request failed" }, { status: 502 });
  }
}
