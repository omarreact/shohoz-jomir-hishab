import { LatLngExpression, LatLngBoundsExpression } from "leaflet";

export interface MapController {
  /**
   * Zooms the map to a specific feature or bounds.
   */
  zoomToBounds: (bounds: LatLngBoundsExpression) => void;

  /**
   * Smoothly pans and zooms to a location.
   */
  flyToLocation: (latLng: LatLngExpression, zoom?: number) => void;

  /**
   * Adjusts the map view to fit all currently visible layers or features.
   */
  fitVisibleLayers: () => void;

  /**
   * Invalidates the map size, forcing Leaflet to recalculate its dimensions.
   * Useful when the map container resizes.
   */
  invalidateSize: () => void;
}
