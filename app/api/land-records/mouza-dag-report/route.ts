import type { NextRequest as LandBDNextRequest } from "next/server";
import { enforceServiceAccess } from "@/src/lib/service-entitlement";
import { KhatianPageSchema, idParam, pageSize, positivePage } from "@/src/features/land-records/schemas";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { providers } from "@/src/features/land-records/server/provider";
import { enrichKhatianWithReferenceDatasets } from "@/src/features/land-records/server/reference-khatian-resolver";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS", "MUTATION"]);

/**
 * Dedicated paged source for Mouza Dag Book generation.
 *
 * Identity and record order come from the selected DLRMS mouza index. The
 * client builds a dag -> khatian reverse index from these bounded pages.
 */
export async function GET(request: Request) {
  const denied = await enforceServiceAccess(request as LandBDNextRequest, "mouza-dag-book");
  if (denied) return denied;

  try {
    const params = new URL(request.url).searchParams;
    const surveyKey = surveyKeySchema.parse(params.get("surveyKey"));
    const jlNumberId = Number(idParam.parse(params.get("jlNumberId")));
    if (!Number.isSafeInteger(jlNumberId)) {
      return Response.json({ error: "Invalid JL number" }, { status: 400 });
    }

    const page = positivePage.parse(params.get("page") ?? "1");
    const size = pageSize.parse(params.get("pageSize") ?? "100");

    const data = await providers.landRecords.listKhatians({
      surveyKey,
      jlNumberId,
      page,
      pageSize: size,
    });

    const enriched = {
      ...data,
      items: data.items.map((item) =>
        enrichKhatianWithReferenceDatasets(item, surveyKey)?.record ?? item
      ),
    };

    return ok(KhatianPageSchema.parse(enriched));
  } catch (error) {
    return providerError(error);
  }
}
