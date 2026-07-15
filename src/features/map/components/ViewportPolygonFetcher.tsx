import { useState, useCallback } from "react";
import { useMapEvents } from "react-leaflet";

import { SearchService } from "../../search/services/searchService";

export function ViewportPolygonFetcher({
  onPolygonsLoaded,
}: {
  onPolygonsLoaded: (features: any[]) => void;
}) {
  const [isFetching, setIsFetching] = useState(false);

  const fetchInView = useCallback(
    async (map: any) => {
      const zoom = map.getZoom();
      if (zoom < 16) {
        onPolygonsLoaded([]);
        return;
      }
      if (isFetching) return;
      setIsFetching(true);
      try {
        const bounds = map.getBounds();
        const envelope = JSON.stringify({
          xmin: bounds.getWest(),
          ymin: bounds.getSouth(),
          xmax: bounds.getEast(),
          ymax: bounds.getNorth(),
          spatialReference: { wkid: 4326 },
        });

        const res = await SearchService.fetchUnifiedData(
          ["plots"],
          {
            geometry: envelope,
            geometryType: "esriGeometryEnvelope",
            limit: 2000,
          }
        );

        onPolygonsLoaded(res.data?.plots || []);
      } catch (e) {
        console.error("Viewport RS fetch error:", e);
      } finally {
        setIsFetching(false);
      }
    },
    [onPolygonsLoaded, isFetching],
  );

  useMapEvents({
    moveend(e) {
      fetchInView(e.target);
    },
    zoomend(e) {
      fetchInView(e.target);
    },
    load(e) {
      fetchInView(e.target);
    },
  });

  return null;
}
