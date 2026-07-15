import { z } from "zod";

// Base Geometry Types
export const PointSchema = z.object({
  x: z.number(),
  y: z.number(),
  spatialReference: z.object({
    wkid: z.number().optional(),
    latestWkid: z.number().optional(),
  }).optional(),
});

export const PolygonSchema = z.object({
  rings: z.array(z.array(z.array(z.number()))),
  spatialReference: z.object({
    wkid: z.number().optional(),
    latestWkid: z.number().optional(),
  }).optional(),
});

// Rajuk Plot Attributes
export const RajukPlotAttributesSchema = z.object({
  OBJECTID: z.number().optional(),
  rs_plot_no: z.string().nullable().optional(),
  ms_plot_no: z.string().nullable().optional(),
  plot_no: z.string().nullable().optional(),
  areaAcre: z.number().nullable().optional(),
  area: z.number().nullable().optional(),
  length: z.number().nullable().optional(),
  mDistrict: z.string().nullable().optional(),
  upazilaPs: z.string().nullable().optional(),
  mauza: z.string().nullable().optional(),
  landuse: z.string().nullable().optional(),
  dapZone: z.string().nullable().optional(),
  far: z.number().nullable().optional(),
  maximumHe: z.number().nullable().optional(),
  zone: z.string().nullable().optional(),
  subzone: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
}).passthrough(); // Allow unknown fields

// Unified Feature Response
export const UnifiedFeatureSchema = z.object({
  attributes: RajukPlotAttributesSchema,
  geometry: PolygonSchema.or(PointSchema).optional(),
});

export type RajukPlotAttributes = z.infer<typeof RajukPlotAttributesSchema>;
export type UnifiedFeature = z.infer<typeof UnifiedFeatureSchema>;

// Unified Gateway Response
export const UnifiedResponseSchema = z.object({
  success: z.boolean(),
  generatedAt: z.string(),
  executionTime: z.number(),
  version: z.string(),
  data: z.record(z.string(), z.array(UnifiedFeatureSchema)),
  metadata: z.record(z.string(), z.any()).optional(),
  errors: z.array(z.object({
    provider: z.string(),
    message: z.string(),
    details: z.any().optional(),
  })).optional(),
});

export type UnifiedResponse = z.infer<typeof UnifiedResponseSchema>;

// Rajuk API Response
export const RajukFeatureResponseSchema = z.object({
  features: z.array(z.object({
    attributes: z.record(z.string(), z.any()),
    geometry: z.record(z.string(), z.any()).optional(),
  })).optional(),
  error: z.object({
    code: z.number().optional(),
    message: z.string().optional(),
    details: z.any().optional(),
  }).optional(),
}).passthrough();

// Elevation API Response
export const ElevationResponseSchema = z.object({
  elevation: z.array(z.number()).optional(),
}).passthrough();

// Firebase Porcha Response
export const FirebasePorchaItemSchema = z.object({
  id: z.string().optional(),
}).passthrough();

export const FirebaseResponseSchema = z.object({
  data: z.array(FirebasePorchaItemSchema).optional(),
}).passthrough();
