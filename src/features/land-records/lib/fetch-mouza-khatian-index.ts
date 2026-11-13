"use client";

import type { KhatianIndex, KhatianPage } from "../types";

const PAGE_SIZE = 100;
const PAGE_CONCURRENCY = 4;
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function retryDelay(attempt: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  await new Promise((resolve) => setTimeout(resolve, 180 * attempt));
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
}

async function fetchJsonWithRetry<T>(
  input: string,
  init: RequestInit,
  attempts = 3,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(input, init);
      const payload = (await response.json().catch(() => ({}))) as { error?: string } & T;
      if (!response.ok) {
        if (RETRYABLE_STATUS.has(response.status) && attempt < attempts) {
          await retryDelay(attempt, init.signal ?? undefined);
          continue;
        }
        throw new Error(payload.error || "মৌজার খতিয়ান তথ্য লোড করা যায়নি।");
      }
      return payload;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      lastError = error;
      if (attempt >= attempts) break;
      await retryDelay(attempt, init.signal ?? undefined);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("মৌজার খতিয়ান তথ্য লোড করা যায়নি।");
}

export type FetchMouzaKhatianIndexInput = {
  surveyKey: string;
  jlNumberId: number;
  endpoint?: "/api/land-records/mouza-porcha-report" | "/api/land-records/mouza-dag-report";
  signal?: AbortSignal;
  onProgress?: (loaded: number, expected: number | null) => void;
};

export type FetchMouzaKhatianIndexResult = {
  rows: KhatianIndex[];
  expected: number | null;
};

export async function fetchMouzaKhatianIndex({
  surveyKey,
  jlNumberId,
  endpoint = "/api/land-records/mouza-porcha-report",
  signal,
  onProgress,
}: FetchMouzaKhatianIndexInput): Promise<FetchMouzaKhatianIndexResult> {
  const byId = new Map<number, KhatianIndex>();
  let expected: number | null = null;

  const append = (data: KhatianPage) => {
    for (const item of data.items) {
      if (!byId.has(item.ID)) byId.set(item.ID, item);
    }
    if (typeof data.total === "number" && Number.isFinite(data.total)) expected = data.total;
    onProgress?.(byId.size, expected);
  };

  const loadPage = async (page: number): Promise<KhatianPage> => {
    const params = new URLSearchParams({
      surveyKey,
      jlNumberId: String(jlNumberId),
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    return fetchJsonWithRetry<KhatianPage>(
      `${endpoint}?${params.toString()}`,
      { signal, cache: "no-store" },
    );
  };

  const first = await loadPage(1);
  append(first);

  if (first.total != null && first.total >= 0) {
    const totalPages = Math.max(1, Math.ceil(first.total / PAGE_SIZE));
    if (totalPages > 1000) throw new Error("মৌজার খতিয়ান পেজ সীমা অতিক্রম করেছে।");
    const remaining = Array.from({ length: totalPages - 1 }, (_, index) => index + 2);
    for (const group of chunk(remaining, PAGE_CONCURRENCY)) {
      const pages = await Promise.all(group.map(loadPage));
      for (const page of pages) append(page);
    }
  } else {
    let page = 2;
    let hasNext = first.hasNextPage;
    while (hasNext) {
      const data = await loadPage(page);
      append(data);
      hasNext = data.hasNextPage;
      page += 1;
      if (page > 1000) throw new Error("মৌজার খতিয়ান পেজ সীমা অতিক্রম করেছে।");
    }
  }

  return { rows: [...byId.values()], expected };
}
