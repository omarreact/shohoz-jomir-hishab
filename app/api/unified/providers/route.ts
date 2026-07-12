import { NextResponse } from "next/server";
import { UnifiedGateway } from "@/lib/unified-api/core/UnifiedGateway";

const gateway = new UnifiedGateway();

export async function GET() {
  const providers = gateway.getRegisteredProviders();
  
  return NextResponse.json({
    count: providers.length,
    providers,
    timestamp: new Date().toISOString()
  });
}
