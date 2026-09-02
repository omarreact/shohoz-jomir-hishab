import { z } from "zod";
import type {
  District,
  Division,
  KhatianPage,
  LandRecordProvider,
  Mouza,
  Survey,
  Upazila,
} from "../types";

const BASE_URL = (process.env.EPORCHA_API_BASE_URL || "https://eporcha.tech/api/dlrms").replace(/\/$/, "");
const UPSTREAM_TIMEOUT_MS = 15_000;

const DivisionRawSchema = z.object({
  ID: z.coerce.number().int(),
  NAME: z.string(),
  NAME_EN: z.string().optional().default(""),
  BBS_CODE: z.coerce.string(),
  ROW_STATUS: z.coerce.number().optional().default(1),
}).passthrough();

const DistrictRawSchema = z.object({
  ID: z.coerce.number().int(),
  NAME: z.string(),
  NAME_EN: z.string().optional().default(""),
  BBS_CODE: z.coerce.string(),
  DIVISION_BBS_CODE: z.coerce.string(),
  ROW_STATUS: z.coerce.number().optional().default(1),
}).passthrough();

const UpazilaRawSchema = z.object({
  ID: z.coerce.number().int(),
  NAME: z.string(),
  NAME_EN: z.string().optional().default(""),
  BBS_CODE: z.coerce.string(),
  DISTRICT_BBS_CODE: z.coerce.string(),
  ROW_STATUS: z.coerce.number().optional().default(1),
}).passthrough();

const SurveyRawSchema = z.object({
  SURVEY_ID: z.coerce.number().int(),
  LOCAL_NAME: z.string(),
  SURVEY_ORDER: z.coerce.number().int().optional().default(0),
}).passthrough();

const MouzaRawSchema = z.object({
  ID: z.coerce.number().int(),
  MOUZA_ID: z.coerce.number().int().optional(),
  MOUZA_NAME: z.string(),
  JL_NUMBER: z.coerce.string(),
  DISTRICT_NAME: z.string().optional().default(""),
  UPAZILA_NAME: z.string().optional().default(""),
  SURVEY_ID: z.coerce.number().int(),
  SURVEY_NAME: z.string().optional().default(""),
  SURVEY_NAME_EN: z.string().optional().default(""),
}).passthrough();

const KhatianRawSchema = z.object({
  ID: z.coerce.number().int(),
  KHATIAN_NO: z.coerce.string(),
  OWNERS: z.string().optional().default(""),
  DAGS: z.string().optional().default(""),
  GUARDIANS: z.string().optional().default(""),
  JL_NUMBER_ID: z.coerce.number().int(),
  MOUZA_ID: z.coerce.number().int(),
  TOTAL_LAND: z.union([z.string(), z.number()]).optional(),
  TOTAL_AREA: z.union([z.string(), z.number()]).optional(),
  LAND_AREA: z.union([z.string(), z.number()]).optional(),
}).passthrough();

const ArrayOrDataSchema = <T extends z.ZodType>(item: T) =>
  z.union([z.array(item), z.object({ data: z.array(item) }), z.object({ items: z.array(item) })]);

const KhatianResponseSchema = z.union([
  z.array(KhatianRawSchema),
  z.object({ data: z.array(KhatianRawSchema), total: z.coerce.number().int().nonnegative().optional() }).passthrough(),
  z.object({ items: z.array(KhatianRawSchema), total: z.coerce.number().int().nonnegative().optional() }).passthrough(),
]);

function unwrapArray<T>(value: z.infer<ReturnType<typeof ArrayOrDataSchema<T>>>) {
  if (Array.isArray(value)) return value;
  if ("data" in value) return value.data;
  return value.items;
}

