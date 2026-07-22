import CircuitBreaker from "opossum";
import { logger } from "@/lib/logger";

const defaultOptions: CircuitBreaker.Options = {
  timeout: 10000, // If function takes longer than 10 seconds, trigger a failure
  errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
  resetTimeout: 30000, // After 30 seconds, try again
};

export const createCircuitBreaker = <T, R>(
  action: (...args: any[]) => Promise<R>,
  name: string,
  options?: CircuitBreaker.Options
): CircuitBreaker<any[], R> => {
  const breaker = new CircuitBreaker(action, { ...defaultOptions, ...options, name });

  breaker.on("open", () => logger.warn(`Circuit Breaker [${name}] OPENED`));
  breaker.on("halfOpen", () => logger.info(`Circuit Breaker [${name}] HALF-OPEN`));
  breaker.on("close", () => logger.info(`Circuit Breaker [${name}] CLOSED`));
  breaker.on("fallback", () => logger.warn(`Circuit Breaker [${name}] FALLBACK TRIGGERED`));
  
  return breaker;
};
