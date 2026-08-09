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

  /**
   * Shared HTTP fetch+parse helper to avoid code duplication between
   * the initial request and the retry-after-token-refresh path.
   */
  private async makeFetch(query: ProviderQuery, token: string) {
    const baseUrl = `https://masterplan.rajuk.gov.bd/server/rest/services/${this.servicePath}/query`;

    const params = new URLSearchParams({
      f: "json",
      where: query.where || "1=1",
      outFields: (query.outFields as string) || "*",
      returnGeometry: query.returnGeometry !== undefined ? String(query.returnGeometry) : "true",
      resultRecordCount: String(query.limit || 100),
      resultOffset: String(query.offset || 0),
      token,
    });

    if (query.geometry) params.append("geometry", String(query.geometry));
    if (query.geometryType) params.append("geometryType", String(query.geometryType));
    if (query.spatialRel) params.append("spatialRel", String(query.spatialRel));
    if (query.inSR) params.append("inSR", String(query.inSR));
    if (query.outSR) params.append("outSR", String(query.outSR));
    if (query.returnDistinctValues !== undefined) {
      params.append("returnDistinctValues", String(query.returnDistinctValues));
    }

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
      throw new ApiError(
        `Rajuk API returned status ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    let rawJson: unknown;
    try {
      rawJson = await response.json();
    } catch (e: unknown) {
      throw new ApiError(
        `Rajuk API JSON parse error: ${e instanceof Error ? e.message : "unknown"}`,
        500,
      );
    }

    return RajukFeatureResponseSchema.parse(rawJson);
  }

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    const token = await TokenManager.getInstance().getToken();

    let data;
    try {
      data = await this.makeFetch(query, token);
    } catch (e: unknown) {
      if (e instanceof ApiError) throw e;
      throw new ApiError(`Rajuk API Error: ${e instanceof Error ? e.message : "unknown"}`, 500);
    }

    if (data.error) {
      if (data.error.code === 498 || data.error.code === 499) {
        // Token expired — refresh and retry once
        logger.warn(`Token expired (${data.error.code}), refreshing and retrying`);
        const newToken = await TokenManager.getInstance().refreshToken();
        const retryData = await this.makeFetch(query, newToken);

        if (retryData.error) {
          throw new ApiError(retryData.error.message || "Unknown error after token refresh", retryData.error.code || 400);
        }
        return this.normalize(retryData);
      }
      throw new ApiError(`Rajuk API Error: ${data.error.message}`, data.error.code || 400);
    }

    return this.normalize(data);
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
          spatialReference: (data as Record<string, unknown>).spatialReference,
        }
      };
    });
  }
}

