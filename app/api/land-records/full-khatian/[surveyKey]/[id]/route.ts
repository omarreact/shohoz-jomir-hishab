import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { idParam, khatianSearchText } from "@/src/features/land-records/schemas";
import { getFullKhatian } from "@/src/features/land-records/server/full-khatian-service";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);
const bbsCodeSchema = z.string().regex(/^\d{1,3}$/);
const verificationUuidSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
);

function badRequest(message: string) {
  return Response.json(
    { error: message },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ surveyKey: string; id: string }> },
) {
  try {
    const params = await context.params;
    const parsedSurvey = surveyKeySchema.safeParse(params.surveyKey);
    if (!parsedSurvey.success) return badRequest("Invalid survey key");
    const surveyKey = parsedSurvey.data;

    const parsedId = idParam.safeParse(params.id);
    if (!parsedId.success) return badRequest("Invalid Khatian ID");
    const id = Number(parsedId.data);
    if (!Number.isSafeInteger(id)) return badRequest("Invalid Khatian ID");

    const sp = new URL(request.url).searchParams;
    const ownerParsed = khatianSearchText.safeParse(sp.get("owner") || undefined);
    if (!ownerParsed.success) return badRequest("Invalid owner search text");
    const dagParsed = khatianSearchText.safeParse(sp.get("dagNumber") || undefined);
    if (!dagParsed.success) return badRequest("Invalid dag number search text");

    const verificationRaw = sp.get("verificationUuid")?.trim() || undefined;
    const verificationParsed = verificationRaw ? verificationUuidSchema.safeParse(verificationRaw) : null;
    if (verificationParsed && !verificationParsed.success) return badRequest("Invalid verification UUID");

    const jlRaw = sp.get("jlNumberId")?.trim() || undefined;
    const jlParsed = jlRaw ? idParam.safeParse(jlRaw) : null;
    if (jlParsed && !jlParsed.success) return badRequest("Invalid JL number");
    const jlNumberId = jlParsed ? Number(jlParsed.data) : undefined;
    if (jlNumberId !== undefined && !Number.isSafeInteger(jlNumberId)) return badRequest("Invalid JL number");

    const divisionRaw = sp.get("divisionBbsCode")?.trim() || undefined;
    const districtRaw = sp.get("districtBbsCode")?.trim() || undefined;
    const upazilaRaw = sp.get("upazilaBbsCode")?.trim() || undefined;

    const divisionParsed = divisionRaw ? bbsCodeSchema.safeParse(divisionRaw) : null;
    const districtParsed = districtRaw ? bbsCodeSchema.safeParse(districtRaw) : null;
    const upazilaParsed = upazilaRaw ? bbsCodeSchema.safeParse(upazilaRaw) : null;
    if (divisionParsed && !divisionParsed.success) return badRequest("Invalid division BBS code");
    if (districtParsed && !districtParsed.success) return badRequest("Invalid district BBS code");
    if (upazilaParsed && !upazilaParsed.success) return badRequest("Invalid upazila BBS code");

    const result = await getFullKhatian({
      surveyKey,
      id,
      owner: ownerParsed.data,
      dagNumber: dagParsed.data,
      jlNumberId,
      verificationUuid: verificationParsed?.success ? verificationParsed.data : undefined,
      divisionBbsCode: divisionParsed?.success ? divisionParsed.data : undefined,
      districtBbsCode: districtParsed?.success ? districtParsed.data : undefined,
      upazilaBbsCode: upazilaParsed?.success ? upazilaParsed.data : undefined,
    }, request.signal);

    return ok(FullKhatianSchema.parse(result));
  } catch (error) {
    return providerError(error);
  }
}
