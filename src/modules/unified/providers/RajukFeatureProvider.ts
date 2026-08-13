import { BaseProvider } from "../core/BaseProvider";
import { TokenManager } from "../core/TokenManager";
import { FieldNormalizer } from "../normalizers/FieldNormalizer";
import { GeometryNormalizer } from "../normalizers/GeometryNormalizer";
import { ProviderQuery, UnifiedFeature } from "../types";
import { RajukFeatureResponseSchema } from "@/src/types/rajuk";
import { ApiError } from "@/src/shared/utils/errors";
import { logger } from "@/src/shared/utils/logger";

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
    });

    if (token) {
      params.append("token", token);
    }

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
      throw new ApiError(`Rajuk API returned status ${response.status} ${response.statusText}`, response.status);
    }

    let data;
    try {
      const rawJson = await response.json();
      data = RajukFeatureResponseSchema.parse(rawJson);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new ApiError(`Rajuk API Parse/Validation Error: ${e.message}`, 500);
      }
      throw new ApiError("Rajuk API Parse Error", 500);
    }

    if (data.error) {
      if (data.error.code === 498 || data.error.code === 499) {
        // Token expired, clear from cache, refresh from DB and retry once
        TokenManager.getInstance().reportTokenFailure(data.error.code);
        await TokenManager.getInstance().refreshToken();
        return this.retryFetch(query);
      }
      throw new ApiError(`Rajuk API Error: ${data.error.message}`, data.error.code || 400);
    }

    return this.normalize(data);
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
    });

    if (token) {
      params.append("token", token);
    }

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
      throw new ApiError(`Rajuk API returned status ${response.status} on retry`, response.status);
    }

    try {
      const rawJson = await response.json();
      const data = RajukFeatureResponseSchema.parse(rawJson);
      
      if (data.error) throw new ApiError(data.error.message || "Unknown error", data.error.code || 400);
      return this.normalize(data);
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new ApiError(`Rajuk API Parse Error on retry: ${e.message}`, 500);
      }
      throw new ApiError("Rajuk API Parse Error on retry", 500);
    }
  }

  public normalize(rawData: unknown): UnifiedFeature[] {
    const data = RajukFeatureResponseSchema.parse(rawData);
    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((feature) => {
      const properties = FieldNormalizer.normalize(feature.attributes);
      const geometry = GeometryNormalizer.normalize(feature.geometry);

      return {
        id: properties.id,
        properties,
        geometry,
        metadata: {
          layerId: this.name,
          spatialReference: (data as any).spatialReference,
        }
      };
    });
  }
}
