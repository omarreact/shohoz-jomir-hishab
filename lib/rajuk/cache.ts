import { injectable, inject } from "tsyringe";
import { CacheProvider } from "./types";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";
import { cacheHitCounter } from "@/lib/metrics";

export class MemoryCache implements CacheProvider {
  private cache = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      cacheHitCounter.labels("miss").inc();
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      cacheHitCounter.labels("miss").inc();
      return null;
    }

    cacheHitCounter.labels("hit").inc();
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }
}

export class RedisCacheWrapper implements CacheProvider {
  constructor(private client: import("ioredis").Redis) {}

  async get(key: string): Promise<string | null> {
    try {
      const val = await this.client.get(key);
      cacheHitCounter.labels(val ? "hit" : "miss").inc();
      return val;
    } catch (err) {
      logger.error({ err, key }, "Redis GET error");
      cacheHitCounter.labels("miss").inc();
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    try {
      await this.client.set(key, value, "EX", ttlSeconds);
    } catch (err) {
      logger.error({ err, key }, "Redis SET error");
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (err) {
      logger.error({ err, key }, "Redis DEL error");
    }
  }
}

export const getCacheProvider = (): CacheProvider => {
  const redisClient = getRedisClient();
  if (redisClient) {
    return new RedisCacheWrapper(redisClient);
  }
  return new MemoryCache();
};
