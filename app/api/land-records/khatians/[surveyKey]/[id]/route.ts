import { KhatianDetailsSchema, idParam } from "@/src/features/land-records/schemas";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

export async function GET(_request: Request, context: { params: Promise<{ surveyKey: string; id: string }> }) {
  try {
    const params = await context.params;
    const surveyKey = surveyKeySchema.parse(params.surveyKey);
    const id = Number(idParam.parse(params.id));
    if (!Number.isSafeInteger(id)) return Response.json({ error: "Invalid Khatian ID" }, { status: 400 });
    return ok(KhatianDetailsSchema.parse(await providers.landRecords.getKhatian(surveyKey, id)));
  } catch (error) {
    return providerError(error);
  }
}
