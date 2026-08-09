import { BaseProvider } from "./BaseProvider";
import { ProviderQuery, UnifiedResponse, UnifiedResponseData, UnifiedFeature } from "../types";
import { RajukFeatureProvider } from "../providers/RajukFeatureProvider";
import { RajukPlotProvider } from "../providers/RajukPlotProvider";
import { ElevationProvider } from "../providers/ElevationProvider";
import { CacheManager } from "./CacheManager";

export class UnifiedGateway {
  private providers: Record<string, BaseProvider> = {};
  private cacheManager: CacheManager;

  constructor() {
    this.cacheManager = CacheManager.getInstance();
    this.registerProviders();
  }

  private registerProviders() {
    // RS plots: Geometry (Layer 0) + Info Table (Layer 6)
    this.providers["plots"] = new RajukPlotProvider("plots", "RS");
    // MS plots: Geometry (Layer 5) + Info Table (Layer 2)
    this.providers["msPlots"] = new RajukPlotProvider("msPlots", "MS");

    // Static location/district endpoint
    this.providers["location"] = new RajukFeatureProvider("location", "rajuk_db/Rajuk_dap_db/FeatureServer/1");
    this.providers["elevation"] = new ElevationProvider();
  }

  public async handleRequest(includes: string, query: ProviderQuery): Promise<UnifiedResponse> {
    const start = performance.now();
    const data: UnifiedResponseData = {};
    const errors: Array<{ provider: string; message: string; details?: unknown }> = [];

    // 1. Determine which providers to run
    const keys = includes ? includes.split(",").map(k => k.trim()) : Object.keys(this.providers);
    
    // Legacy support: if frontend asks for landuse, flood, or transport, we intercept and fetch "plots"
    const requiresPlotData = keys.some(k => ["plots", "landuse", "flood", "transport"].includes(k));
    const activeKeys = keys.filter(k => this.providers[k] && !["landuse", "flood", "transport"].includes(k));
    
    if (requiresPlotData && !activeKeys.includes("plots")) {
      activeKeys.push("plots");
    }

    // 2. Fetch all in parallel using Promise.allSettled
    const promises = activeKeys.map(async (key) => {
      const provider = this.providers[key];
      const cacheKey = `unified:${key}:${JSON.stringify(query)}`;
      
      // Check Cache
      const cached = this.cacheManager.get<UnifiedFeature[]>(cacheKey);
      if (cached) {
        return { key, data: cached };
      }

      // Fetch
      const result = await provider.fetch(query);
      
      // Set Cache (5 mins)
      this.cacheManager.set(cacheKey, result, 5 * 60 * 1000);
      
      return { key, data: result };
    });

    const results = await Promise.allSettled(promises);

    // 3. Aggregate results
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        data[res.value.key] = res.value.data;
        
        // Legacy Support: map the joined Plot data to the separated keys the frontend expects
        if (res.value.key === "plots") {
          // If the frontend asked for landuse, flood, or transport, we inject them manually
          if (keys.includes("landuse")) {
            data["landuse"] = res.value.data.map((f: UnifiedFeature) => ({
              ...f,
              properties: {
                Landuse: f.properties.luZoning || "অজানা",
                ...f.properties
              }
            }));
          }
          if (keys.includes("flood")) {
            data["flood"] = res.value.data
              .filter((f: UnifiedFeature) => f.properties.floodZone && f.properties.floodZone !== "No Flood Zone")
              .map((f: UnifiedFeature) => ({
                ...f,
                properties: {
                  ...f.properties
                }
              }));
          }
          if (keys.includes("transport")) {
            // DAP db info table doesn't have transport/road line info. We return empty to avoid false alerts.
            data["transport"] = [];
          }
        }
      } else {
        const failedKey = activeKeys[idx];
        errors.push({
          provider: failedKey,
          message: res.reason?.message || "Unknown error occurred",
        });
      }
    });

    const executionTime = Math.round(performance.now() - start);

    return {
      // success = no errors at all, OR partial success (at least one provider worked), OR no providers requested
      success: activeKeys.length === 0 || errors.length === 0 || Object.keys(data).length > 0,
      generatedAt: new Date().toISOString(),
      executionTime,
      version: "2.0.0",
      data,
      metadata: {
        requestedProviders: activeKeys.length,
        successfulProviders: Object.keys(data).length,
        failedProviders: errors.length,
      },
      errors,
    };
  }

  public getRegisteredProviders(): string[] {
    return Object.keys(this.providers);
  }

  public async getHealth(): Promise<Record<string, { status: string; latency?: number; error?: string }>> {
    const healthData: Record<string, { status: string; latency?: number; error?: string }> = {};
    const promises = Object.keys(this.providers).map(async (key) => {
      const provider = this.providers[key];
      healthData[key] = await provider.health();
    });
    
    await Promise.all(promises);
    return healthData;
  }
}
