import { z } from "zod";

/**
 * Contract for /api/mouza-map/download query params.
 * Never accept arbitrary remote URLs — only mouza identity + export options.
 */
export const mouzaExportQuerySchema = z.object({
  mouza: z
    .string()
    .trim()
    .min(2, "mouza is required")
    .max(120)
    .refine((v) => !/[<>"']/.test(v), "Invalid mouza parameter"),
  jl: z.string().trim().max(32).optional(),
  format: z.enum(["geotiff", "raw"]).default("geotiff"),
  layers: z.enum(["rs", "ms", "combined"]).default("rs"),
  maxDim: z.coerce.number().int().min(256).max(8192).default(6144),
});

export type MouzaExportQuery = z.infer<typeof mouzaExportQuerySchema>;
