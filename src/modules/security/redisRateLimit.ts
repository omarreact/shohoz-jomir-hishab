import { Redis } from "@upstash/redis";

let redis: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redis !== undefined) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

/**
 * Global fixed-window limiter for serverless deployments.
 * Returns true when the request is allowed. Falls back to an in-memory
 * limiter when Redis is not configured so local development remains usable.
 */
const local = new Map<string, { count: number; expiresAt: number }>();

export async function allowRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  const client = getRedis();
  if (client) {
    const bucket = Math.floor(Date.now() / (windowSeconds * 1000));
    const redisKey = `ratelimit:${key}:${bucket}`;
    const count = await client.incr(redisKey);
    if (count === 1) await client.expire(redisKey, windowSeconds + 1);
    return count <= max;
  }

  const now = Date.now();
  const existing = local.get(key);
  if (!existing || existing.expiresAt <= now) {
    local.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }
  if (existing.count >= max) return false;
  existing.count += 1;
  return true;
}
