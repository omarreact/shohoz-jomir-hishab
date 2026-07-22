import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { ElevationResponseSchema } from "@/src/types/rajuk";
import { ApiError } from "@/src/shared/utils/errors";

export class ElevationProvider extends BaseProvider {
  public readonly name = "ElevationProvider";
  public readonly type = "External";

  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> {
    const lat = query.latitude || query.lat || "23.8103";
    const lng = query.longitude || query.lng || "90.4125";

    const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`;

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new ApiError(`Open-Meteo API returned status ${response.status}`, response.status);
    }

    try {
      const rawJson = await response.json();
      return this.normalize({ data: rawJson, lat, lng });
    } catch (e: unknown) {
      if (e instanceof Error) {
        throw new ApiError(`Open-Meteo Parse Error: ${e.message}`, 500);
      }
      throw new ApiError("Open-Meteo Parse Error", 500);
    }
  }

  public normalize(rawObj: unknown): UnifiedFeature[] {
    const { data, lat, lng } = rawObj as { data: unknown, lat: string, lng: string };
    const parsedData = ElevationResponseSchema.parse(data);
    
    // Open-Meteo returns { elevation: [15.0] }
    const elevationValue = (parsedData.elevation && parsedData.elevation.length > 0) ? parsedData.elevation[0] : null;

    return [{
      id: `elev-${lat}-${lng}`,
      geometry: {
        type: "Point",
        coordinates: [parseFloat(lng), parseFloat(lat)],
        spatialReference: { wkid: 4326 }
      },
      properties: {
        elevation: elevationValue,
        unit: "meters"
      },
      metadata: {
        layerId: this.name,
        source: "Open-Meteo",
      }
    }];
  }
}
