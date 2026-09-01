import axios from "axios";
import { DivisionSchema, DistrictSchema, UpazilaSchema, SurveySchema, MouzaSchema, KhatianPageSchema } from "./schemas";
import type { Division, District, Upazila, Survey, Mouza, KhatianPage } from "./types";

const client = axios.create({ baseURL: "/api/land-records", timeout: 10000, headers: { Accept: "application/json" } });

async function get<T>(path: string, schema: { parse(value: unknown): T }, params?: Record<string, string | number>) {
  const response = await client.get(path, { params });
  return schema.parse(response.data);
}

export const landRecordsApi = {
  divisions: () => get<Division[]>("/divisions", DivisionSchema.array()),
  districts: (divisionBbsCode: string) => get<District[]>("/districts", DistrictSchema.array(), { divisionBbsCode }),
  upazilas: (districtBbsCode: string) => get<Upazila[]>("/upazilas", UpazilaSchema.array(), { districtBbsCode }),
  surveys: (districtBbsCode: string, upazilaBbsCode: string) => get<Survey[]>("/surveys", SurveySchema.array(), { districtBbsCode, upazilaBbsCode }),
  mouzas: (input: { districtBbsCode: string; upazilaBbsCode: string; surveyId: number; districtName: string; upazilaName: string }) => get<Mouza[]>("/mouzas", MouzaSchema.array(), input),
  khatians: (input: { surveyKey: string; jlNumberId: number; page: number; pageSize: number }) => get<KhatianPage>("/khatians", KhatianPageSchema, input),
};
