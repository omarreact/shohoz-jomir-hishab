import { z } from "zod";

const LOG_LEVELS = ["fatal", "error", "warn", "info", "debug", "trace", "silent"] as const;
const LOG_LEVEL_ALIASES: Record<string, (typeof LOG_LEVELS)[number]> = { warning: "warn", err: "error", critical: "fatal", verbose: "debug", off: "silent", none: "silent" };

// Normalize LOG_LEVEL (case/whitespace/common aliases) and fall back to "info" instead of failing the build.
const logLevelSchema = z.preprocess((value) => {
  if (typeof value !== "string" || value.trim() === "") return undefined;
  const normalized = value.trim().toLowerCase();
  return LOG_LEVEL_ALIASES[normalized] ?? normalized;
}, z.enum(LOG_LEVELS).default("info")).catch(() => {
  console.warn(`⚠ Invalid LOG_LEVEL; expected one of ${LOG_LEVELS.join(", ")}. Falling back to "info".`);
  return "info" as const;
});

const envSchema = z.object({
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: logLevelSchema,
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PROXY_RATE_LIMIT_WINDOW: z.coerce.number().int().default(60000),
  PROXY_RATE_LIMIT_MAX: z.coerce.number().int().default(100),
});

const parseEnv = () => {
  try { return envSchema.parse(process.env); }
  catch (error) { if (error instanceof z.ZodError) { console.error("❌ Invalid environment variables:", error.flatten().fieldErrors); throw new Error("Invalid environment variables"); } throw error; }
};
export const env = parseEnv();
