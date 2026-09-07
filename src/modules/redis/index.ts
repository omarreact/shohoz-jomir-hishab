import { Redis } from "ioredis";
import { logger } from "@/src/shared/logger";

let redisClient: Redis | null = null;

export const getRedisClient = (): Redis | null => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("REDIS_URL not found. Using memory cache fallback.");
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on("error", (err) => {
      logger.error({ err }, "Redis Client Error");
    });

    redisClient.on("connect", () => {
      logger.info("Connected to Redis");
    });

    return redisClient;
  } catch (err) {
    logger.error({ err }, "Failed to initialize Redis client");
    return null;
  }
};
