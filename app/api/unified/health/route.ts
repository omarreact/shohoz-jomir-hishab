import { NextResponse } from "next/server";
import { UnifiedGateway } from "@/src/modules/unified/core/UnifiedGateway";

const gateway = new UnifiedGateway();

export async function GET() {
  const start = performance.now();
  try {
    const health = await gateway.getHealth();
    
    // Check if any critical providers are down
    const isDegraded = Object.values(health).some((h: { status?: string }) => h.status === "down");
    
    return NextResponse.json({
      status: isDegraded ? "degraded" : "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      latency: Math.round(performance.now() - start),
      providers: health
    }, { status: isDegraded ? 207 : 200 }); // 207 Multi-Status
  } catch (error: unknown) {
    return NextResponse.json({
      status: "down",
      message: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
