import { NextResponse } from "next/server";

import { getSiteAccessPolicy } from "@/src/modules/access/server/siteAccessPolicy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const policy = await getSiteAccessPolicy({ fresh: true });

  return NextResponse.json(
    {
      maintenanceMode: policy.maintenanceMode,
      degraded: policy.degraded,
      ...(policy.degraded && policy.reason ? { reason: policy.reason } : {}),
    },
    {
      status: policy.degraded ? 503 : 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
