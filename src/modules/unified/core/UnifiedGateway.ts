import { BaseProvider } from "./BaseProvider";
import { ProviderQuery, UnifiedResponse, UnifiedResponseData } from "../types";
import { ElevationProvider } from "../providers/ElevationProvider";
import { FirebaseProvider } from "../providers/FirebaseProvider";

export class UnifiedGateway {
  private providers: Record<string, BaseProvider> = {};
  constructor() {
    this.providers["elevation"] = new ElevationProvider();
    const fbProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (fbProjectId && fbProjectId !== "your-project-id" && !fbProjectId.startsWith("your-")) this.providers["porcha"] = new FirebaseProvider("porcha", "config", "porcha_api");
  }
  public async handleRequest(includes: string, query: ProviderQuery): Promise<UnifiedResponse> {
    const start = performance.now(); const data: UnifiedResponseData = {}; const errors: Array<{ provider: string; message: string; details?: unknown }> = [];
    const keys = includes ? includes.split(",").map(k => k.trim()).filter(k => this.providers[k]) : Object.keys(this.providers);
    const results = await Promise.allSettled(keys.map(async key => ({ key, data: await this.providers[key].fetch(query) })));
    results.forEach((res, idx) => { if (res.status === "fulfilled") data[res.value.key] = res.value.data; else errors.push({ provider: keys[idx], message: res.reason?.message || "Unknown error" }); });
    return { success: errors.length < keys.length || keys.length === 0, generatedAt: new Date().toISOString(), executionTime: Math.round(performance.now() - start), version: "3.0.0", data, metadata: { requestedProviders: keys.length, successfulProviders: Object.keys(data).length, failedProviders: errors.length }, errors };
  }
  public getRegisteredProviders() { return Object.keys(this.providers); }
  public async getHealth(): Promise<Record<string, unknown>> { const health: Record<string, unknown> = {}; await Promise.all(Object.entries(this.providers).map(async ([key, provider]) => { health[key] = await provider.health(); })); return health; }
}
