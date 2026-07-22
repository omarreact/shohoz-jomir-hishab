import { NextResponse } from "next/server";
import { CacheManager } from "@/src/modules/unified/core/CacheManager";

export async function GET() {
  const cacheManager = CacheManager.getInstance();
  
  return NextResponse.json({
    cache: cacheManager.getStats(),
    timestamp: new Date().toISOString()
  });
}
