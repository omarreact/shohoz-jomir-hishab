import { NextResponse } from "next/server";
import { getCacheProvider } from "@/lib/rajuk/cache";
import { RAJUK_TOKEN_CACHE_KEY } from "@/lib/rajuk/constants";
import { getRedisClient } from "@/lib/redis";
import type { TokenResult, TokenProvider } from "@/lib/rajuk/types";
import { env } from "@/lib/config/env";
import { container } from "@/lib/di/container";
// In a real scenario we could expose circuit breaker stats via the provider if we cast it
import { OfficialRajukTokenProvider } from "@/lib/rajuk/provider";

export async function GET() {
  const isRedis = getRedisClient() !== null;
  const providerType = env.RAJUK_PROVIDER;
  
  let expiresIn = 0;
  
  try {
    const cacheProvider = getCacheProvider();
    const raw = await cacheProvider.get(RAJUK_TOKEN_CACHE_KEY);
    if (raw) {
      const result = JSON.parse(raw) as TokenResult;
      expiresIn = Math.max(0, Math.floor((result.expires - Date.now()) / 1000));
    }
  } catch (err) {
    // Ignore cache errors
  }

  // Attempt to fetch circuit breaker stats if using official provider
  let circuitBreakerStats = null;
  if (providerType === "official") {
    try {
      const provider = container.resolve<TokenProvider>("TokenProvider");
      if (provider instanceof OfficialRajukTokenProvider) {
        // We cast to any to access the private breaker for health check
        const breaker = (provider as any).breaker;
        if (breaker) {
          circuitBreakerStats = {
            closed: breaker.closed,
            halfOpen: breaker.halfOpen,
            open: breaker.opened,
            failures: breaker.stats.failures,
            successes: breaker.stats.successes,
          };
        }
      }
    } catch (e) {}
  }

  return NextResponse.json({
    healthy: true,
    expiresIn,
    cache: isRedis ? "redis" : "memory",
    provider: providerType,
    circuitBreaker: circuitBreakerStats,
  });
}
