import { redis } from "./redis.client";

export class RedisService {
  /**
   * Retrieves and parses a JSON object from Redis.
   */
  static async get<T>(key: string): Promise<T | null> {
    const data = await redis.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      // If it's a raw string, return as is (cast to T).
      return data as unknown as T;
    }
  }

  /**
   * Stores an object in Redis, automatically serializing it.
   * @param ttlInSeconds Time to live in seconds. Optional.
   */
  static async set(key: string, value: any, ttlInSeconds?: number): Promise<void> {
    const serialized = typeof value === "string" ? value : JSON.stringify(value);
    if (ttlInSeconds) {
      await redis.set(key, serialized, "EX", ttlInSeconds);
    } else {
      await redis.set(key, serialized);
    }
  }

  /**
   * Deletes a key from Redis.
   */
  static async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  /**
   * Increments a key, useful for rate limiting.
   */
  static async increment(key: string, ttlInSeconds?: number): Promise<number> {
    const value = await redis.incr(key);
    // Only set expiry on the first increment (when value is 1)
    if (value === 1 && ttlInSeconds) {
      await redis.expire(key, ttlInSeconds);
    }
    return value;
  }
}
