import { NextResponse } from "next/server";
import { CacheManager } from "@/lib/unified-api/core/CacheManager";

export async function GET() {
  const cacheManager = CacheManager.getInstance();
  
  return NextResponse.json({
    cache: cacheManager.getStats(),
    timestamp: new Date().toISOString()
  });
}
