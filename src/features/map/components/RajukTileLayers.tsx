import React from "react";
import { TileLayer, LayersControl } from "react-leaflet";
import { buildRajukTileProxyUrl } from "@/src/shared/http/api/rajukTiles";

interface RajukTileLayersProps {
  isMS: boolean;
}

function getTileUrl(servicePath: string): string {
  const url = buildRajukTileProxyUrl(servicePath, {
    z: "{z}",
    y: "{y}",
    x: "{x}",
  });
  return decodeURIComponent(url);
}

export function RajukTileLayers({ isMS }: RajukTileLayersProps) {

  return (
    <>
      <LayersControl.Overlay checked={isMS} name="MS Mauza (Rajuk)">
        <TileLayer
          url={getTileUrl("Hosted/MS_Mauza_Tiles_Final")}
          opacity={0.8}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay checked={!isMS} name="RS Mauza (Rajuk)">
        <TileLayer
          url={getTileUrl("Hosted/RS_Mauza_Tiles_Final")}
          opacity={0.8}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay checked name="Overlay Boundary Tiles">
        <TileLayer
          url={getTileUrl("Hosted/Overlay_Boundary_Tiles")}
          opacity={1.0}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay name="RS Mauza 282 Scale">
        <TileLayer
          url={getTileUrl("Hosted/RS_Mauza_282Scale")}
          opacity={0.8}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay name="DAP Proposed Landuse">
        <TileLayer
          url={getTileUrl("Hosted/DAP_proposed_landuse")}
          opacity={0.6}
        />
      </LayersControl.Overlay>

      <LayersControl.Overlay name="Transport Network">
        <TileLayer
          url={getTileUrl("Hosted/Transport_Network_Tiles")}
          opacity={0.9}
        />
      </LayersControl.Overlay>
    </>
  );
}
