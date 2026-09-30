import { FullKhatianSchema } from "@/src/features/land-records/full-khatian";
import { idParam } from "@/src/features/land-records/schemas";
import { getFullKhatian } from "@/src/features/land-records/server/full-khatian-service";
import { ok, providerError } from "@/src/features/land-records/server/http";
import { providers } from "@/src/features/land-records/server/provider";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);
const khatianNoSchema = z.string().trim().min(1).max(120);
const bbsCodeSchema = z.string().regex(/^\d{1,3}$/);

function badRequest(message: string) {
  return Response.json(
    { error: message },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function parsePositiveId(raw: string | null, label: string): number | Response | undefined {
  if (!raw) return undefined;
  const parsed = idParam.safeParse(raw.trim());
  if (!parsed.success) return badRequest(`Invalid ${label}`);
  const value = Number(parsed.data);
  return Number.isSafeInteger(value) && value > 0 ? value : badRequest(`Invalid ${label}`);
}

export async function GET(request: Request) {
  try {
    const sp = new URL(request.url).searchParams;

    const surveyParsed = surveyKeySchema.safeParse(sp.get("surveyKey"));
    if (!surveyParsed.success) return badRequest("Invalid survey key");

    const jlNumberId = parsePositiveId(sp.get("jlNumberId"), "JL number");
    if (jlNumberId instanceof Response) return jlNumberId;
    if (jlNumberId === undefined) return badRequest("JL number is required");

    const khatianParsed = khatianNoSchema.safeParse(sp.get("khatianNo"));
    if (!khatianParsed.success) return badRequest("Khatian number is required");
    const khatianNo = khatianParsed.data;

    const mouzaId = parsePositiveId(sp.get("mouzaId"), "Mouza ID");
    if (mouzaId instanceof Response) return mouzaId;

    const divisionRaw = sp.get("divisionBbsCode")?.trim() || undefined;
    const districtRaw = sp.get("districtBbsCode")?.trim() || undefined;
    const upazilaRaw = sp.get("upazilaBbsCode")?.trim() || undefined;

    const division = divisionRaw ? bbsCodeSchema.safeParse(divisionRaw) : null;
    const district = districtRaw ? bbsCodeSchema.safeParse(districtRaw) : null;
    const upazila = upazilaRaw ? bbsCodeSchema.safeParse(upazilaRaw) : null;
    if (division && !division.success) return badRequest("Invalid division BBS code");
    if (district && !district.success) return badRequest("Invalid district BBS code");
    if (upazila && !upazila.success) return badRequest("Invalid upazila BBS code");

    const page = await providers.landRecords.listKhatians(
      {
        surveyKey: surveyParsed.data,
        jlNumberId,
        page: 1,
        pageSize: 100,
        khatianNo,
      },
      request.signal,
    );

    const matching = page.items.filter(
      (item) =>
        item.KHATIAN_NO.trim() === khatianNo &&
        item.JL_NUMBER_ID === jlNumberId &&
        (!mouzaId || !item.MOUZA_ID || item.MOUZA_ID === mouzaId),
    );

    const uniqueById = new Map(matching.map((item) => [item.ID, item]));
    const candidates = [...uniqueById.values()];

    if (!candidates.length) {
      return Response.json(
        { error: "এই JL/জরিপে নির্দিষ্ট খতিয়ানটি পাওয়া যায়নি।" },
        { status: 404, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (candidates.length > 1) {
      return Response.json(
        {
          error: "একই খতিয়ান নম্বরে একাধিক DLRMS record পাওয়া গেছে। Mouza ID দিয়ে নির্দিষ্ট করুন।",
          candidates: candidates.map((item) => ({
            id: item.ID,
            mouzaId: item.MOUZA_ID,
            khatianNo: item.KHATIAN_NO,
          })),
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    }

    const selected = candidates[0];
    const result = await getFullKhatian(
      {
        surveyKey: surveyParsed.data,
        id: selected.ID,
        jlNumberId,
        mouzaId: mouzaId || selected.MOUZA_ID || undefined,
        divisionBbsCode: division?.success ? division.data : undefined,
        districtBbsCode: district?.success ? district.data : undefined,
        upazilaBbsCode: upazila?.success ? upazila.data : undefined,
      },
      request.signal,
    );

    return ok(FullKhatianSchema.parse(result));
  } catch (error) {
    return providerError(error);
  }
}
