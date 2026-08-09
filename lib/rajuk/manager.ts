import { injectable, inject } from "tsyringe";
import type { CacheProvider, TokenProvider, TokenResult } from "./types";
import { LockManager } from "./lock";
import { RAJUK_TOKEN_CACHE_KEY } from "./constants";
import { env } from "@/lib/config/env";
import { logger } from "@/lib/logger";
import { tokenRefreshCounter, upstreamLatencyHistogram } from "@/lib/metrics";

@injectable()
export class RajukTokenManager {
  private readonly LOCK_TTL = 10000; // 10 seconds for lock

  constructor(
    @inject("CacheProvider") private cacheProvider: CacheProvider,
    @inject("TokenProvider") private provider: TokenProvider,
    @inject("LockManager") private lockManager: LockManager
  ) {}

  /**
   * Orchestrates the retrieval of the token.
   * Handles cache hit, cache miss, expiration checking, and auto-refresh safely with mutex.
   */
  async getToken(): Promise<string> {
    try {
      const cached = await this.getCachedToken();
      
      if (cached && this.isValid(cached.expires)) {
        if (this.needsRefresh(cached.expires)) {
          logger.info("Token within refresh window, triggering background refresh");
          this.refreshTokenSafe().catch((err) => {
            logger.error({ err }, "Background token refresh failed");
          });
        }

        logger.debug("Cache hit for Rajuk token");
        return cached.token;
      }

      logger.info("Cache miss or token expired, requesting new token synchronously");
      return await this.refreshTokenSafe();
    } catch (error) {
      logger.error({ error }, "Failed to get Rajuk token");
      throw error;
    }
  }

  /**
   * Forces a cache invalidation and requests a new token.
   * Used as part of the retry strategy when ArcGIS returns 498/499.
   */
  async forceRefresh(): Promise<string> {
    logger.info("Forcing token refresh due to invalidation");
    await this.cacheProvider.del(RAJUK_TOKEN_CACHE_KEY);
    return await this.refreshTokenSafe();
  }

  private async getCachedToken(): Promise<TokenResult | null> {
    const raw = await this.cacheProvider.get(RAJUK_TOKEN_CACHE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as TokenResult;
    } catch (err) {
      logger.error({ err }, "Failed to parse cached token");
      return null;
    }
  }

  /**
   * Wrapper for refreshToken to ensure distributed mutex is used
   */
  private async refreshTokenSafe(): Promise<string> {
    const lockKey = "locks:rajuk:refresh";
    let lock = null;

    try {
      lock = await this.lockManager.acquire(lockKey, this.LOCK_TTL);
    } catch {
      // Another instance holds the lock — wait briefly and check cache
      if (env.REDIS_URL) {
        logger.debug("Another instance is refreshing token, waiting for cache update");
        await new Promise(resolve => setTimeout(resolve, 1000));
        const cached = await this.getCachedToken();
        if (cached && this.isValid(cached.expires)) {
          return cached.token;
        }
      }
      // Proceed directly as fallback safety (lock not held by us, so no release needed)
      return await this.executeTokenRefresh();
    }

    try {
      return await this.executeTokenRefresh();
    } finally {
      await this.lockManager.release(lock);
    }
  }

  private async executeTokenRefresh(): Promise<string> {
    const endTimer = upstreamLatencyHistogram.startTimer({ method: "POST" });
    let result: TokenResult;
    try {
      result = await this.provider.getToken();
      endTimer({ status: 200 });
      tokenRefreshCounter.labels("success").inc();
    } catch (error) {
      endTimer({ status: 500 });
      tokenRefreshCounter.labels("error").inc();
      throw error;
    }
    
    // Save to cache with TTL based on exact expiration
    const ttlSeconds = Math.max(0, Math.floor((result.expires - Date.now()) / 1000));
    
    if (ttlSeconds > 0) {
      await this.cacheProvider.set(
        RAJUK_TOKEN_CACHE_KEY,
        JSON.stringify(result),
        ttlSeconds
      );
      logger.info({ ttlSeconds }, "Token generated and cached successfully");
    }

    return result.token;
  }

  private isValid(expiresAt: number): boolean {
    return Date.now() < expiresAt;
  }

  private needsRefresh(expiresAt: number): boolean {
    const remainingSeconds = Math.floor((expiresAt - Date.now()) / 1000);
    return remainingSeconds < env.TOKEN_REFRESH_WINDOW;
  }
}
