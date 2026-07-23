import { redis } from "./redis.client";

const memoryCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Fallback in-memory cache used when Redis is unavailable.
 * Values are kept in memory for the specified TTL.
 */
function getFromMemory<T>(key: string): T | null {
  const entry = memoryCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryCache.delete(key);
    return null;
  }
  try {
    return JSON.parse(entry.value) as T;
  } catch {
    return entry.value as unknown as T;
  }
}

function setInMemory(key: string, value: string, ttlInSeconds?: number): void {
  const expiresAt = ttlInSeconds
    ? Date.now() + ttlInSeconds * 1000
    : Date.now() + 60000;
  memoryCache.set(key, { value, expiresAt });
}

function deleteFromMemory(key: string): void {
  memoryCache.delete(key);
}

export class RedisService {
  /**
   * Retrieves and parses a JSON object from Redis (or memory fallback).
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) {
      return getFromMemory<T>(key);
    }
    try {
      const data = await redis.get(key);
      if (!data) return null;
      try {
        return JSON.parse(data) as T;
      } catch {
        return data as unknown as T;
      }
    } catch {
      // Redis error — try memory fallback
      return getFromMemory<T>(key);
    }
  }

  /**
   * Stores an object in Redis (or memory fallback), automatically serializing it.
   * @param ttlInSeconds Time to live in seconds. Optional.
   */
  static async set(
    key: string,
    value: any,
    ttlInSeconds?: number,
  ): Promise<void> {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    if (!redis) {
      setInMemory(key, serialized, ttlInSeconds);
      return;
    }
    try {
      if (ttlInSeconds) {
        await redis.set(key, serialized, "EX", ttlInSeconds);
      } else {
        await redis.set(key, serialized);
      }
    } catch {
      setInMemory(key, serialized, ttlInSeconds);
    }
  }

  /**
   * Deletes a key from Redis (or memory fallback).
   */
  static async delete(key: string): Promise<void> {
    if (!redis) {
      deleteFromMemory(key);
      return;
    }
    try {
      await redis.del(key);
    } catch {
      deleteFromMemory(key);
    }
  }

  /**
   * Increments a key, useful for rate limiting (or memory fallback).
   */
  static async increment(key: string, ttlInSeconds?: number): Promise<number> {
    if (!redis) {
      const current = (getFromMemory<number>(key) ?? 0) + 1;
      setInMemory(key, String(current), ttlInSeconds);
      return current;
    }
    try {
      const value = await redis.incr(key);
      if (value === 1 && ttlInSeconds) {
        await redis.expire(key, ttlInSeconds);
      }
      return value;
    } catch {
      const current = (getFromMemory<number>(key) ?? 0) + 1;
      setInMemory(key, String(current), ttlInSeconds);
      return current;
    }
  }
}
