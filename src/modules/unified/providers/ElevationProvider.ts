import { BaseProvider } from "../core/BaseProvider";
import { ProviderQuery, UnifiedFeature } from "../types";
import { ElevationResponseSchema } from "@/src/types/external";
import { ApiError } from "@/src/shared/utils/errors";

export class ElevationProvider extends BaseProvider {
  public readonly name = "ElevationProvider";
  public readonly type = "External";
  public async fetch(query: ProviderQuery): Promise<UnifiedFeature[]> { const lat = query.latitude || query.lat || "23.8103"; const lng = query.longitude || query.lng || "90.4125"; const response = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lng}`, { headers: { Accept: "application/json" }, cache: "no-store" }); if (!response.ok) throw new ApiError(`Open-Meteo API returned status ${response.status}`, response.status); try { return this.normalize({ data: await response.json(), lat, lng }); } catch (e: unknown) { throw new ApiError(`Open-Meteo Parse Error: ${e instanceof Error ? e.message : "unknown error"}`, 500); } }
  public normalize(rawObj: unknown): UnifiedFeature[] { const { data, lat, lng } = rawObj as { data: unknown, lat: string, lng: string }; const parsedData = ElevationResponseSchema.parse(data); const elevationValue = parsedData.elevation?.[0] ?? null; return [{ id: `elev-${lat}-${lng}`, geometry: { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)], spatialReference: { wkid: 4326 } }, properties: { elevation: elevationValue, unit: "meters" }, metadata: { layerId: this.name, source: "Open-Meteo" } }]; }
}
