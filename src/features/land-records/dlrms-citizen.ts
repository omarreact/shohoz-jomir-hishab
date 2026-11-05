import { z } from "zod";

export const DlrmsCitizenApplicationSchema = z.object({
  id: z.number().int().positive(),
  displayCode: z.string(),
  jlNumberId: z.number().int().positive(),
  surveyId: z.number().int().positive(),
  khatianNo: z.string(),
  sheetNo: z.string().nullable().optional(),
  jlNumber: z.string(),
  mouza: z.object({
    name: z.string(),
    upazilaBbsCode: z.string().optional(),
    districtBbsCode: z.string().optional(),
    divisionBbsCode: z.string().optional(),
    upazilaName: z.string().optional(),
    districtName: z.string().optional(),
    divisionName: z.string().optional(),
  }),
});

export type DlrmsCitizenApplication = z.infer<typeof DlrmsCitizenApplicationSchema>;

export const DlrmsCitizenInvoiceSchema = z.object({
  source: z.literal("DLRMS_CITIZEN"),
  displayCode: z.string(),
  invoiceId: z.string(),
  orderUuid: z.string(),
  paymentStatus: z.number().int(),
  isDownloadable: z.boolean(),
  totalPrice: z.number().nonnegative(),
  expectedDeliveryDate: z.string().optional(),
  officeName: z.string().optional(),
  officeDistrictName: z.string().optional(),
  applications: z.array(DlrmsCitizenApplicationSchema),
  fetchedAt: z.string(),
});

export type DlrmsCitizenInvoice = z.infer<typeof DlrmsCitizenInvoiceSchema>;

export const DlrmsCitizenPageSchema = z.object({
  id: z.number().int().positive(),
  khatianId: z.number().int().positive(),
  name: z.string(),
  pageType: z.number().int().nullable().optional(),
  pageOrder: z.number().int().nullable().optional(),
  templateType: z.number().int().nullable().optional(),
  fields: z.record(z.string(), z.string()),
});

export type DlrmsCitizenPage = z.infer<typeof DlrmsCitizenPageSchema>;


/** Structured citizen-print rows; deliberately exclude NID, mobile and other identity credentials. */
export const DlrmsCitizenOwnerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  fatherName: z.string().optional(),
  guardianAndAddress: z.string().optional(),
  address: z.string().optional(),
  ownerNo: z.number().int().optional(),
  ownerGroup: z.number().int().optional(),
  ownerAreaRaw: z.string().optional(),
});
export type DlrmsCitizenOwner = z.infer<typeof DlrmsCitizenOwnerSchema>;

export const DlrmsCitizenDagSchema = z.object({
  id: z.number().int().positive(),
  dagNumber: z.string(),
  landType: z.string(),
  totalDagAreaRaw: z.string().optional(),
  khatianDagAreaRaw: z.string().optional(),
  khatianDagPortionRaw: z.string().optional(),
  landTypeId: z.number().int().optional(),
  remarks: z.string().optional(),
});
export type DlrmsCitizenDag = z.infer<typeof DlrmsCitizenDagSchema>;

export const DlrmsCitizenPrintSchema = z.object({
  source: z.literal("DLRMS_CITIZEN"),
  applicationId: z.number().int().positive(),
  fetchedAt: z.string(),
  recordVariant: z.enum(["structured-rows", "legacy-pages", "unknown"]),
  owners: z.array(DlrmsCitizenOwnerSchema),
  dags: z.array(DlrmsCitizenDagSchema),
  totalKhatianDagAreaRaw: z.string().optional(),
  khatian: z.object({
    id: z.number().int().positive(),
    identity: z.string().optional(),
    khatianNo: z.string(),
    uuid: z.string().optional(),
    mouzaId: z.number().int().positive().optional(),
    jlNumberId: z.number().int().positive().optional(),
    officeId: z.number().int().positive().optional(),
    surveyId: z.number().int().positive().optional(),
    rsNo: z.string().optional(),
    mouzaName: z.string().optional(),
    districtName: z.string().optional(),
    upazilaName: z.string().optional(),
    jlNumber: z.string().optional(),
    volumeNo: z.string().optional(),
  }),
  districtName: z.string().optional(),
  totalPages: z.number().int().nonnegative(),
  pages: z.array(DlrmsCitizenPageSchema),
  summary: z.object({
    occupantText: z.array(z.string()),
    shareText: z.array(z.string()),
    dagText: z.array(z.string()),
    landTypeText: z.array(z.string()),
    areaText: z.array(z.string()),
    rentText: z.array(z.string()),
    remarks: z.array(z.string()),
  }),
});

export type DlrmsCitizenPrint = z.infer<typeof DlrmsCitizenPrintSchema>;
