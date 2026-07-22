export interface UnifiedGeometry {
  type: "Point" | "Polygon" | "Polyline" | "Extent" | "Unknown";
  coordinates?: any;
  spatialReference?: any;
}

export interface UnifiedFeature {
  id: string | number;
  geometry?: UnifiedGeometry;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface UnifiedResponseData {
  plots?: UnifiedFeature[];
  landuse?: UnifiedFeature[];
  flood?: UnifiedFeature[];
  boundary?: UnifiedFeature[];
  transport?: UnifiedFeature[];
  landmarks?: UnifiedFeature[];
  poi?: UnifiedFeature[];
  mauza?: UnifiedFeature[];
  elevation?: UnifiedFeature[];
  porcha?: UnifiedFeature[];
  [key: string]: UnifiedFeature[] | undefined;
}

export interface UnifiedResponse {
  success: boolean;
  generatedAt: string;
  executionTime: number;
  version: string;
  data: UnifiedResponseData;
  metadata: Record<string, any>;
  errors: Array<{
    provider: string;
    message: string;
    details?: any;
  }>;
}

export interface ProviderQuery {
  where?: string;
  geometry?: string;
  geometryType?: string;
  spatialRel?: string;
  inSR?: string;
  outSR?: string;
  offset?: number;
  limit?: number;
  [key: string]: any;
}
