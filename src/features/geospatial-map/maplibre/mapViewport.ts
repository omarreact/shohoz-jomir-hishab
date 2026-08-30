import type { Map as MapLibreInstance } from "maplibre-gl";

/**
 * Bind MapLibre's WebGL canvas to the container's live layout box.
 *
 * Production symptom without this: letterboxed satellite tiles (canvas sized
 * once at init, never re-measured when the absolute/full-viewport parent settles).
 *
 * Does not recreate the map or re-add layers — only calls map.resize().
 */
export function bindMapViewport(
  map: MapLibreInstance,
  container: HTMLElement,
): () => void {
  const resize = () => {
    if (!container.isConnected) return;
    const { clientWidth, clientHeight } = container;
    if (clientWidth <= 0 || clientHeight <= 0) return;
    map.resize();
  };

  resize();
  const rafId = requestAnimationFrame(resize);

  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(() => {
      resize();
    });
    observer.observe(container);
  }

  const onWindowResize = () => resize();
  window.addEventListener("resize", onWindowResize);

  return () => {
    cancelAnimationFrame(rafId);
    observer?.disconnect();
    window.removeEventListener("resize", onWindowResize);
  };
}

/** Force MapLibre host + internal canvas stack to fill the allocated box. */
export const MAP_HOST_STYLE = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
};
