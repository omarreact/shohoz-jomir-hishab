import { checkServiceAccess } from "@/src/lib/service-entitlement";
import { KhatianPageSchema, idParam, khatianSearchText, pageSize, positivePage } from "@/src/features/land-records/schemas";
import { normalizeKhatianRecord, normalizedRecordMatches } from "@/src/features/land-records/normalized-khatian";
import { providers } from "@/src/features/land-records/server/provider";
import { ok, providerError } from "@/src/features/land-records/server/http";
import type { KhatianIndex } from "@/src/features/land-records/types";
import { z } from "zod";

const surveyKeySchema = z.enum(["CS", "RS", "SA", "BS", "DIARA", "PETY", "BRS", "BDS", "MUTATION"]);
const MAX_BROWSE_PAGES = 1000;
const SEARCH_BATCH_SIZE = 100;

async function unifiedMouzaSearch(input: {
  surveyKey: string;
  jlNumberId: number;
  query: string;
  page: number;
  pageSize: number;
}, signal?: AbortSignal) {
  const byId = new Map<number, KhatianIndex>();
  let sourcePage = 1;
  let keepGoing = true;

  while (keepGoing && sourcePage <= MAX_BROWSE_PAGES) {
    const chunk = await providers.landRecords.listKhatians({
      surveyKey: input.surveyKey,
      jlNumberId: input.jlNumberId,
      page: sourcePage,
      pageSize: SEARCH_BATCH_SIZE,
    }, signal);
    for (const row of chunk.items) byId.set(row.ID, row);
    keepGoing = chunk.hasNextPage;
    if (chunk.total !== undefined && byId.size >= chunk.total) keepGoing = false;
    sourcePage += 1;
  }

  if (keepGoing) {
    throw new Error("Mouza search page limit exceeded; refusing to return a partial filtered result.");
  }

  const filtered = [...byId.values()].filter((row) =>
    normalizedRecordMatches(normalizeKhatianRecord(row), input.query),
  );
  const start = (input.page - 1) * input.pageSize;
  const items = filtered.slice(start, start + input.pageSize);
  return {
    items,
    page: input.page,
    pageSize: input.pageSize,
    total: filtered.length,
    hasNextPage: start + input.pageSize < filtered.length,
  };
}

export async function GET(request: Request) {
  const denied = await checkServiceAccess(request, "dlrms-khatian");
  if (denied) return denied;
  try {
    const params = new URL(request.url).searchParams;
    const surveyKey = surveyKeySchema.parse(params.get("surveyKey"));
    const jlNumberId = Number(idParam.parse(params.get("jlNumberId")));
    if (!Number.isSafeInteger(jlNumberId)) {
      return Response.json({ error: "Invalid JL number" }, { status: 400 });
    }

    const page = positivePage.parse(params.get("page") ?? "1");
    const size = pageSize.parse(params.get("pageSize") ?? "20");
    const query = khatianSearchText.parse(params.get("query") || undefined);
    const khatianNo = khatianSearchText.parse(params.get("khatianNo") || undefined);
    const owner = khatianSearchText.parse(params.get("owner") || undefined);
    const dagNumber = khatianSearchText.parse(params.get("dagNumber") || undefined);

    const data = query
      ? await unifiedMouzaSearch({ surveyKey, jlNumberId, query, page, pageSize: size }, request.signal)
      : await providers.landRecords.listKhatians({
          surveyKey,
          jlNumberId,
          page,
          pageSize: size,
          khatianNo,
          owner,
          dagNumber,
        }, request.signal);

    return ok(KhatianPageSchema.parse(data));
  } catch (error) {
    return providerError(error);
  }
}
