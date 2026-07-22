import { NextResponse } from "next/server";
import { registry } from "@/lib/metrics";

export async function GET() {
  try {
    const metrics = await registry.metrics();
    return new NextResponse(metrics, {
      headers: {
        "Content-Type": registry.contentType,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to collect metrics" },
      { status: 500 }
    );
  }
}
