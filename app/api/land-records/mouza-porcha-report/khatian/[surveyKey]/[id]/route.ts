import { z } from "zod";
import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { khatianMatchesMouza } from "@/src/features/land-records/lib/mouza-khatian-identity";
import { KhatianDetailsSchema, idParam } from "@/src/features/land-records/schemas";
import { getFullKhatian } from "@/src/features/land-records/server/full-khatian-service";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { providers } from "@/src/features/land-records/server/provider";
import type { KhatianDetails, KhatianPage } from "@/src/features/land-records/types";

const surveySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);
const detailSchema = z.enum(["base", "full"]);

function invalid(message: string): Response {
  return Response.json({ error: message }, { status: 400, headers: { "Cache-Control": "no-store" } });
}

/**
 * A single, explicitly selected khatian from the Mouza report index.
 * Keeps Mouza entitlement checks separate from the DLRMS search service.
 * Never supports unfiltered bulk retrieval or bypasses the paywall.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ surveyKey: string; id: string }> },
) {
  const denied = await checkServiceAccess(request, "mouza-porcha");
  if (denied) return denied;

  try {
    const pathParams = await context.params;
    const survey = surveySchema.safeParse(pathParams.surveyKey);
    const parsedId = idParam.safeParse(pathParams.id);
    const query = new URL(request.url).searchParams;
    const parsedJl = idParam.safeParse(query.get("jlNumberId"));
    const parsedDetail = detailSchema.safeParse(query.get("detail") ?? "base");
    if (!survey.success || !parsedId.success || !parsedJl.success || !parsedDetail.success) {
      return invalid("Invalid survey, khatian ID, mouza/JL ID or detail mode");
    }
    const id = Number(parsedId.data);
    const jlNumberId = Number(parsedJl.data);
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(jlNumberId) || jlNumberId <= 0) {
      return invalid("Invalid khatian or mouza/JL ID");
    }

    // Verify the official source record belongs to the selected JL. When the
    // official detail omits JL_NUMBER_ID, check the exact source index instead.
    const official = KhatianDetailsSchema.parse(
      await providers.landRecords.getKhatian(survey.data, id, request.signal),
    );
    let matchingRows: KhatianPage["items"] = [];
    if (!official.JL_NUMBER_ID) {
      const found = await providers.landRecords.listKhatians({
        surveyKey: survey.data,
        jlNumberId,
        khatianNo: official.KHATIAN_NO,
        page: 1,
        pageSize: 100,
      }, request.signal);
      matchingRows = found.items;
    }
    if (!khatianMatchesMouza(official, jlNumberId, matchingRows)) {
      return Response.json(
        { error: "নির্বাচিত মৌজার সঙ্গে খতিয়ানটির উৎস পরিচয় মেলেনি।" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (parsedDetail.data === "base") return ok(official);

    const full = FullKhatianSchema.parse(
      await getFullKhatian({ surveyKey: survey.data, id, jlNumberId }, request.signal),
    );
    if (!khatianMatchesMouza(full.base as KhatianDetails, jlNumberId, matchingRows)) {
      return Response.json(
        { error: "খতিয়ানের উৎস পরিচয় পরিবর্তিত হয়েছে।" },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }
    return ok(full);
  } catch (error) {
    return providerError(error);
  }
}
