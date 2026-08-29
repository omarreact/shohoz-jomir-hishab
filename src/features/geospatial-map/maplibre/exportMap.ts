import type { Map as MapLibreMap } from "maplibre-gl";

export interface HighResolutionMapExportOptions {
  width?: number;
  height?: number;
  filename?: string;
}

function waitForMapIdle(map: MapLibreMap): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    map.once("idle", finish);
    map.triggerRepaint();
    window.setTimeout(finish, 2000);
  });
}

export async function exportMapAsHighResolutionPng(
  map: MapLibreMap,
  options: HighResolutionMapExportOptions = {},
): Promise<void> {
  const width = Math.max(1024, Math.min(options.width ?? 3840, 7680));
  const height = Math.max(576, Math.min(options.height ?? 2160, 4320));
  const filename = options.filename ?? "landbd-map-4k.png";
  const container = map.getContainer();
  const canvas = map.getCanvas();
  const previousWidth = container.style.width;
  const previousHeight = container.style.height;
  const previousPixelRatio = map.getPixelRatio();

  try {
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    map.setPixelRatio(1);
    map.resize();
    await waitForMapIdle(map);

    const dataUrl = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = filename;
    anchor.click();
  } finally {
    container.style.width = previousWidth;
    container.style.height = previousHeight;
    map.setPixelRatio(previousPixelRatio);
    map.resize();
  }
}
