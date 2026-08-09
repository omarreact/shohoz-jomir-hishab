import { useCallback } from "react";
import { MapService } from "../services/mapService";
import { usePopup } from "../providers/PopupProvider";
import { useSelection } from "../providers/SelectionProvider";

export const useMapIntelligence = () => {
  const {
    clickedPos, setClickedPos,
    isInferring, setIsInferring,
    elevation, setElevation,
    inferredData, setInferredData,
    clearPopup
  } = usePopup();

  const {
    selectedRsId, setSelectedRsId,
    clearSelection
  } = useSelection();

  const handleMapClick = async (lat: number, lng: number) => {
    setClickedPos({ lat, lng });
    setIsInferring(true);
    setElevation(null);
    setInferredData({ rsData: null, landuseData: null, floodData: null });
    setSelectedRsId(null);

    try {
      // 1. Elevation
      const elevationValue = await MapService.fetchElevation(lat, lng);
      if (elevationValue !== null) setElevation(elevationValue);

      // 2. Point geometry for spatial intersection
      const pointGeom = JSON.stringify({
        x: lng,
        y: lat,
        spatialReference: { wkid: 4326 },
      });

      const url = new URL("/api/unified", window.location.origin);
      url.searchParams.append("include", "plots,landuse,flood");
      url.searchParams.append("geometry", pointGeom);
      url.searchParams.append("geometryType", "esriGeometryPoint");
      url.searchParams.append("spatialRel", "esriSpatialRelIntersects");

      const res = await fetch(url.toString());
      const json = await res.json();

      const rs = json.data?.plots?.[0]?.properties || null;
      const landuse = json.data?.landuse?.[0]?.properties || null;
      const flood = json.data?.flood?.[0]?.properties || null;

      if (rs?.id) setSelectedRsId(rs.id);
      setInferredData({ rsData: rs, landuseData: landuse, floodData: flood });

      // Dispatch event to sync with SearchPanel
      if (typeof window !== "undefined" && rs) {
        window.dispatchEvent(
          new CustomEvent("map-intelligence-success", {
            detail: { rsData: rs, landuseData: landuse, floodData: flood },
          })
        );
      }
    } catch (err) {
      console.error("Inference Engine Error:", err);
    } finally {
      setIsInferring(false);
    }
  };

  const clearIntelligence = () => {
    clearPopup();
    clearSelection();
  };

  return {
    clickedPos,
    isInferring,
    elevation,
    inferredData,
    selectedRsId,
    setClickedPos,
    setSelectedRsId,
    setInferredData,
    handleMapClick,
    clearIntelligence
  };
};
