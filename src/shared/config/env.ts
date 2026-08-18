import { z } from "zod";

const envSchema = z.object({
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PROXY_RATE_LIMIT_WINDOW: z.coerce.number().int().default(60000),
  PROXY_RATE_LIMIT_MAX: z.coerce.number().int().default(100),
});

const parseEnv = () => {
  try { return envSchema.parse(process.env); }
  catch (error) { if (error instanceof z.ZodError) { console.error("❌ Invalid environment variables:", error.flatten().fieldErrors); throw new Error("Invalid environment variables"); } throw error; }
};
export const env = parseEnv();
