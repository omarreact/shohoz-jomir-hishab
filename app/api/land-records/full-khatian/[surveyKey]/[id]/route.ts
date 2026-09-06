import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { idParam, khatianSearchText } from "@/src/features/land-records/schemas";
import { getFullKhatian } from "@/src/features/land-records/server/full-khatian-service";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);
const bbsCodeSchema = z.string().regex(/^\d{1,3}$/);

export async function GET(
  request: Request,
  context: { params: Promise<{ surveyKey: string; id: string }> },
) {
  try {
    const params = await context.params;
    const surveyKey = surveyKeySchema.parse(params.surveyKey);
    const id = Number(idParam.parse(params.id));
    if (!Number.isSafeInteger(id)) {
      return Response.json({ error: "Invalid Khatian ID" }, { status: 400 });
    }

    const sp = new URL(request.url).searchParams;
    const owner = khatianSearchText.parse(sp.get("owner") || undefined);
    const dagNumber = khatianSearchText.parse(sp.get("dagNumber") || undefined);
    const verificationUuid = sp.get("verificationUuid")?.trim() || undefined;

    const jlRaw = sp.get("jlNumberId");
    const jlNumberId = jlRaw ? Number(idParam.parse(jlRaw)) : undefined;
    if (jlNumberId !== undefined && !Number.isSafeInteger(jlNumberId)) {
      return Response.json({ error: "Invalid JL number" }, { status: 400 });
    }

    const divisionRaw = sp.get("divisionBbsCode")?.trim() || undefined;
    const districtRaw = sp.get("districtBbsCode")?.trim() || undefined;
    const upazilaRaw = sp.get("upazilaBbsCode")?.trim() || undefined;
    const divisionBbsCode = divisionRaw ? bbsCodeSchema.parse(divisionRaw) : undefined;
    const districtBbsCode = districtRaw ? bbsCodeSchema.parse(districtRaw) : undefined;
    const upazilaBbsCode = upazilaRaw ? bbsCodeSchema.parse(upazilaRaw) : undefined;

    const result = await getFullKhatian({
      surveyKey,
      id,
      owner,
      dagNumber,
      jlNumberId,
      verificationUuid,
      divisionBbsCode,
      districtBbsCode,
      upazilaBbsCode,
    }, request.signal);

    return ok(FullKhatianSchema.parse(result));
  } catch (error) {
    return providerError(error);
  }
}
