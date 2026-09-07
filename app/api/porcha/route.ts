import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { allowRateLimit } from "@/src/modules/security/redisRateLimit";

export const runtime = "nodejs";

const PAGE_SIZE = 20;
const MAX_QUERY_LENGTH = 120;
const MAX_PAGE = 10_000;

type PorchaRecord = Record<string, unknown>;

let porchaDataPromise: Promise<PorchaRecord[]> | null = null;

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function loadPorchaData(): Promise<PorchaRecord[]> {
  if (porchaDataPromise) return porchaDataPromise;

  const filePath = path.join(
    process.cwd(),
    "src",
    "modules",
    "porcha",
    "data",
    "porcha.json",
  );

  porchaDataPromise = fs
    .readFile(filePath, "utf8")
    .then((contents) => JSON.parse(contents) as unknown)
    .then((parsed) => {
      if (!Array.isArray(parsed)) {
        throw new Error("Porcha data is not an array");
      }
      return parsed.filter(
        (item): item is PorchaRecord => !!item && typeof item === "object",
      );
    })
    .catch((error) => {
      // Allow a later invocation to retry if the first load failed.
      porchaDataPromise = null;
      throw error;
    });

  return porchaDataPromise;
}

function parsePage(raw: string | null): number | null {
  const page = Number(raw ?? "1");
  if (!Number.isSafeInteger(page) || page < 1 || page > MAX_PAGE) return null;
  return page;
}

function matchesQuery(item: PorchaRecord, query: string): boolean {
  if (!query) return true;

  return [item.JOMIHUB, item.Column2, item.Column4].some((value) =>
    String(value ?? "").toLocaleLowerCase("bn-BD").includes(query),
  );
}

export async function GET(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
  const { searchParams } = request.nextUrl;
  const rawQuery = searchParams.get("q")?.trim() ?? "";
  const page = parsePage(searchParams.get("page"));

  if (rawQuery.length > MAX_QUERY_LENGTH) {
    return NextResponse.json(
      { error: "অনুসন্ধানের লেখা অনেক বড়।", requestId },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (page === null) {
    return NextResponse.json(
      { error: "পৃষ্ঠা নম্বর সঠিক নয়।", requestId },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const allowed = await allowRateLimit(`porcha:${clientIp(request)}`, 60, 60);
    if (!allowed) {
      return NextResponse.json(
        { error: "অনেক অনুরোধ হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।", requestId },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": "60",
          },
        },
      );
    }
  } catch (error) {
    // Rate limiting must not make the public Porcha data unavailable if the
    // optional Redis service is temporarily unreachable.
    console.warn("Porcha rate limiter unavailable", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  try {
    const data = await loadPorchaData();
    const query = rawQuery.toLocaleLowerCase("bn-BD");
    const filteredData = query
      ? data.filter((item) => matchesQuery(item, query))
      : data;

    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return NextResponse.json(
      {
        results: paginatedData,
        hasMore: endIndex < filteredData.length,
        page,
        pageSize: PAGE_SIZE,
        total: filteredData.length,
        requestId,
      },
      {
        headers: {
          // Search terms may include a person's name; keep responses out of
          // shared CDN caches while still allowing a short browser cache.
          "Cache-Control": "private, max-age=30",
          "X-Request-Id": requestId,
        },
      },
    );
  } catch (error) {
    console.error("Porcha data load failed", {
      requestId,
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return NextResponse.json(
      { error: "পর্চার তথ্য লোড করা যায়নি।", requestId },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Request-Id": requestId,
        },
      },
    );
  }
}
