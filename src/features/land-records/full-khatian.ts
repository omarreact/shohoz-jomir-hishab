import { z } from "zod";
import { KhatianDetailsSchema } from "./schemas";

/**
 * Every enriched field in a FullKhatian response keeps its origin explicit.
 * This prevents reconstructed or mock values from being mistaken for an
 * authoritative government field.
 */
export const LandRecordSourceSchema = z.enum([
  "DLRMS_PUBLIC",
  "DLRMS_TRACKING",
  "DLRMS_HAL_SABEK",
  "LISF_AUTHORIZED",
  "LISF_MOCK",
]);
export type LandRecordSource = z.infer<typeof LandRecordSourceSchema>;

export const SourceEvidenceSchema = z.object({
  field: z.string(),
  source: LandRecordSourceSchema,
  endpoint: z.string().optional(),
  official: z.boolean(),
  access: z.enum(["public", "authorized-private", "mock"]),
  fetchedAt: z.string(),
});
export type SourceEvidence = z.infer<typeof SourceEvidenceSchema>;

export const FullKhatianOwnerSchema = z.object({
  name: z.string(),
  fatherOrHusband: z.string().optional(),
  address: z.string().optional(),
  /** Preserve the government representation exactly; never round legal shares. */
  shareRaw: z.string().optional(),
  source: LandRecordSourceSchema,
});
export type FullKhatianOwner = z.infer<typeof FullKhatianOwnerSchema>;

export const FullKhatianDagSchema = z.object({
  dagNo: z.string(),
  landType: z.string().optional(),
  agriculturalType: z.string().optional(),
  /** Raw values are strings to avoid floating-point changes to official areas. */
  totalAreaRaw: z.string().optional(),
  khatianAreaRaw: z.string().optional(),
  isGovernmentOwned: z.boolean().optional(),
  isRoad: z.boolean().optional(),
  isWetland: z.boolean().optional(),
  isForest: z.boolean().optional(),
  isReligiousType: z.boolean().optional(),
  remarks: z.string().optional(),
  source: LandRecordSourceSchema,
});
export type FullKhatianDag = z.infer<typeof FullKhatianDagSchema>;

export const HalSabekEntrySchema = z.object({
  currentDag: z.string(),
  previousDag: z.string(),
  source: z.literal("DLRMS_HAL_SABEK"),
});
export type HalSabekEntry = z.infer<typeof HalSabekEntrySchema>;

export const KhatianTrackingSchema = z.object({
  displayCode: z.string(),
  surveyId: z.number().optional(),
  khatianId: z.number().optional(),
  khatianNo: z.string().optional(),
  officeId: z.number().nullable().optional(),
  applicationStatus: z.number().optional(),
  createdAt: z.string().optional(),
  mouzaId: z.number().optional(),
  jlNumberId: z.number().optional(),
  owners: z.string().optional(),
  dags: z.string().optional(),
  totalLandRaw: z.string().nullable().optional(),
  divisionBbsCode: z.string().optional(),
  divisionName: z.string().optional(),
  districtBbsCode: z.string().optional(),
  districtName: z.string().optional(),
  upazilaBbsCode: z.string().optional(),
  upazilaName: z.string().optional(),
  mouzaName: z.string().optional(),
  matchesBaseRecord: z.boolean(),
});
export type KhatianTracking = z.infer<typeof KhatianTrackingSchema>;

export const FullKhatianDeedSchema = z.object({
  deedNo: z.string().optional(),
  deedType: z.string().optional(),
  referenceDeedNo: z.string().optional(),
  balamBookNo: z.string().optional(),
  deedDate: z.string().optional(),
  tafsilInformation: z.string().optional(),
  ownerInformation: z.string().optional(),
  sellerInformation: z.string().optional(),
  officeInformation: z.string().optional(),
  scannedDeedLink: z.string().optional(),
  source: LandRecordSourceSchema,
});
export type FullKhatianDeed = z.infer<typeof FullKhatianDeedSchema>;

export const LisfEnrichmentSchema = z.object({
  status: z.enum(["disabled", "mock", "not-configured", "ready", "error"]),
  message: z.string().optional(),
  owners: z.array(FullKhatianOwnerSchema),
  dags: z.array(FullKhatianDagSchema),
  taxAmountRaw: z.string().optional(),
  referenceKhatians: z.array(z.string()),
  referenceDags: z.array(z.string()),
  deeds: z.array(FullKhatianDeedSchema),
  /** Official formatted khatian payload, populated only by an authorized provider. */
  formattedRecord: z.unknown().optional(),
});
export type LisfEnrichment = z.infer<typeof LisfEnrichmentSchema>;

export const FullKhatianSchema = z.object({
  base: KhatianDetailsSchema,
  owners: z.array(FullKhatianOwnerSchema),
  dags: z.array(FullKhatianDagSchema),
  tracking: KhatianTrackingSchema.optional(),
  halSabek: z.array(HalSabekEntrySchema),
  lisf: LisfEnrichmentSchema,
  evidence: z.array(SourceEvidenceSchema),
  warnings: z.array(z.string()),
  generatedAt: z.string(),
});
export type FullKhatian = z.infer<typeof FullKhatianSchema>;
