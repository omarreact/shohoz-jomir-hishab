import { MouzaSchema, bbsCodeParam, surveyIdParam } from "@/src/features/land-records/schemas";
import { SURVEY_KEY_BY_ID } from "@/src/features/land-records/types";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const districtBbsCode = bbsCodeParam.parse(params.get("districtBbsCode"));
    const upazilaBbsCode = bbsCodeParam.parse(params.get("upazilaBbsCode"));
    const surveyId = surveyIdParam.parse(params.get("surveyId"));
    const districtName = params.get("districtName")?.trim() || "";
    const upazilaName = params.get("upazilaName")?.trim() || "";
    const surveyKey = SURVEY_KEY_BY_ID[surveyId];
    if (!surveyKey) return Response.json({ error: "Unsupported survey" }, { status: 400 });
    const data = await providers.landRecords.listMouzas({ districtBbsCode, upazilaBbsCode, surveyId, surveyKey, districtName, upazilaName });
    return ok(MouzaSchema.array().parse(data));
  } catch (error) { return providerError(error); }
}
