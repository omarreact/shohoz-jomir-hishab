export type LayerType = "basemap" | "raster-overlay" | "vector-overlay";

export interface LayerDefinition {
  id: string;
  displayName: string;
  type: LayerType;
  sourceUrl?: string; // For raster overlays and basemaps
  defaultVisible: boolean;
  opacity?: number;
  maxZoom?: number;
  maxNativeZoom?: number;
  minZoom?: number;
  zIndex?: number;
}

export class LayerRegistry {
  private static layers: Map<string, LayerDefinition> = new Map();

  public static register(layer: LayerDefinition) {
    this.layers.set(layer.id, layer);
  }

  public static registerMultiple(layers: LayerDefinition[]) {
    layers.forEach(l => this.register(l));
  }

  public static get(id: string): LayerDefinition | undefined {
    return this.layers.get(id);
  }

  public static getAll(): LayerDefinition[] {
    return Array.from(this.layers.values());
  }

  public static getBasemaps(): LayerDefinition[] {
    return this.getAll().filter((l) => l.type === "basemap");
  }

  public static getOverlays(): LayerDefinition[] {
    return this.getAll().filter((l) => l.type !== "basemap");
  }
}
