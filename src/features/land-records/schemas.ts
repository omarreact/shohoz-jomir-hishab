import { z } from "zod";

export const DivisionSchema = z.object({ ID: z.number(), NAME: z.string(), NAME_EN: z.string(), BBS_CODE: z.string(), ROW_STATUS: z.number() });
export const DistrictSchema = z.object({ ID: z.number(), NAME: z.string(), NAME_EN: z.string(), BBS_CODE: z.string(), DIVISION_BBS_CODE: z.string(), ROW_STATUS: z.number() });
export const UpazilaSchema = z.object({ ID: z.number(), NAME: z.string(), NAME_EN: z.string(), BBS_CODE: z.string(), DISTRICT_BBS_CODE: z.string(), ROW_STATUS: z.number() });
export const SurveySchema = z.object({ SURVEY_ID: z.number(), LOCAL_NAME: z.string(), SURVEY_ORDER: z.number() });
export const MouzaSchema = z.object({ ID: z.number(), MOUZA_ID: z.number(), MOUZA_NAME: z.string(), JL_NUMBER: z.string(), DISTRICT_NAME: z.string(), UPAZILA_NAME: z.string(), SURVEY_ID: z.number(), SURVEY_NAME: z.string(), SURVEY_NAME_EN: z.string() });
export const KhatianIndexSchema = z.object({ ID: z.number(), KHATIAN_NO: z.string(), OWNERS: z.string(), DAGS: z.string(), GUARDIANS: z.string(), JL_NUMBER_ID: z.number(), MOUZA_ID: z.number(), TOTAL_LAND: z.string().optional() });
export const KhatianPageSchema = z.object({ items: z.array(KhatianIndexSchema), page: z.number().int().positive(), pageSize: z.number().int().positive(), total: z.number().int().nonnegative().optional(), hasNextPage: z.boolean() });
export const KhatianDetailsSchema = KhatianIndexSchema.extend({
  KHATIAN_ENTRY_ID: z.number().optional(), IS_LOCKED: z.number(), DIVISION_NAME: z.string(),
  DISTRICT_NAME: z.string(), UPAZILA_NAME: z.string(), JL_NUMBER: z.string(), MOUZA_NAME: z.string(),
  SURVEY_ID: z.number().optional(), SURVEY_NAME: z.string(), TOTAL_LAND: z.string(),
  PUBLIC_RECORD: z.record(z.string(), z.unknown()).optional(),
});

export const MouzaMapEntrySchema = z.object({ id: z.string(), name: z.string(), mimeType: z.string(), size: z.number().nonnegative().optional(), isFolder: z.boolean(), thumbnailUrl: z.string().url().optional(), downloadUrl: z.string().url().optional(), webViewLink: z.string().url().optional() });
export const MouzaMapBrowseSchema = z.object({ parentId: z.string(), path: z.string(), entries: z.array(MouzaMapEntrySchema) });

export const idParam = z.string().trim().min(1).max(100).regex(/^[\w-]+$/);
export const bbsCodeParam = z.string().trim().min(1).max(20).regex(/^[A-Za-z0-9.-]+$/);
export const surveyIdParam = z.coerce.number().int().min(1).max(100);
export const positivePage = z.coerce.number().int().min(1).max(100000);
export const pageSize = z.coerce.number().int().min(1).max(100);
export const khatianSearchText = z.string().trim().max(120).optional();
