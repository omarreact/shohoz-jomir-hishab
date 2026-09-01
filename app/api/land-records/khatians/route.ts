import { KhatianPageSchema, bbsCodeParam, idParam, pageSize, positivePage } from "@/src/features/land-records/schemas";
import { SURVEY_KEY_BY_ID } from "@/src/features/land-records/types";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const surveyKey = surveyKeySchema.parse(params.get("surveyKey"));
    const jlNumberId = Number(idParam.parse(params.get("jlNumberId")));
    if (!Number.isSafeInteger(jlNumberId)) return Response.json({ error: "Invalid JL number" }, { status: 400 });
    const page = positivePage.parse(params.get("page") ?? "1");
    const size = pageSize.parse(params.get("pageSize") ?? "20");
    const data = await providers.landRecords.listKhatians({ surveyKey, jlNumberId, page, pageSize: size });
    return ok(KhatianPageSchema.parse(data));
  } catch (error) { return providerError(error); }
}

void SURVEY_KEY_BY_ID;
void bbsCodeParam;
