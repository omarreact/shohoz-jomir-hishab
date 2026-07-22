import { injectable } from "tsyringe";
import Redlock, { Lock } from "redlock";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

@injectable()
export class LockManager {
  private redlock: Redlock | null = null;

  constructor() {
    const redisClient = getRedisClient();
    if (redisClient) {
      this.redlock = new Redlock([redisClient], {
        driftFactor: 0.01,
        retryCount: 3,
        retryDelay: 200,
        retryJitter: 200,
      });

      this.redlock.on("error", (error) => {
        logger.error({ error }, "Redlock error");
      });
    }
  }

  /**
   * Acquires a lock if Redis is configured.
   * If Redis is not configured (Memory Cache mode), it bypasses the lock 
   * (assumes single instance).
   */
  async acquire(key: string, ttlMs: number): Promise<Lock | null> {
    if (!this.redlock) {
      logger.debug("Redis not configured, skipping lock acquisition");
      return null;
    }

    try {
      const lock = await this.redlock.acquire([key], ttlMs);
      logger.debug({ key }, "Lock acquired");
      return lock;
    } catch (error) {
      logger.warn({ key }, "Failed to acquire lock, might be held by another instance");
      throw new Error(`Failed to acquire lock for ${key}`);
    }
  }

  async release(lock: Lock | null): Promise<void> {
    if (lock) {
      try {
        await lock.release();
        logger.debug("Lock released");
      } catch (error) {
        logger.error({ error }, "Failed to release lock");
      }
    }
  }
}
