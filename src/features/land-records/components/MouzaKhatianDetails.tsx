"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, Loader2, Search } from "lucide-react";
import { FullKhatianSchema, type FullKhatian } from "../full-khatian";
import { KhatianDetailsSchema } from "../schemas";
import type { KhatianDetails, KhatianIndex } from "../types";
import KhatianDetailsView from "./KhatianDetailsView";

type Props = {
  rows: KhatianIndex[];
  surveyKey: string;
  surveyName: string;
  surveyId: number;
  jlNumberId: number;
  jlNumber: string;
  divisionName: string;
  districtName: string;
  upazilaName: string;
  mouzaName: string;
};

const normalizeDigits = (value: string) =>
  value.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));

function previewFromIndex(row: KhatianIndex, props: Props): KhatianDetails {
  return {
    ...row,
    IS_LOCKED: 0,
    DIVISION_NAME: props.divisionName,
    DISTRICT_NAME: props.districtName,
    UPAZILA_NAME: props.upazilaName,
    MOUZA_NAME: props.mouzaName,
    JL_NUMBER: props.jlNumber,
    SURVEY_ID: props.surveyId,
    SURVEY_NAME: props.surveyName,
    TOTAL_LAND: row.TOTAL_LAND ?? "",
    PUBLIC_RECORD: { LANDBD_FAST_PREVIEW: true },
  };
}

async function fetchKhatian<T>(
  url: string,
  schema: { parse(value: unknown): T },
  signal: AbortSignal,
): Promise<T> {
  const response = await fetch(url, { signal, cache: "no-store", headers: { Accept: "application/json" } });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = payload && typeof payload === "object" && "error" in payload
      ? String((payload as { error: unknown }).error)
      : "সরকারি খতিয়ানের তথ্য পাওয়া যায়নি।";
    throw new Error(
      error === "payment_required" ? "মৌজা রিপোর্ট সেবার অনুমতি/পেমেন্ট প্রয়োজন।" : error,
    );
  }
  return schema.parse(payload);
}

/**
 * Individual khatian inspection does not change the mouza-wide PDF/report
 * fingerprint. Official details and full enrichment load independently:
 * a slow optional source must never hide the selected record.
 */
