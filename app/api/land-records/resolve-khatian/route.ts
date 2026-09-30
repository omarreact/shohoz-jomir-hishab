import { providers } from "@/src/features/land-records/server/provider";
import { getFullKhatian } from "@/src/features/land-records/server/full-khatian-service";

const NO_STORE = { "Cache-Control": "no-store" };

function clean(value: string | null): string | undefined {
  const v = value?.trim();
  return v || undefined;
}

function positiveInt(value: string | null, fallback?: number): number | undefined {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isSafeInteger(n) && n > 0 ? n : undefined;
}

/**
 * Server-only DLRMS resolver for targeted diagnostics/research.
 * It deliberately returns normalized LandBD data only; upstream auth tokens,
 * cookies and request headers never leave the provider layer.
 */
export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const surveyKey = (clean(sp.get("surveyKey")) || "BRS").toUpperCase();
  if (!["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS"].includes(surveyKey)) {
    return Response.json({ error: "Invalid surveyKey" }, { status: 400, headers: NO_STORE });
  }

  const jlNumberId = positiveInt(sp.get("jlNumberId"));
  const khatianNo = clean(sp.get("khatianNo"));
  const mouzaId = positiveInt(sp.get("mouzaId"));
  const divisionBbsCode = clean(sp.get("divisionBbsCode"));
  const districtBbsCode = clean(sp.get("districtBbsCode"));
  const upazilaBbsCode = clean(sp.get("upazilaBbsCode"));

  if (!jlNumberId || !khatianNo) {
    return Response.json(
      { error: "jlNumberId and khatianNo are required" },
      { status: 400, headers: NO_STORE },
    );
  }

  try {
    const page = await providers.landRecords.listKhatians({
      surveyKey,
      jlNumberId,
      khatianNo,
      page: 1,
      pageSize: 100,
    });

    const exact = page.items.filter((item) => item.KHATIAN_NO.trim() === khatianNo);
    if (!exact.length) {
      return Response.json(
        { query: { surveyKey, jlNumberId, khatianNo }, resolved: false, matches: [] },
        { status: 404, headers: NO_STORE },
      );
    }

    const candidates = await Promise.all(
      exact.map(async (item) => {
        const full = await getFullKhatian({
          surveyKey: surveyKey as "CS" | "RS" | "SA" | "BS" | "DIARA" | "PETY" | "BRS" | "BDS",
          id: item.ID,
          jlNumberId,
          mouzaId: mouzaId || item.MOUZA_ID || undefined,
          divisionBbsCode,
          districtBbsCode,
          upazilaBbsCode,
        }, request.signal);

        const dagSearches = await Promise.all(
          full.dags.map(async (dag) => {
            try {
              const filtered = await providers.landRecords.listKhatians({
                surveyKey,
                jlNumberId,
                khatianNo,
                dagNumber: dag.dagNo,
                page: 1,
                pageSize: 100,
              });
              const match = filtered.items.find(
                (row) => row.ID === item.ID || row.KHATIAN_NO.trim() === khatianNo,
              );
              return {
                dagNo: dag.dagNo,
                matched: Boolean(match),
                totalLand: match?.TOTAL_LAND,
                owners: match?.OWNERS,
                guardians: match?.GUARDIANS,
                dags: match?.DAGS,
              };
            } catch (error) {
              return {
                dagNo: dag.dagNo,
                matched: false,
                error: error instanceof Error ? error.message : "Dag lookup failed",
              };
            }
          }),
        );

        return {
          id: item.ID,
          khatianNo: item.KHATIAN_NO,
          jlNumberId: item.JL_NUMBER_ID,
          mouzaId: item.MOUZA_ID,
          totalLand: full.base.TOTAL_LAND || item.TOTAL_LAND,
          owners: full.owners,
          dags: full.dags,
          halSabek: full.halSabek,
          lisf: full.lisf,
          evidence: full.evidence,
          warnings: full.warnings,
          dagSearches,
        };
      }),
    );

    return Response.json(
      {
        query: { surveyKey, jlNumberId, khatianNo, mouzaId },
        resolved: true,
        matchCount: candidates.length,
        candidates,
      },
      { headers: NO_STORE },
    );
  } catch (error) {
    return Response.json(
      {
        query: { surveyKey, jlNumberId, khatianNo, mouzaId },
        resolved: false,
        error: error instanceof Error ? error.message : "DLRMS resolution failed",
      },
      { status: 502, headers: NO_STORE },
    );
  }
}
