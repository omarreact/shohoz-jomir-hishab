import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";

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
      throw new Error(`Open-Meteo API returned status ${response.status}`);
    }

    const data = await response.json();
    return this.normalize({ data, lat, lng }) as UnifiedFeature[];
  }

  public normalize(rawObj: any): UnifiedFeature[] {
    const { data, lat, lng } = rawObj;
    
    // Open-Meteo returns { elevation: [15.0] }
    const elevationValue = (data.elevation && data.elevation.length > 0) ? data.elevation[0] : null;

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
