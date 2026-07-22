import { container } from "@/lib/di/container";
import { RajukTokenManager } from "./manager";
import { logger } from "@/lib/logger";

import * as cron from "node-cron";

let scheduledTask: cron.ScheduledTask | null = null;

export const startTokenRefreshCron = () => {
  if (scheduledTask) {
    logger.debug("Cron is already running");
    return;
  }

  // Run every 2 minutes
  scheduledTask = cron.schedule("*/2 * * * *", async () => {
    logger.info("Cron job: Checking if Rajuk token needs refresh");
    const manager = container.resolve(RajukTokenManager);

    try {
      // Calling getToken internally checks TTL and handles background refresh with Mutex.
      // This ensures if 100 instances run this cron, only 1 acquires the lock and calls the provider.
      await manager.getToken();
    } catch (error) {
      logger.error({ error }, "Cron token refresh failed");
    }
  });

  logger.info("Rajuk token refresh cron job scheduled");
};

export const stopTokenRefreshCron = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    logger.info("Rajuk token refresh cron job stopped");
  }
};
