import { BaseProvider } from "../core/BaseProvider";
import { TokenManager } from "../core/TokenManager";
import { FieldNormalizer } from "../normalizers/FieldNormalizer";
import { GeometryNormalizer } from "../normalizers/GeometryNormalizer";
import { ProviderQuery, UnifiedFeature } from "../types";

export class RajukFeatureProvider extends BaseProvider {
  public readonly name: string;
  public readonly type = "RajukFeatureServer";
  private readonly servicePath: string;

  constructor(name: string, servicePath: string) {
    super();
    this.name = name;
    this.servicePath = servicePath;
  }

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    const token = await TokenManager.getInstance().getToken();
    const baseUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${this.servicePath}/query`;

    const params = new URLSearchParams({
      f: "json",
      where: query.where || "1=1",
      outFields: query.outFields || "*",
      returnGeometry: query.returnGeometry !== undefined ? query.returnGeometry.toString() : "true",
      resultRecordCount: (query.limit || 100).toString(),
      resultOffset: (query.offset || 0).toString(),
      token: token,
    });

    if (query.geometry) params.append("geometry", query.geometry);
    if (query.geometryType) params.append("geometryType", query.geometryType);
    if (query.spatialRel) params.append("spatialRel", query.spatialRel);
    if (query.inSR) params.append("inSR", query.inSR);
    if (query.outSR) params.append("outSR", query.outSR);
    if (query.returnDistinctValues !== undefined) params.append("returnDistinctValues", query.returnDistinctValues.toString());

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://masterplan.rajuk.gov.bd/",
      },
      body: params.toString(),
      // Using Next.js fetch cache optionally, but we will rely on our unified CacheManager mostly.
      cache: "no-store", 
    });

    if (!response.ok) {
      throw new Error(`Rajuk API returned status ${response.status} ${response.statusText}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e: any) {
      throw new Error(`Rajuk API JSON Parse Error: ${e.message}`);
    }

    if (data.error) {
      if (data.error.code === 498 || data.error.code === 499) {
        // Token expired, force refresh and retry once
        await TokenManager.getInstance().refreshToken();
        return this.retryFetch(query);
      }
      throw new Error(`Rajuk API Error: ${data.error.message}`);
    }

    return this.normalize(data) as UnifiedFeature[];
  }

  private async retryFetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    const token = await TokenManager.getInstance().getToken();
    const baseUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${this.servicePath}/query`;
    
    const params = new URLSearchParams({
      f: "json",
      where: query.where || "1=1",
      outFields: query.outFields || "*",
      returnGeometry: query.returnGeometry !== undefined ? query.returnGeometry.toString() : "true",
      resultRecordCount: (query.limit || 100).toString(),
      resultOffset: (query.offset || 0).toString(),
      token: token,
    });

    if (query.geometry) params.append("geometry", query.geometry);
    if (query.geometryType) params.append("geometryType", query.geometryType);
    if (query.spatialRel) params.append("spatialRel", query.spatialRel);
    if (query.inSR) params.append("inSR", query.inSR);
    if (query.outSR) params.append("outSR", query.outSR);
    if (query.returnDistinctValues !== undefined) params.append("returnDistinctValues", query.returnDistinctValues.toString());

    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: "https://masterplan.rajuk.gov.bd/",
      },
      body: params.toString(),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Rajuk API returned status ${response.status} on retry`);
    }

    try {
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      return this.normalize(data) as UnifiedFeature[];
    } catch (e: any) {
      throw new Error(`Rajuk API JSON Parse Error on retry: ${e.message}`);
    }
  }

  public normalize(rawData: any): UnifiedFeature[] {
    if (!rawData.features || !Array.isArray(rawData.features)) return [];

    return rawData.features.map((feature: any) => {
      const properties = FieldNormalizer.normalize(feature.attributes);
      const geometry = GeometryNormalizer.normalize(feature.geometry);

      return {
        id: properties.id,
        properties,
        geometry,
        metadata: {
          layerId: this.name,
          spatialReference: rawData.spatialReference,
        }
      };
    });
  }
}
