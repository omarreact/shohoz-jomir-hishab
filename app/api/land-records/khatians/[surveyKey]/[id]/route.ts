import { KhatianDetailsSchema, idParam, khatianSearchText } from "@/src/features/land-records/schemas";
import { reconstructKhatian } from "@/src/features/land-records/server/khatian-reconstruction";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";
import type { KhatianPage } from "@/src/features/land-records/types";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"]);

async function safeSearch(input: Parameters<typeof providers.landRecords.listKhatians>[0], signal: AbortSignal): Promise<KhatianPage | null> {
  try {
    return await providers.landRecords.listKhatians(input, signal);
  } catch (error) {
    console.warn("[land-records] khatian reconstruction lookup failed", {
      surveyKey: input.surveyKey,
      khatianNo: input.khatianNo,
      hasOwnerFilter: Boolean(input.owner),
      hasDagFilter: Boolean(input.dagNumber),
      error: error instanceof Error ? error.name : "unknown",
    });
    return null;
  }
}

export async function GET(request: Request, context: { params: Promise<{ surveyKey: string; id: string }> }) {
  try {
    const params = await context.params;
    const surveyKey = surveyKeySchema.parse(params.surveyKey);
    const id = Number(idParam.parse(params.id));
    if (!Number.isSafeInteger(id)) return Response.json({ error: "Invalid Khatian ID" }, { status: 400 });

    const url = new URL(request.url);
    const owner = khatianSearchText.parse(url.searchParams.get("owner") || undefined);
    const dagNumber = khatianSearchText.parse(url.searchParams.get("dagNumber") || undefined);
    const fallbackJlRaw = url.searchParams.get("jlNumberId");
    const fallbackJlNumberId = fallbackJlRaw ? Number(idParam.parse(fallbackJlRaw)) : undefined;
    if (fallbackJlNumberId !== undefined && !Number.isSafeInteger(fallbackJlNumberId)) {
      return Response.json({ error: "Invalid JL number" }, { status: 400 });
    }

    const base = KhatianDetailsSchema.parse(await providers.landRecords.getKhatian(surveyKey, id, request.signal));
    const jlNumberId = base.JL_NUMBER_ID || fallbackJlNumberId;
    if (!jlNumberId) return ok(base);

    const exactLookup = safeSearch({
      surveyKey,
      jlNumberId,
      page: 1,
      pageSize: 100,
      khatianNo: base.KHATIAN_NO,
    }, request.signal);

    const ownerLookup = owner
      ? safeSearch({
          surveyKey,
          jlNumberId,
          page: 1,
          pageSize: 100,
          khatianNo: base.KHATIAN_NO,
          owner,
        }, request.signal)
      : Promise.resolve(null);

    const dagLookup = dagNumber
      ? safeSearch({
          surveyKey,
          jlNumberId,
          page: 1,
          pageSize: 100,
          khatianNo: base.KHATIAN_NO,
          dagNumber,
        }, request.signal)
      : Promise.resolve(null);

    const [exactPage, ownerPage, dagPage] = await Promise.all([exactLookup, ownerLookup, dagLookup]);
    const isTarget = (row: { ID: number; KHATIAN_NO: string }) => row.ID === base.ID || row.KHATIAN_NO.trim() === base.KHATIAN_NO.trim();
    const exactRows = exactPage?.items.filter(isTarget) ?? [];
    const ownerRows = ownerPage?.items.filter(isTarget) ?? [];
    const dagRows = dagPage?.items.filter(isTarget) ?? [];

    const rebuilt = reconstructKhatian(
      base,
      [...exactRows, ...ownerRows, ...dagRows],
      {
        owner,
        dagNumber,
        ownerVerified: Boolean(owner && ownerRows.length),
        dagVerified: Boolean(dagNumber && dagRows.length),
      },
    );

    return ok(KhatianDetailsSchema.parse(rebuilt));
  } catch (error) {
    return providerError(error);
  }
}
