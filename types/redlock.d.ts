declare module "redlock" {
  export interface RedlockOptions {
    driftFactor?: number;
    retryCount?: number;
    retryDelay?: number;
    retryJitter?: number;
  }

  export interface Lock {
    release(): Promise<void>;
  }

  export default class Redlock {
    constructor(redisClients: unknown[], options?: RedlockOptions);
    on(event: "error", callback: (error: Error) => void): void;
    acquire(keys: string[], ttl: number): Promise<Lock>;
  }
}
