import Redis from "ioredis";

// Global connection pool to prevent exhausting connections in Next.js Hot Module Replacement (HMR)
const globalForRedis = global as unknown as { redis: Redis | null };

let redisInstance: Redis | null = null;

function createRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    console.log(
      "REDIS_URL not found. Redis features disabled (graceful fallback).",
    );
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    lazyConnect: true, // Don't connect until first command
  });

  // Suppress unhandled error events to prevent crashes
  client.on("error", (err) => {
    console.warn("Redis connection error (suppressed):", err.message);
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
