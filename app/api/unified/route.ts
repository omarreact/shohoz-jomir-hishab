import { NextRequest, NextResponse } from "next/server";
import { UnifiedGateway } from "@/lib/unified-api/core/UnifiedGateway";
import { ProviderQuery } from "@/lib/unified-api/types";

// Singleton instance to share cache across requests if running in a stateful environment
const gateway = new UnifiedGateway();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const includes = url.searchParams.get("include") || "";
    
    // Build query object from all remaining params
    const query: ProviderQuery = {};
    url.searchParams.forEach((value, key) => {
      if (key !== "include") {
        query[key] = value;
      }
    });

    const response = await gateway.handleRequest(includes, query);
    
    // If entire thing failed (no successes) return 500 but still structured response
    const status = response.success ? 200 : 502;
    
    return NextResponse.json(response, { status });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      generatedAt: new Date().toISOString(),
      executionTime: 0,
      version: "1.0.0",
      data: {},
      metadata: {},
      errors: [{ provider: "Gateway", message: error.message }]
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const includes = body.include || "";
    
    const query: ProviderQuery = {};
    for (const key in body) {
      if (key !== "include") {
        query[key] = body[key];
      }
    }

    const response = await gateway.handleRequest(includes, query);
    
    if (response.errors && response.errors.length > 0) {
      console.error("Unified API Gateway Errors:", JSON.stringify(response.errors, null, 2));
    }
    
    const status = response.success ? 200 : 502;
    return NextResponse.json(response, { status });
  } catch (error: any) {
    console.error("Unified API Route Critical Error:", error);
    return NextResponse.json({
      success: false,
      generatedAt: new Date().toISOString(),
      executionTime: 0,
      version: "2.0.0",
      data: {},
      metadata: {},
      errors: [{ provider: "Gateway", message: error.message }]
    }, { status: 500 });
  }
}

