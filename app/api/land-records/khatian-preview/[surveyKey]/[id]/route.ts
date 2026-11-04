import { z } from "zod";
import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { KhatianDetailsSchema, idParam } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";

const surveySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS", "MUTATION"]);

/** Read-only official preview. Full enriched khatian detail remains billable.
 * Never expose unsanitized upstream data or let the client bypass access rules. */
export async function GET(
  request: Request,
  context: { params: Promise<{ surveyKey: string; id: string }> },
) {
  const denied = await checkServiceAccess(request, "dlrms-khatian");
  if (denied) return denied;
  try {
    const params = await context.params;
    const survey = surveySchema.safeParse(params.surveyKey);
    const idParsed = idParam.safeParse(params.id);
    if (!survey.success || !idParsed.success) {
      return Response.json({ error: "Invalid survey or khatian ID" }, { status: 400 });
    }
    const id = Number(idParsed.data);
    if (!Number.isSafeInteger(id) || id <= 0) {
      return Response.json({ error: "Invalid khatian ID" }, { status: 400 });
    }
    return ok(KhatianDetailsSchema.parse(
      await providers.landRecords.getKhatian(survey.data, id, request.signal),
    ));
  } catch (error) {
    return providerError(error);
  }
}
