import { SurveySchema, bbsCodeParam } from "@/src/features/land-records/schemas";
import {
  MUTATION_SURVEY_ID,
  MUTATION_SURVEY_LABEL,
} from "@/src/features/land-records/types";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const districtBbsCode = bbsCodeParam.parse(params.get("districtBbsCode"));
    const upazilaBbsCode = bbsCodeParam.parse(params.get("upazilaBbsCode"));
    const includeMutation = params.get("includeMutation") === "1";
    const surveys = await providers.landRecords.listSurveys({ districtBbsCode, upazilaBbsCode });
    const data = includeMutation
      ? [
          ...surveys,
          {
            SURVEY_ID: MUTATION_SURVEY_ID,
            LOCAL_NAME: `${MUTATION_SURVEY_LABEL} (নামজারি)`,
            SURVEY_ORDER: 999,
          },
        ]
      : surveys;
    return ok(SurveySchema.array().parse(data));
  } catch (error) { return providerError(error); }
}
