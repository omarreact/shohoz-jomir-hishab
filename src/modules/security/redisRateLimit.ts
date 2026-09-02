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

export type DistributedLock = Readonly<{
  key: string;
  token: string;
}>;

/**
 * Best-effort distributed mutex for expensive serverless work.
 *
 * Redis is mandatory for cross-instance coordination. The lock expires so a
 * crashed Vercel invocation cannot permanently block the same export.
 */
export async function tryAcquireDistributedLock(
  key: string,
  ttlSeconds: number,
): Promise<DistributedLock | null> {
  const client = getRedis();
  if (!client) return null;

  const token = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const acquired = await client.set(`lock:${key}`, token, { nx: true, ex: ttlSeconds });
  return acquired === "OK" ? { key: `lock:${key}`, token } : null;
}

/** Release only the lock owned by this invocation. */
export async function releaseDistributedLock(lock: DistributedLock): Promise<void> {
  const client = getRedis();
  if (!client) return;

  // The compare/delete operation must be atomic; never GET then DEL separately.
  await client.eval(
    "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
    [lock.key],
    [lock.token],
  );
}
