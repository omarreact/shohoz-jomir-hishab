import { logger } from "@/lib/logger";
import { getRedisClient } from "@/lib/redis";

const shutdownHandlers: Array<() => Promise<void> | void> = [];

export const registerShutdownHandler = (handler: () => Promise<void> | void) => {
  shutdownHandlers.push(handler);
};

export const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);
  
  // Execute all registered shutdown handlers
  for (const handler of shutdownHandlers) {
    try {
      await handler();
    } catch (error) {
      logger.error({ error }, "Error during shutdown handler");
    }
  }

  // Close Redis connection
  const redis = getRedisClient();
  if (redis) {
    try {
      await redis.quit();
      logger.info("Redis connection closed safely");
    } catch (error) {
      logger.error({ error }, "Error closing Redis during shutdown");
    }
  }

  logger.info("Graceful shutdown complete. Exiting process.");
  process.exit(0);
};

// Listen for termination signals if we are not in edge/browser environment
if (typeof process !== "undefined" && typeof process.on === "function") {
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}
