import pino from "pino";
import { env } from "@/src/shared/config/env";
import { v4 as uuidv4 } from "uuid";
import { AsyncLocalStorage } from "async_hooks";

export const asyncLocalStorage = new AsyncLocalStorage<Map<string, string>>();

const isDevelopment = env.NODE_ENV !== "production";

export const logger = pino({
  level: env.LOG_LEVEL,
  mixin() {
    const store = asyncLocalStorage.getStore();
    return {
      traceId: store?.get("traceId") || "no-trace",
    };
  },
  ...(isDevelopment && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
      },
    },
  }),
});

/**
 * Middleware utility for wrapping functions with a trace context.
 */
export const withTrace = <T>(
  traceId: string | null | undefined,
  fn: () => T
): T => {
  const store = new Map<string, string>();
  store.set("traceId", traceId || uuidv4());
  return asyncLocalStorage.run(store, fn);
};
