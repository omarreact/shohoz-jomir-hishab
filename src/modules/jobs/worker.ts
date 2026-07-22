import { Worker, Job } from "bullmq";
import { redis } from "@/src/modules/redis/redis.client";
import { prisma } from "@/src/modules/database/prisma";
// Assuming Pino logger is available, or use console for now
import pino from "pino";

const logger = pino();
const connection = redis;

// 1. Worker for processing emails
export const emailWorker = new Worker(
  "email-queue",
  async (job: Job) => {
    logger.info(`Processing email job ${job.id} for ${job.data.to}`);
    // Simulate sending email via a provider (e.g. SendGrid / SES)
    await new Promise((resolve) => setTimeout(resolve, 500));
    logger.info(`Successfully sent email to ${job.data.to}`);
  },
  { connection }
);

emailWorker.on("completed", (job) => {
  logger.info(`Email job ${job.id} completed successfully`);
});
emailWorker.on("failed", (job, err) => {
  logger.error(`Email job ${job?.id} failed: ${err.message}`);
});


// 2. Worker for token cleanup (background cron job)
export const tokenCleanupWorker = new Worker(
  "token-cleanup-queue",
  async () => {
    logger.info("Running token cleanup job...");
    const result = await prisma.session.deleteMany({
      where: {
        expiresAt: { lt: new Date() }
      }
    });
    logger.info(`Deleted ${result.count} expired sessions.`);
  },
  { connection }
);

tokenCleanupWorker.on("completed", (job) => {
  logger.info(`Token cleanup job ${job.id} completed successfully`);
});
tokenCleanupWorker.on("failed", (job, err) => {
  logger.error(`Token cleanup job ${job?.id} failed: ${err.message}`);
});
