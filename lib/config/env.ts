import { z } from "zod";

const envSchema = z.object({
  REDIS_URL: z.string().url().optional(),
  RAJUK_PROVIDER: z.enum(["official", "mock"]).default("official"),
  TOKEN_REFRESH_WINDOW: z.coerce.number().int().min(60).default(300),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PROXY_RATE_LIMIT_WINDOW: z.coerce.number().int().default(60000), // 1 minute
  PROXY_RATE_LIMIT_MAX: z.coerce.number().int().default(100), // 100 requests per window
  RAJUK_PORTAL_TOKEN: z.string().optional(),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:", error.flatten().fieldErrors);
      // We don't throw process.exit(1) in Next.js edge/serverless cleanly, but we can throw Error.
      throw new Error("Invalid environment variables");
    }
    throw error;
  }
};

export const env = parseEnv();
