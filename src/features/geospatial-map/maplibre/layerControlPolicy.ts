import {
  ADVANCED_LAYER_VISIBILITY,
  PUBLIC_LAYER_VISIBILITY,
  type LayerKey,
} from "./mapConstants";

/**
 * Public visitors can hide/show layers already included in their public map.
 * All additional RAJUK planning overlays retain the existing auth gate.
 */
export function canToggleRasterLayer(key: LayerKey, isAdvanced: boolean): boolean {
  return isAdvanced || key === "rs" || key === "ms";
}

export function setRasterLayerVisibility(
  current: Record<LayerKey, boolean>,
  key: LayerKey,
  visible: boolean,
  isAdvanced: boolean,
): Record<LayerKey, boolean> {
  if (!canToggleRasterLayer(key, isAdvanced)) return current;
  return { ...current, [key]: visible };
}

export function hideAvailableRasterLayers(
  current: Record<LayerKey, boolean>,
  isAdvanced: boolean,
): Record<LayerKey, boolean> {
  return Object.fromEntries(
    Object.entries(current).map(([key, visible]) => [
      key,
      canToggleRasterLayer(key as LayerKey, isAdvanced) ? false : visible,
    ]),
  ) as Record<LayerKey, boolean>;
}

export function defaultRasterLayerVisibility(isAdvanced: boolean): Record<LayerKey, boolean> {
  return { ...(isAdvanced ? ADVANCED_LAYER_VISIBILITY : PUBLIC_LAYER_VISIBILITY) };
}

/** A checked-off survey layer must also hide its associated vector boundaries. */
export function shouldShowSurveyBoundary(rasterVisible: boolean, boundaryVisible: boolean): boolean {
  return rasterVisible && boundaryVisible;
}