export default function MouzaKhatianDetails(props: Props) {
  const { rows, surveyKey, jlNumberId } = props;
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [official, setOfficial] = useState<KhatianDetails | null>(null);
  const [full, setFull] = useState<FullKhatian | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [fullLoading, setFullLoading] = useState(false);
  const [baseError, setBaseError] = useState<string | null>(null);
  const [fullError, setFullError] = useState<string | null>(null);

  const selectedRow = useMemo(
    () => rows.find((item) => item.ID === selectedId) ?? null,
    [rows, selectedId],
  );

  const matches = useMemo(() => {
    const term = normalizeDigits(query.trim());
    if (!term) return [];
    return rows.filter((item) =>
      normalizeDigits(item.KHATIAN_NO).includes(term),
    ).slice(0, 25);
  }, [rows, query]);

  useEffect(() => {
    if (!selectedRow || !surveyKey || !jlNumberId) return;
    const abort = new AbortController();
    let active = true;
    let fullResolved = false;
    setOfficial(previewFromIndex(selectedRow, props));
    setFull(null);
    setBaseError(null);
    setFullError(null);
    setBaseLoading(true);
    setFullLoading(true);

    const endpoint = "/api/land-records/mouza-porcha-report/khatian/" +
      encodeURIComponent(surveyKey) + "/" + selectedRow.ID +
      "?jlNumberId=" + encodeURIComponent(String(jlNumberId));

    void fetchKhatian(endpoint + "&detail=base", KhatianDetailsSchema, abort.signal)
      .then((base) => {
        if (active && !fullResolved) {
          setOfficial((previous) => ({
            ...previewFromIndex(selectedRow, props),
            ...base,
            DIVISION_NAME: base.DIVISION_NAME || previous?.DIVISION_NAME || props.divisionName,
            DISTRICT_NAME: base.DISTRICT_NAME || previous?.DISTRICT_NAME || props.districtName,
            UPAZILA_NAME: base.UPAZILA_NAME || previous?.UPAZILA_NAME || props.upazilaName,
            MOUZA_NAME: base.MOUZA_NAME || previous?.MOUZA_NAME || props.mouzaName,
            JL_NUMBER: base.JL_NUMBER || previous?.JL_NUMBER || props.jlNumber,
          }));
        }
      })
      .catch((error: unknown) => {
        if (active && !abort.signal.aborted) {
          setBaseError(error instanceof Error ? error.message : "সরকারি বিবরণ লোড করা যায়নি।");
        }
      })
      .finally(() => { if (active) setBaseLoading(false); });

    void fetchKhatian(endpoint + "&detail=full", FullKhatianSchema, abort.signal)
      .then((record) => {
        if (!active) return;
        fullResolved = true;
        setFull(record);
        setOfficial({
          ...previewFromIndex(selectedRow, props),
          ...record.base,
          DIVISION_NAME: record.base.DIVISION_NAME || props.divisionName,
          DISTRICT_NAME: record.base.DISTRICT_NAME || props.districtName,
          UPAZILA_NAME: record.base.UPAZILA_NAME || props.upazilaName,
          MOUZA_NAME: record.base.MOUZA_NAME || props.mouzaName,
          JL_NUMBER: record.base.JL_NUMBER || props.jlNumber,
        });
      })
      .catch((error: unknown) => {
        if (active && !abort.signal.aborted) {
          setFullError(error instanceof Error ? error.message : "পূর্ণ খতিয়ান লোড করা যায়নি।");
        }
      })
      .finally(() => { if (active) setFullLoading(false); });

    return () => {
      active = false;
      abort.abort();
    };
  }, [selectedRow, surveyKey, jlNumberId, props.surveyId, props.surveyName, props.divisionName, props.districtName, props.upazilaName, props.mouzaName, props.jlNumber]);

  return (
    <section className="mt-6 space-y-4 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-3 print:hidden sm:p-5" aria-label="নির্দিষ্ট মৌজা খতিয়ানের বিস্তারিত">
      <div>
        <h2 className="text-lg font-black text-[var(--foreground)]">মৌজার নির্দিষ্ট খতিয়ানের বিস্তারিত</h2>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          খতিয়ান নম্বর লিখে ফলাফল থেকে বেছে নিন। পূর্ণ মালিক, অভিভাবক ও দাগের উৎসে পাওয়া বিবরণ দেখুন; মূল মৌজা রিপোর্ট অপরিবর্তিত থাকবে।
        </p>
      </div>
      <label className="block text-sm font-semibold text-[var(--foreground)]" htmlFor="mouza-khatian-search">
        খতিয়ান নম্বর অনুসন্ধান
      </label>
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-3 text-[var(--muted-foreground)]" size={17} />
        <input
          id="mouza-khatian-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="যেমন: ৩৪৯"
          className="min-h-11 w-full rounded-lg border border-[var(--border-color)] bg-white py-2 pl-10 pr-3 text-sm text-[var(--foreground)]"
        />
      </div>

      {query.trim() ? (
        <div className="flex flex-wrap gap-2" role="group" aria-label="খতিয়ান বাছাই">
          {matches.length ? matches.map((row) => (
            <button
              key={row.ID}
              type="button"
              onClick={() => setSelectedId(row.ID)}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm font-semibold text-[var(--primary)]"
            >
              <Eye size={15} /> খতিয়ান {row.KHATIAN_NO}
            </button>
          )) : <p className="text-sm text-[var(--muted-foreground)]">এই মৌজার রিপোর্টে খতিয়ানটি পাওয়া যায়নি।</p>}
        </div>
      ) : null}

      {selectedRow && official ? (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-base font-bold">খতিয়ান নং {selectedRow.KHATIAN_NO}</h3>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm"
            >
              <ArrowLeft size={14} /> বন্ধ করুন
            </button>
          </div>
          {baseLoading || fullLoading ? (
            <p className="flex items-center gap-2 text-sm text-emerald-800" role="status">
              <Loader2 size={16} className="animate-spin" />
              {baseLoading ? "সরকারি খতিয়ান যাচাই হচ্ছে…" : "সম্পূর্ণ মালিক/দাগ তথ্য যাচাই হচ্ছে…"}
            </p>
          ) : null}
          {baseError ? (
            <p className="text-sm text-amber-800" role="status">
              সরকারি বিস্তারিত যাচাই করা যায়নি: {baseError}। নিচে সার্চ তালিকার প্রাথমিক তথ্য রয়েছে।
            </p>
          ) : null}
          {fullError ? (
            <p className="text-sm text-amber-800" role="status">
              পূর্ণ রেকর্ড এখনো পাওয়া যায়নি: {fullError}। অসম্পূর্ণ PDF ডাউনলোড বন্ধ রাখা হয়েছে।
            </p>
          ) : null}
          <KhatianDetailsView
            khatian={official}
            fullKhatian={full ?? undefined}
            fullKhatianLoading={fullLoading}
            fullKhatianFailed={Boolean(fullError)}
            surveyKey={surveyKey}
          />
        </div>
      ) : null}
    </section>
  );
}
