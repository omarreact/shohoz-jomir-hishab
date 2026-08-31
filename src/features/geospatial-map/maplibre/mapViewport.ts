import type { Map as MapLibreInstance } from "maplibre-gl";

/**
 * Bind MapLibre's WebGL canvas to the browser's live visual viewport and the
 * container's actual layout box.
 *
 * This prevents letterboxing/stale canvas dimensions when mobile browser UI
 * expands/collapses, the device rotates, the keyboard opens, or the parent
 * layout settles after initial render.
 *
 * The viewport is deliberately client-side only: one visitor's dimensions
 * never become a global/server-side map size for another visitor.
 *
 * Does not recreate the map or re-add layers — only calls map.resize().
 */
export function bindMapViewport(
  map: MapLibreInstance,
  container: HTMLElement,
): () => void {
  let resizeRaf: number | null = null;

  const resize = () => {
    resizeRaf = null;
    if (!container.isConnected) return;

    const { clientWidth, clientHeight } = container;
    if (clientWidth <= 0 || clientHeight <= 0) return;

    // Keep CSS viewport information local to this browser instance. These
    // properties are useful to overlays without persisting visitor data.
    const visualViewport = window.visualViewport;
    const width = visualViewport?.width ?? window.innerWidth;
    const height = visualViewport?.height ?? window.innerHeight;
    container.style.setProperty("--landbd-vw", `${width}px`);
    container.style.setProperty("--landbd-vh", `${height}px`);
    container.style.setProperty("--landbd-dpr", `${window.devicePixelRatio || 1}`);

    map.resize();
  };

  const scheduleResize = () => {
    if (resizeRaf !== null) return;
    resizeRaf = requestAnimationFrame(resize);
  };

  resize();
  scheduleResize();

  let observer: ResizeObserver | null = null;
  if (typeof ResizeObserver !== "undefined") {
    observer = new ResizeObserver(scheduleResize);
    observer.observe(container);
  }

  const onWindowResize = () => scheduleResize();
  window.addEventListener("resize", onWindowResize, { passive: true });

  const visualViewport = window.visualViewport;
  visualViewport?.addEventListener("resize", scheduleResize, { passive: true });
  visualViewport?.addEventListener("scroll", scheduleResize, { passive: true });

  const onOrientationChange = () => scheduleResize();
  window.addEventListener("orientationchange", onOrientationChange, { passive: true });

  return () => {
    if (resizeRaf !== null) cancelAnimationFrame(resizeRaf);
    observer?.disconnect();
    window.removeEventListener("resize", onWindowResize);
    visualViewport?.removeEventListener("resize", scheduleResize);
    visualViewport?.removeEventListener("scroll", scheduleResize);
    window.removeEventListener("orientationchange", onOrientationChange);
  };
}

/** Force MapLibre host + internal canvas stack to fill the allocated box. */
export const MAP_HOST_STYLE = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
};
