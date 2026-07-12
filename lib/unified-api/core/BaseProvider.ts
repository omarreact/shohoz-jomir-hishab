import { ProviderQuery, UnifiedFeature } from "../types";

export abstract class BaseProvider {
  public abstract readonly name: string;
  public abstract readonly type: string;

  /**
   * Primary fetch method that Gateway calls.
   */
  public abstract fetch(query: ProviderQuery): Promise<UnifiedFeature[]>;

  /**
   * Health check for the provider.
   */
  public async health(): Promise<{ status: "up" | "down"; latency: number; error?: string }> {
    const start = performance.now();
    try {
      await this.fetch({ limit: 1 });
      return { status: "up", latency: Math.round(performance.now() - start) };
    } catch (e: any) {
      return { status: "down", latency: Math.round(performance.now() - start), error: e.message };
    }
  }

  /**
   * Normalizes raw API response to UnifiedFeature schema.
   */
  public abstract normalize(rawData: any): UnifiedFeature | UnifiedFeature[];

  /**
   * Force refresh cache/tokens if needed.
   */
  public async refresh(): Promise<void> {
    // Default no-op
  }
}
