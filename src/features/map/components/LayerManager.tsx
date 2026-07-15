import { LayersControl, TileLayer, FeatureGroup, Polygon, Tooltip } from "react-leaflet";
import { buildRajukTileProxyUrl } from "@/lib/api/rajukTiles";
import { LayerRegistry } from "../layers/registry";
import { getPolygonStyle, getTooltipStyle } from "../utils/styleUtils";

export function LayerManager({ token, rsPolygons, selectedRsId }: { token: string, rsPolygons: any[], selectedRsId: number | null }) {
  const getTileUrl = (servicePath: string) => {
    const url = buildRajukTileProxyUrl(servicePath, {
      z: "{z}",
      y: "{y}",
      x: "{x}",
      token,
    });
    return decodeURIComponent(url);
  };

  const basemaps = LayerRegistry.getBasemaps();
  const rasterOverlays = LayerRegistry.getOverlays().filter(o => o.type === "raster-overlay");
  const vectorOverlays = LayerRegistry.getOverlays().filter(o => o.type === "vector-overlay");

  return (
    <LayersControl position="topright">
      {/* Vector Overlays */}
      {vectorOverlays.map(layer => (
        <LayersControl.Overlay key={layer.id} name={layer.displayName} checked={layer.defaultVisible}>
          <FeatureGroup>
            {layer.id === "rs-plot-vector" && rsPolygons.map((feature: any, idx: number) => {
              if (!feature.geometry?.rings) return null;
              const ring = feature.geometry.rings[0];
              const coords: [number, number][] = ring.map((pt: number[]) => [pt[1], pt[0]]);
              const attrs = feature.attributes || {};
              const label = attrs.rs_plot_no || attrs.plot_no;
              const isSelected = attrs.objectid === selectedRsId;

              return (
                <Polygon
                  key={idx}
                  positions={coords}
                  pathOptions={getPolygonStyle(isSelected)}
                >
                  <Tooltip
                    direction="center"
                    permanent
                    className="bg-transparent border-0 shadow-none fw-bold"
                  >
                    <span style={getTooltipStyle(isSelected)}>
                      {label}
                    </span>
                  </Tooltip>
                </Polygon>
              );
            })}
          </FeatureGroup>
        </LayersControl.Overlay>
      ))}

      {/* Base Layers */}
      {basemaps.map(layer => (
        <LayersControl.BaseLayer key={layer.id} name={layer.displayName} checked={layer.defaultVisible}>
          <TileLayer
            url={layer.sourceUrl!}
            maxZoom={layer.maxZoom || 22}
            maxNativeZoom={layer.maxNativeZoom || 19}
            zIndex={layer.zIndex}
          />
        </LayersControl.BaseLayer>
      ))}

      {/* Raster Overlays */}
      {rasterOverlays.map(layer => (
        <LayersControl.Overlay key={layer.id} name={layer.displayName} checked={layer.defaultVisible}>
          <TileLayer
            url={getTileUrl(layer.sourceUrl!)}
            opacity={layer.opacity || 1}
            maxZoom={layer.maxZoom || 22}
            maxNativeZoom={layer.maxNativeZoom || 22}
            zIndex={layer.zIndex}
          />
        </LayersControl.Overlay>
      ))}
    </LayersControl>
  );
}
