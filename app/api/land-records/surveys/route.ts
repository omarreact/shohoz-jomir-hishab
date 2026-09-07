import { SurveySchema, bbsCodeParam } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const districtBbsCode = bbsCodeParam.parse(params.get("districtBbsCode"));
    const upazilaBbsCode = bbsCodeParam.parse(params.get("upazilaBbsCode"));
    return ok(SurveySchema.array().parse(await providers.landRecords.listSurveys({ districtBbsCode, upazilaBbsCode })));
  } catch (error) { return providerError(error); }
}
