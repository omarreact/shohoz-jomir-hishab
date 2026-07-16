import { SearchProvider, SearchResult } from "../types";

export class CoordinateProvider implements SearchProvider {
  name = "CoordinateProvider";
  priority = 100; // High priority for direct coordinates

  // Supports parsing "lat, lng"
  supports(query: string): boolean {
    const coordRegex = /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/;
    return coordRegex.test(query.trim());
  }

  async search(query: string): Promise<SearchResult[]> {
    if (!this.supports(query)) return [];

    const [latStr, lngStr] = query.split(",");
    const lat = parseFloat(latStr.trim());
    const lng = parseFloat(lngStr.trim());

    // Basic bounding box validation for Bangladesh
    if (lat < 20 || lat > 27 || lng < 88 || lng > 93) {
      // Optional: still return it but with lower confidence, or return empty
    }

    return [
      {
        id: `coord-${lat}-${lng}`,
        title: `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        subtitle: "Map Location",
        type: "COORDINATE",
        source: "Local",
        score: {
          exactMatch: true,
          confidence: 1.0,
          relevance: 100,
        },
        actions: [
          {
            id: "fly-to",
            label: "Fly to Location",
            type: "fly-to",
            payload: { lat, lng, zoom: 18 }
          }
        ],
        data: { lat, lng }
      }
    ];
  }
}
