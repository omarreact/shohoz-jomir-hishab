import { UnifiedGeometry } from "../types";

export class GeometryNormalizer {
  /**
   * Converts ESRI Geometry to a standardized format.
   */
  public static normalize(esriGeometry: any): UnifiedGeometry | undefined {
    if (!esriGeometry) return undefined;

    if (esriGeometry.rings) {
      return {
        type: "Polygon",
        coordinates: esriGeometry.rings,
        spatialReference: esriGeometry.spatialReference
      };
    }

    if (esriGeometry.paths) {
      return {
        type: "Polyline",
        coordinates: esriGeometry.paths,
        spatialReference: esriGeometry.spatialReference
      };
    }

    if (esriGeometry.x !== undefined && esriGeometry.y !== undefined) {
      return {
        type: "Point",
        coordinates: [esriGeometry.x, esriGeometry.y],
        spatialReference: esriGeometry.spatialReference
      };
    }

    if (esriGeometry.xmin !== undefined && esriGeometry.ymin !== undefined) {
      return {
        type: "Extent",
        coordinates: [
          [esriGeometry.xmin, esriGeometry.ymin],
          [esriGeometry.xmax, esriGeometry.ymax]
        ],
        spatialReference: esriGeometry.spatialReference
      };
    }

    // Fallback
    return {
      type: "Unknown",
      coordinates: esriGeometry
    };
  }
}
