import axios from "axios";
import {
  DivisionSchema,
  DistrictSchema,
  UpazilaSchema,
  SurveySchema,
  MouzaSchema,
  KhatianDetailsSchema,
  KhatianPageSchema,
} from "./schemas";
import type {
  Division,
  District,
  Upazila,
  Survey,
  Mouza,
  KhatianDetails,
  KhatianPage,
  KhatianSearchInput,
} from "./types";

const client = axios.create({
  baseURL: "/api/land-records",
  // The server-side DLRMS adapter allows up to 25s for the government
  // service. Keep the browser timeout slightly longer so a valid slow
  // response is not abandoned prematurely.
  timeout: 30_000,
  headers: { Accept: "application/json" },
});

function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: unknown } | undefined;
    if (typeof payload?.error === "string" && payload.error.trim()) {
      return payload.error.trim();
    }

    if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
      return "সরকারি DLRMS সেবা থেকে উত্তর পেতে বেশি সময় লাগছে। আবার চেষ্টা করুন।";
    }

    if (!error.response) {
      return "নেটওয়ার্ক সংযোগে সমস্যা হয়েছে। ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।";
    }

    if (error.response.status === 429) {
      return "অল্প সময়ে অনেক অনুরোধ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।";
    }

    if (error.response.status >= 500) {
      return "সরকারি ভূমি রেকর্ড সেবা সাময়িকভাবে অনুপলব্ধ। পরে আবার চেষ্টা করুন।";
    }
  }

  return error instanceof Error ? error.message : "ডেটা লোড করা যায়নি।";
}

async function get<T>(
  path: string,
  schema: { parse(value: unknown): T },
  params?: Record<string, string | number>,
): Promise<T> {
  try {
    const response = await client.get(path, { params });
    return schema.parse(response.data);
  } catch (error) {
    throw new Error(apiErrorMessage(error));
  }
}

export const landRecordsApi = {
  divisions: () => get<Division[]>("/divisions", DivisionSchema.array()),
  districts: (divisionBbsCode: string) =>
    get<District[]>("/districts", DistrictSchema.array(), { divisionBbsCode }),
  upazilas: (districtBbsCode: string) =>
    get<Upazila[]>("/upazilas", UpazilaSchema.array(), { districtBbsCode }),
  surveys: (districtBbsCode: string, upazilaBbsCode: string) =>
    get<Survey[]>("/surveys", SurveySchema.array(), {
      districtBbsCode,
      upazilaBbsCode,
    }),
  mouzas: (input: {
    districtBbsCode: string;
    upazilaBbsCode: string;
    surveyId: number;
    districtName: string;
    upazilaName: string;
  }) => get<Mouza[]>("/mouzas", MouzaSchema.array(), input),
  khatians: (input: KhatianSearchInput) =>
    get<KhatianPage>("/khatians", KhatianPageSchema, { ...input }),
  khatian: (
    surveyKey: string,
    id: number,
    context?: { owner?: string; dagNumber?: string; jlNumberId?: number },
  ) => {
    const params: Record<string, string | number> = {};
    if (context?.owner) params.owner = context.owner;
    if (context?.dagNumber) params.dagNumber = context.dagNumber;
    if (context?.jlNumberId) params.jlNumberId = context.jlNumberId;
    return get<KhatianDetails>(
      `/khatians/${surveyKey}/${id}`,
      KhatianDetailsSchema,
      params,
    );
  },
};
