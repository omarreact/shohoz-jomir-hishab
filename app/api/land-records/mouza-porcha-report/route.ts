import type { NextRequest as LandBDNextRequest } from "next/server";
import { enforceServiceAccess } from "@/src/lib/service-entitlement";
import { KhatianPageSchema, idParam, pageSize, positivePage } from "@/src/features/land-records/schemas";
import { providerError } from "@/src/features/land-records/server/http";
import { providers } from "@/src/features/land-records/server/provider";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS", "MUTATION"]);

/**
 * Dedicated paged endpoint for the Mouza Porcha Report builder.
 *
 * This route is separate because report generation needs the complete khatian
 * index for one explicitly selected JL/mouza. It stays paginated so a large
 * mouza is never materialized in one serverless request.
 */
export async function GET(request: Request) {
  const denied=await enforceServiceAccess(request as LandBDNextRequest,"mouza-porcha");
  if(denied)return denied;
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
      sourceMode: "official",
    });

    // Direct source only: preserve exactly what the live official DLRMS index
    // returns. Saved/bundled reference and third-party mirror data are excluded.
    return Response.json(KhatianPageSchema.parse(data), {
      headers: {
        "Cache-Control": "no-store",
        "X-LandBD-Source": "DLRMS_PUBLIC_LIVE",
      },
    });
  } catch (error) {
    return providerError(error);
  }
}
