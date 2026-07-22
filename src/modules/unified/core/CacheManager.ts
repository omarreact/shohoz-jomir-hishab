export class CacheManager {
  private static instance: CacheManager;
  private cache = new Map<string, { data: any; expiresAt: number }>();
  private stats = { hits: 0, misses: 0, sets: 0 };

  private constructor() {}

  public static getInstance(): CacheManager {
    if (!CacheManager.instance) {
      CacheManager.instance = new CacheManager();
    }
    return CacheManager.instance;
  }

  public get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) {
      this.stats.misses++;
      return null;
    }
    if (Date.now() > cached.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    this.stats.hits++;
    return cached.data as T;
  }

  public set(key: string, data: any, ttlMs: number = 3600000): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    this.stats.sets++;
  }

  public clear(): void {
    this.cache.clear();
  }

  public getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
    };
  }
}
