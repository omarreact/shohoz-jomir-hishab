import { Queue } from "bullmq";
import { redis } from "@/src/modules/redis/redis.client";

// Connection reuse from our Redis singleton
const connection = redis;

// Define specific queues for different background domains
export const emailQueue = new Queue("email-queue", { connection });
export const tokenCleanupQueue = new Queue("token-cleanup-queue", { connection });

export class QueueService {
  /**
   * Adds a job to send an email asynchronously.
   */
  static async addEmailJob(payload: { to: string; subject: string; body: string }) {
    await emailQueue.add("send-email", payload, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
    });
  }

  /**
   * Adds a job to clean up expired tokens periodically.
   */
  static async scheduleTokenCleanup() {
    await tokenCleanupQueue.add("cleanup-expired-tokens", {}, {
      repeat: { pattern: "0 0 * * *" }, // Run daily at midnight
    });
  }
}