async function getJson(path: string, params: Record<string, string | number>) {
  const url = new URL(`${BASE_URL}/${path.replace(/^\//, "")}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const response = await fetch(url, {
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    headers: {
      Accept: "application/json",
      "User-Agent": "Shohoz-Jomir-Hishab/1.0",
    },
  });

  if (!response.ok) throw new Error(`DLRMS upstream returned ${response.status}`);
  return response.json() as Promise<unknown>;
}

const surveyKeyByLocalName: Record<string, string> = {
  "সি এস": "CS",
  "এস এ": "SA",
  "আর এস": "RS",
  "বি এস": "BS",
  "বি আর এস": "BRS",
};

export function surveyKeyFromLocalName(localName: string): string {
  const normalized = localName.replace(/\s+/g, " ").trim();
  const exact = surveyKeyByLocalName[normalized];
  if (exact) return exact;
  if (/বি\s*আর\s*এস/.test(normalized)) return "BRS";
  if (/আর\s*এস/.test(normalized)) return "RS";
  if (/এস\s*এ/.test(normalized)) return "SA";
  if (/সি\s*এস/.test(normalized)) return "CS";
  if (/বি\s*এস/.test(normalized)) return "BS";
  throw new Error(`Unsupported survey type: ${localName}`);
}

function toDivision(value: z.infer<typeof DivisionRawSchema>): Division {
  return { ID: value.ID, NAME: value.NAME, NAME_EN: value.NAME_EN, BBS_CODE: value.BBS_CODE, ROW_STATUS: value.ROW_STATUS };
}

function toDistrict(value: z.infer<typeof DistrictRawSchema>): District {
  return { ID: value.ID, NAME: value.NAME, NAME_EN: value.NAME_EN, BBS_CODE: value.BBS_CODE, DIVISION_BBS_CODE: value.DIVISION_BBS_CODE, ROW_STATUS: value.ROW_STATUS };
}

function toUpazila(value: z.infer<typeof UpazilaRawSchema>): Upazila {
  return { ID: value.ID, NAME: value.NAME, NAME_EN: value.NAME_EN, BBS_CODE: value.BBS_CODE, DISTRICT_BBS_CODE: value.DISTRICT_BBS_CODE, ROW_STATUS: value.ROW_STATUS };
}

function toSurvey(value: z.infer<typeof SurveyRawSchema>): Survey {
  return { SURVEY_ID: value.SURVEY_ID, LOCAL_NAME: value.LOCAL_NAME, SURVEY_ORDER: value.SURVEY_ORDER };
}

function toMouza(value: z.infer<typeof MouzaRawSchema>): Mouza {
  return {
    ID: value.ID,
    MOUZA_ID: value.MOUZA_ID ?? value.ID,
    MOUZA_NAME: value.MOUZA_NAME,
    JL_NUMBER: value.JL_NUMBER,
    DISTRICT_NAME: value.DISTRICT_NAME,
    UPAZILA_NAME: value.UPAZILA_NAME,
    SURVEY_ID: value.SURVEY_ID,
    SURVEY_NAME: value.SURVEY_NAME,
    SURVEY_NAME_EN: value.SURVEY_NAME_EN,
  };
}

function toKhatian(value: z.infer<typeof KhatianRawSchema>) {
  const totalLand = value.TOTAL_LAND ?? value.TOTAL_AREA ?? value.LAND_AREA;
  return {
    ID: value.ID,
    KHATIAN_NO: value.KHATIAN_NO,
    OWNERS: value.OWNERS,
    DAGS: value.DAGS,
    GUARDIANS: value.GUARDIANS,
    JL_NUMBER_ID: value.JL_NUMBER_ID,
    MOUZA_ID: value.MOUZA_ID,
    ...(totalLand === undefined ? {} : { TOTAL_LAND: String(totalLand) }),
  };
}

export const eporchaLandRecordProvider: LandRecordProvider = {
  async listDivisions(signal) {
    const value = await getJson("divisions", { ROW_STATUS: 1 });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rows = unwrapArray(ArrayOrDataSchema(DivisionRawSchema).parse(value));
    return rows.map(toDivision);
  },

  async listDistricts(divisionBbsCode, signal) {
    const value = await getJson("districts", { ROW_STATUS: 1 });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rows = unwrapArray(ArrayOrDataSchema(DistrictRawSchema).parse(value)).map(toDistrict);
    return divisionBbsCode ? rows.filter((row) => row.DIVISION_BBS_CODE === divisionBbsCode) : rows;
  },

  async listUpazilas(districtBbsCode, signal) {
    const value = await getJson("upazilas", { ROW_STATUS: 1 });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rows = unwrapArray(ArrayOrDataSchema(UpazilaRawSchema).parse(value)).map(toUpazila);
    return districtBbsCode ? rows.filter((row) => row.DISTRICT_BBS_CODE === districtBbsCode) : rows;
  },

  async listSurveys(input, signal) {
    const value = await getJson("upazilas/surveys", {
      DISTRICT_BBS_CODE: input.districtBbsCode,
      UPAZILA_BBS_CODE: input.upazilaBbsCode,
      ROW_STATUS: 1,
    });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rows = unwrapArray(ArrayOrDataSchema(SurveyRawSchema).parse(value));
    return rows.map(toSurvey).sort((a, b) => a.SURVEY_ORDER - b.SURVEY_ORDER);
  },

  async listMouzas(input, signal) {
    const value = await getJson("mouzas/jl-numbers", {
      DISTRICT_BBS_CODE: input.districtBbsCode,
      UPAZILA_BBS_CODE: input.upazilaBbsCode,
      X_DISTRICT_EN: input.districtName,
      X_UPAZILA_EN: input.upazilaName,
      X_SURVEY_KEY: input.surveyKey,
      SURVEY_ID: input.surveyId,
      ROW_STATUS: 1,
    });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    const rows = unwrapArray(ArrayOrDataSchema(MouzaRawSchema).parse(value));
    return rows.map(toMouza);
  },

  async listKhatians(input, signal) {
    const value = await getJson(`index-khatian/${input.surveyKey}`, {
      SURVEY: input.surveyKey,
      JL_NUMBER_ID: input.jlNumberId,
      PAGE_NO: input.page,
      PAGE_SIZE: input.pageSize,
      ROW_STATUS: 1,
    });
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");

    const parsed = KhatianResponseSchema.parse(value);
    const rows = Array.isArray(parsed) ? parsed : parsed.data ?? parsed.items;
    const total = Array.isArray(parsed) ? undefined : parsed.total;
    return {
      items: rows.map(toKhatian),
      page: input.page,
      pageSize: input.pageSize,
      ...(total === undefined ? {} : { total }),
      hasNextPage: total === undefined ? rows.length === input.pageSize : input.page * input.pageSize < total,
    } satisfies KhatianPage;
  },
};
