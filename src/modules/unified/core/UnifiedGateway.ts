import { BaseProvider } from "./BaseProvider";
import { ProviderQuery, UnifiedResponse, UnifiedResponseData, UnifiedFeature } from "../types";
import { RajukFeatureProvider } from "../providers/RajukFeatureProvider";
import { RajukPlotProvider } from "../providers/RajukPlotProvider";
import { ElevationProvider } from "../providers/ElevationProvider";
import { FirebaseProvider } from "../providers/FirebaseProvider";

export class UnifiedGateway {
  private providers: Record<string, BaseProvider> = {};
  private dynamicLoaded: boolean = false;

  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    // Register the new virtual plot providers that handle Geometry + Info Table joining
    this.providers["plots"] = new RajukPlotProvider("plots", "RS");
    this.providers["msPlots"] = new RajukPlotProvider("msPlots", "MS");
    
    // Location endpoints
    this.providers["districts"] = new RajukFeatureProvider("districts", "rajuk_db/Rajuk_dap_db/FeatureServer/10");
    this.providers["thanas"] = new RajukFeatureProvider("thanas", "rajuk_db/Rajuk_dap_db/FeatureServer/9");
    this.providers["mouzas"] = new RajukFeatureProvider("mouzas", "rajuk_db/Rajuk_dap_db/FeatureServer/1");
    this.providers["elevation"] = new ElevationProvider();
    
    // Add firebase provider for porcha
    // Only register Firebase provider if real credentials are configured
    const fbProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (fbProjectId && fbProjectId !== 'your-project-id' && !fbProjectId.startsWith('your-')) {
      this.providers["porcha"] = new FirebaseProvider("porcha", "config", "porcha_api");
    }
  }

  private async loadDynamicProviders() {
    if (this.dynamicLoaded) return;
    this.dynamicLoaded = true;

    try {
      const fbProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      if (fbProjectId && fbProjectId !== 'your-project-id' && !fbProjectId.startsWith('your-')) {
         const { db } = await import("@/src/modules/database/firebaseAdmin");
         if (db) {
            const snapshot = await db.collection("rajuk_discovered_apis").where("status", "==", "ইমপোর্ট করা হয়েছে").get();
            
            const rsOverrides: Record<string, string> = {};
            const msOverrides: Record<string, string> = {};

            snapshot.forEach(doc => {
               const api = doc.data();
               const providerId = `dynamic_${doc.id}`;
               if (!this.providers[providerId]) {
                 if (api.serviceType && api.serviceType.includes("Server")) {
                   const pathParts = new URL(api.url).pathname.split("/rest/services/")[1];
                   if (pathParts) {
                     this.providers[providerId] = new RajukFeatureProvider(api.name || providerId, pathParts);
                     
                     // Skip restricted mapservers/feature servers known to fail without special auth
                     if (pathParts.toLowerCase().includes("rajuk_smart_inspections")) {
                       return;
                     }
                     
                     // Detect if this overrides a standard layer based on layerId and serviceName
                     if (api.serviceType === "FeatureServer") {
                       if (api.layerId === "0") rsOverrides["geometry"] = pathParts;
                       if (api.layerId === "6") rsOverrides["info"] = pathParts;
                       if (api.layerId === "7") rsOverrides["landuse"] = pathParts;
                       if (api.layerId === "8") rsOverrides["flood"] = pathParts;
                       
                       if (api.layerId === "5") msOverrides["geometry"] = pathParts;
                       if (api.layerId === "2") msOverrides["info"] = pathParts;
                       if (api.layerId === "3") msOverrides["landuse"] = pathParts;
                       if (api.layerId === "4") msOverrides["flood"] = pathParts;
                     }
                   }
                 }
               }
            });

            if (Object.keys(rsOverrides).length > 0 && this.providers["plots"]) {
               (this.providers["plots"] as RajukPlotProvider).updateProviders(rsOverrides);
            }
            if (Object.keys(msOverrides).length > 0 && this.providers["msPlots"]) {
               (this.providers["msPlots"] as RajukPlotProvider).updateProviders(msOverrides);
            }
         }
      }
    } catch (e) {
      console.warn("UnifiedGateway: Failed to load dynamic APIs from Firebase", e);
    }
  }

  public async handleRequest(includes: string, query: ProviderQuery): Promise<UnifiedResponse> {
    const start = performance.now();
    await this.loadDynamicProviders();

    const data: UnifiedResponseData = {};
    const errors: Array<{ provider: string; message: string; details?: any }> = [];

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
      // Fetch directly without in-memory caching
      const result = await provider.fetch(query);
      return { key, data: result };
    });

    const results = await Promise.allSettled(promises);

    // 3. Aggregate results
    results.forEach((res, idx) => {
      if (res.status === "fulfilled") {
        data[res.value.key] = res.value.data;
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
      success: errors.length < activeKeys.length || activeKeys.length === 0, // Success if at least one provider didn't fail
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

  public async getHealth(): Promise<Record<string, any>> {
    await this.loadDynamicProviders();
    const healthData: Record<string, any> = {};
    const promises = Object.keys(this.providers).map(async (key) => {
      const provider = this.providers[key];
      healthData[key] = await provider.health();
    });
    
    await Promise.all(promises);
    return healthData;
  }
}

