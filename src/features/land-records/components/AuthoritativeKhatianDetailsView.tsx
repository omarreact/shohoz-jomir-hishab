"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import LandBdPrintRibbon, { LANDBD_TAGLINES } from "@/src/shared/components/LandBdPrintRibbon";
import { acreFromDlrmsValue, formatAcre } from "@/src/modules/land/jsonArea";
import type { FullKhatian, FullKhatianDag, FullKhatianOwner } from "../full-khatian";
import type { KhatianDetails } from "../types";
import { buildKhatianDisplayModel, type ParsedDagRow } from "../lib/khatian-display";

type Props = {
  khatian: KhatianDetails;
  fullKhatian?: FullKhatian;
  surveyKey?: string;
  captureRef?: RefObject<HTMLDivElement | null>;
  pageOrientation: "portrait" | "landscape";
};

type ExtraRow = { label: string; value: string };

type AuthoritativeDagRow = ParsedDagRow & {
  totalArea?: string;
  khatianArea?: string;
  remarks?: string;
};

type DisplayOwner = {
  name: string;
  share?: string;
  fatherOrHusband?: string;
  address?: string;
};

type ColumnKey =
  | "owners"
  | "guardian"
  | "share"
  | "tax"
  | "dagNo"
  | "landClass"
  | "totalArea"
  | "khatianShare"
  | "proportionalArea"
  | "remarks";

type VisibleColumn = {
  key: ColumnKey;
  officialNo: string;
  label: string;
  scope: "record" | "dag";
};

type LandBdVerification = {
  reportId: string;
  verificationUrl: string;
};

function sourcePriority(source: FullKhatianDag["source"]): number {
  if (source === "LISF_AUTHORIZED") return 3;
  if (source === "DLRMS_PUBLIC") return 2;
  if (source === "DLRMS_TRACKING" || source === "DLRMS_HAL_SABEK") return 1;
  return 0;
}

function detailScore(dag: FullKhatianDag): number {
  return [
    dag.landType,
    dag.agriculturalType,
    dag.totalAreaRaw,
    dag.khatianAreaRaw,
    dag.remarks,
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== "").length;
}

function authoritativeDagMap(fullKhatian: FullKhatian | undefined): Map<string, FullKhatianDag> {
  const byDag = new Map<string, FullKhatianDag>();
  for (const dag of fullKhatian?.dags ?? []) {
    if (dag.source === "LISF_MOCK") continue;
    const key = dag.dagNo.trim();
    if (!key) continue;
    const current = byDag.get(key);
    if (!current) {
      byDag.set(key, dag);
      continue;
    }
    const nextRank = sourcePriority(dag.source) * 100 + detailScore(dag);
    const currentRank = sourcePriority(current.source) * 100 + detailScore(current);
    if (nextRank > currentRank) byDag.set(key, dag);
  }
  return byDag;
}

function acreLabel(raw: string | undefined): string | undefined {
  if (!raw?.trim()) return undefined;
  const acre = acreFromDlrmsValue(raw, "acre");
  return acre == null ? undefined : formatAcre(acre);
}

function normalizeOwnerName(value: string): string {
  return value.replace(/[\s.,،]+/gu, "").toLocaleLowerCase("bn-BD");
}

function mergeOwnerDetails(
  owners: Array<{ name: string; share?: string }>,
  fullKhatian: FullKhatian | undefined,
): DisplayOwner[] {
  const structured = (fullKhatian?.owners ?? []).filter((owner) => owner.source !== "LISF_MOCK");

  const findStructured = (name: string): FullKhatianOwner | undefined => {
    const key = normalizeOwnerName(name);
    return (
      structured.find((candidate) => normalizeOwnerName(candidate.name) === key) ??
      structured.find((candidate) => {
        const candidateKey = normalizeOwnerName(candidate.name);
        return candidateKey.includes(key) || key.includes(candidateKey);
      })
    );
  };

  if (!owners.length && structured.length) {
    return structured.map((owner) => ({
      name: owner.name,
      share: owner.shareRaw,
      fatherOrHusband: owner.fatherOrHusband,
      address: owner.address,
    }));
  }

  return owners.map((owner) => {
    const detail = findStructured(owner.name);
    return {
      name: owner.name,
      share: owner.share || detail?.shareRaw,
      fatherOrHusband: detail?.fatherOrHusband,
      address: detail?.address,
    };
  });
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (value === undefined || value === null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function hasValue(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  const text = String(value).trim();
  return Boolean(text && text !== "—" && text !== "-" && text.toLowerCase() !== "null" && text.toLowerCase() !== "undefined");
}

function toBanglaDigits(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  return String(value).replace(/[0-9]/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

function ownerShareText(owners: DisplayOwner[]): string {
  const shares = owners.map((owner) => owner.share?.trim()).filter(Boolean);
  return shares.length ? shares.map((value) => toBanglaDigits(value)).join("\n") : "";
}

export default function AuthoritativeKhatianDetailsView({
  khatian,
  fullKhatian,
  surveyKey,
  captureRef,
  pageOrientation,
}: Props) {
  const model = useMemo(() => buildKhatianDisplayModel(khatian, surveyKey), [khatian, surveyKey]);
  const fullDagMap = useMemo(() => authoritativeDagMap(fullKhatian), [fullKhatian]);
  const owners = useMemo(() => mergeOwnerDetails(model.owners, fullKhatian), [model.owners, fullKhatian]);
  const { isLoggedIn } = useAuth();
  const [techOpen, setTechOpen] = useState(false);
  const [landBdVerification, setLandBdVerification] = useState<LandBdVerification | null>(null);

  const dags = useMemo<AuthoritativeDagRow[]>(() => model.dags.map((dag) => {
    const official = fullDagMap.get(dag.dagNo.trim());
    return {
      ...dag,
      landClass: official?.landType || official?.agriculturalType || dag.landClass,
      totalArea: acreLabel(official?.totalAreaRaw) || dag.totalArea,
      khatianArea: acreLabel(official?.khatianAreaRaw) || dag.area || dag.shareArea,
      remarks: official?.remarks,
    };
  }), [model.dags, fullDagMap]);

  const tableDags: AuthoritativeDagRow[] = dags.length ? dags : [{ dagNo: "" }];

  const totalLandDisplay = model.totalLand
    ? /একর|acre/i.test(model.totalLand)
      ? model.totalLand
      : `${model.totalLand} একর`
    : "";

  const previousRaw = model.publicRecord["আগে_খতিয়ান"] ?? model.publicRecord.PREVIOUS_KHATIAN;
  const lineageFrom = previousRaw != null ? String(previousRaw).trim() : "";
  const totalTax = firstText(
    fullKhatian?.lisf.taxAmountRaw,
    model.publicRecord.LAND_DEVELOPMENT_TAX,
    model.publicRecord.RAJASWA,
    model.publicRecord.REVENUE,
    model.publicRecord.KHAJNA,
    model.publicRecord.RENT,
  );

  const extraRows: ExtraRow[] = [];
  const addExtra = (label: string, value: unknown) => {
    if (!hasValue(value)) return;
    const text = String(value).trim();
    if (!extraRows.some((row) => row.label === label && row.value === text)) {
      extraRows.push({ label, value: text });
    }
  };

  addExtra("আগে / সাবেক খতিয়ান", lineageFrom);
  addExtra("রাজস্ব", model.publicRecord.RAJASWA ?? model.publicRecord.REVENUE);
  addExtra("খাজনা", model.publicRecord.KHAJNA ?? model.publicRecord.RENT);
  addExtra("সেস", model.publicRecord.CESS);

  const officialVerificationId = firstText(fullKhatian?.tracking?.displayCode);
  const guardianText = model.guardians.filter(hasValue).join("\n");
  const shares = ownerShareText(owners);

  const visibleColumns = useMemo<VisibleColumn[]>(() => {
    const candidates: Array<VisibleColumn & { visible: boolean }> = [
      {
        key: "owners",
        officialNo: "১",
        label: "মালিক, অকৃষি প্রজা বা ইজারাদারের নাম ও ঠিকানা",
        scope: "record",
        visible: owners.some((owner) => hasValue(owner.name) || hasValue(owner.fatherOrHusband) || hasValue(owner.address)),
      },
      {
        key: "guardian",
        officialNo: "১(ক)",
        label: "পিতা / স্বামী / অভিভাবক তালিকা",
        scope: "record",
        visible: Boolean(guardianText),
      },
      {
        key: "share",
        officialNo: "২",
        label: "অংশ",
        scope: "record",
        visible: owners.some((owner) => hasValue(owner.share)),
      },
      {
        key: "tax",
        officialNo: "৩",
        label: "মোট ভূমি উন্নয়ন কর",
        scope: "record",
        visible: hasValue(totalTax),
      },
      {
        key: "dagNo",
        officialNo: "৪",
        label: model.kind === "MUTATION" ? "দাগ/প্লট নং" : "দাগ নং",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.dagNo)),
      },
      {
        key: "landClass",
        officialNo: "৫",
        label: "জমির রেকর্ডীয় শ্রেণী",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.landClass)),
      },
      {
        key: "totalArea",
        officialNo: "৬",
        label: "দাগের মোট জমির পরিমাণ",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.totalArea)),
      },
      {
        key: "khatianShare",
        officialNo: "৭",
        label: "দাগের মধ্যে অত্র খতিয়ানের অংশ",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.khatianShare)),
      },
      {
        key: "proportionalArea",
        officialNo: "৮",
        label: "অংশানুযায়ী জমির পরিমাণ",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.khatianArea)),
      },
      {
        key: "remarks",
        officialNo: "৯",
        label: "দখল/স্বত্ব বিষয়ক বা অন্যান্য বিষয়ে মন্তব্য",
        scope: "dag",
        visible: dags.some((dag) => hasValue(dag.remarks)),
      },
    ];

    return candidates
      .filter((column) => column.visible)
      .map(({ key, officialNo, label, scope }) => ({ key, officialNo, label, scope }));
  }, [owners, guardianText, totalTax, dags, model.kind]);

  const verificationPayload = useMemo(() => ({
    recordId: khatian.ID,
    khatianEntryId: khatian.KHATIAN_ENTRY_ID ?? null,
    khatianNo: khatian.KHATIAN_NO || "",
    survey: model.surveyLabel || surveyKey || "",
    district: khatian.DISTRICT_NAME || "",
    upazila: khatian.UPAZILA_NAME || "",
    mouza: khatian.MOUZA_NAME || "",
    jlNumber: khatian.JL_NUMBER || "",
    owners: owners.map((owner) => owner.name).filter(hasValue),
    dags: dags.map((dag) => dag.dagNo).filter(hasValue),
    totalLand: totalLandDisplay,
  }), [
    khatian.ID,
    khatian.KHATIAN_ENTRY_ID,
    khatian.KHATIAN_NO,
    khatian.DISTRICT_NAME,
    khatian.UPAZILA_NAME,
    khatian.MOUZA_NAME,
    khatian.JL_NUMBER,
    model.surveyLabel,
    surveyKey,
    owners,
    dags,
    totalLandDisplay,
  ]);

  useEffect(() => {
    let active = true;
    setLandBdVerification(null);

    void (async () => {
      try {
        const response = await fetch("/api/land-records/khatian/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(verificationPayload),
          cache: "no-store",
        });
        const data = await response.json().catch(() => ({})) as {
          reportId?: string;
          verificationUrl?: string;
        };
        if (!response.ok || !data.reportId || !data.verificationUrl) return;
        if (active) {
          setLandBdVerification({
            reportId: data.reportId,
            verificationUrl: data.verificationUrl,
          });
        }
      } catch (error) {
        console.warn("[dlrms-khatian] LandBD verification registration unavailable", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [verificationPayload]);

  const tableMinWidth =
    visibleColumns.length >= 7
      ? "1120px"
      : visibleColumns.length >= 5
        ? "900px"
        : visibleColumns.length >= 3
          ? "680px"
          : "100%";

  const renderRecordCell = (key: ColumnKey) => {
    if (key === "owners") {
      return owners.length ? (
        <div className="space-y-2">
          {owners.map((owner, ownerIndex) => (
            <div
              key={`${owner.name}-${ownerIndex}`}
              className={ownerIndex ? "border-t border-dotted border-slate-400 pt-2" : ""}
            >
              <p className="font-medium">{owner.name}</p>
              {hasValue(owner.fatherOrHusband) ? <p>পিতা/স্বামী- {owner.fatherOrHusband}</p> : null}
              {hasValue(owner.address) ? <p>সাং- {owner.address}</p> : null}
            </div>
          ))}
        </div>
      ) : null;
    }

    if (key === "guardian") {
      return guardianText ? <div className="whitespace-pre-line leading-6">{guardianText}</div> : null;
    }

    if (key === "share") {
      return <div className="whitespace-pre-line text-center">{shares}</div>;
    }

    if (key === "tax") {
      return <div className="text-center">{toBanglaDigits(totalTax)}</div>;
    }

    return null;
  };

  const renderDagCell = (key: ColumnKey, dag: AuthoritativeDagRow) => {
    if (key === "dagNo") return hasValue(dag.dagNo) ? toBanglaDigits(dag.dagNo) : null;
    if (key === "landClass") return hasValue(dag.landClass) ? dag.landClass : null;
    if (key === "totalArea") return hasValue(dag.totalArea) ? toBanglaDigits(dag.totalArea) : null;
    if (key === "khatianShare") return hasValue(dag.khatianShare) ? toBanglaDigits(dag.khatianShare) : null;
    if (key === "proportionalArea") return hasValue(dag.khatianArea) ? toBanglaDigits(dag.khatianArea) : null;
    if (key === "remarks") return hasValue(dag.remarks) ? dag.remarks : null;
    return null;
  };

  return (
    <div ref={captureRef ?? undefined} className="w-full min-w-0 max-w-full bg-white text-slate-950">
      <style>{`
        @import url("https://fonts.maateen.me/kalpurush/font.css");

        .dlrms-landbd-record,
        .dlrms-landbd-record * {
          font-family: "Kalpurush", "Hind Siliguri", "Nirmala UI", sans-serif;
          box-sizing: border-box;
        }

        .dlrms-landbd-record {
          --landbd-green: #0b5d3b;
          --landbd-red: #d71920;
          --landbd-magenta: #b3237b;
          --landbd-ink: #101814;
          --landbd-line: #1c2822;
          --landbd-soft: #eaf4ef;
          color: var(--landbd-ink);
        }

        .dlrms-landbd-record .record-accent {
          position: absolute;
          inset: 0 0 auto;
          z-index: 4;
          display: grid;
          grid-template-columns: 55% 27% 18%;
          height: 4px;
        }

        .dlrms-landbd-record .record-accent span:nth-child(1) { background: var(--landbd-green); }
        .dlrms-landbd-record .record-accent span:nth-child(2) { background: var(--landbd-red); }
        .dlrms-landbd-record .record-accent span:nth-child(3) { background: var(--landbd-magenta); }

        .dlrms-landbd-record .record-brand-logo {
          display: block;
          width: 132px;
          max-width: 100%;
          height: auto;
          margin-bottom: 5px;
        }

        .dlrms-landbd-record .record-watermark {
          position: absolute;
          z-index: 0;
          top: 52%;
          left: 50%;
          display: flex;
          transform: translate(-50%, -50%) rotate(-24deg);
          flex-direction: column;
          align-items: center;
          color: rgba(11, 93, 59, 0.05);
          text-align: center;
          white-space: nowrap;
          pointer-events: none;
          user-select: none;
        }

        .dlrms-landbd-record .record-watermark img {
          width: 320px;
          max-width: 55vw;
          height: auto;
          opacity: .075;
          filter: grayscale(1);
        }

        .dlrms-landbd-record .record-content {
          position: relative;
          z-index: 1;
        }

        .dlrms-landbd-record .record-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
          border: 1.2px solid var(--landbd-line);
          background: rgba(255,255,255,.94);
          font-size: 17px;
          line-height: 1.42;
        }

        .dlrms-landbd-record .record-table th,
        .dlrms-landbd-record .record-table td {
          border: 1px solid var(--landbd-line) !important;
        }

        .dlrms-landbd-record .record-table th {
          padding: 10px 9px;
          background: #f6faf8;
          color: var(--landbd-ink);
          font-weight: 500;
          text-align: center;
          vertical-align: middle;
        }

        .dlrms-landbd-record .record-table .official-column-numbers th {
          padding: 5px 7px;
          background: #edf4f0;
          color: #263b30;
          font-size: 17px;
          font-weight: 500;
        }

        .dlrms-landbd-record .record-table td {
          padding: 10px 11px;
          vertical-align: top;
          background: rgba(255,255,255,.92);
        }

        .dlrms-landbd-record .record-table tbody tr:hover td {
          background: rgba(234,244,239,.36);
        }

        .dlrms-landbd-record .qr-card {
          display: flex;
          width: 88px;
          flex: 0 0 88px;
          flex-direction: column;
          align-items: center;
          padding: 5px;
          border: 1px solid #9eb5aa;
          border-radius: 7px;
          background: #fff;
          color: var(--landbd-green);
          text-align: center;
          text-decoration: none;
        }

        .dlrms-landbd-record .qr-card img {
          display: block;
          width: 70px;
          height: 70px;
          object-fit: contain;
        }

        .dlrms-landbd-record .qr-card span {
          margin-top: 3px;
          font-family: Arial, sans-serif !important;
          font-size: 9px;
          font-weight: 700;
          line-height: 1.15;
        }

        @page dlrmsPortrait {
          size: A4 portrait;
          margin: 0;
        }

        @page dlrmsLandscape {
          size: A4 landscape;
          margin: 0;
        }

        @media print {
          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #fff !important;
          }

          .dlrms-landbd-record {
            min-width: 0 !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 7mm 7mm 14mm !important;
            border: 0 !important;
            box-shadow: none !important;
          }

          .dlrms-landbd-record.record-page-portrait {
            page: dlrmsPortrait;
            width: 210mm !important;
          }

          .dlrms-landbd-record.record-page-landscape {
            page: dlrmsLandscape;
            width: 297mm !important;
          }

          .dlrms-full-khatian-supplement.record-page-portrait {
            page: dlrmsPortrait;
            width: 210mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 7mm 7mm 10mm !important;
          }

          .dlrms-full-khatian-supplement.record-page-landscape {
            page: dlrmsLandscape;
            width: 297mm !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 7mm 7mm 10mm !important;
          }

          .dlrms-landbd-record .record-table-scroll {
            overflow: visible !important;
          }

          .dlrms-landbd-record .record-table {
            width: 100% !important;
            min-width: 0 !important;
            font-size: 10.7pt !important;
            line-height: 1.28 !important;
          }

          .dlrms-landbd-record .record-table thead {
            display: table-header-group;
          }

          .dlrms-landbd-record .record-table tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .dlrms-landbd-record .record-table th {
            padding: 1.5mm 1.2mm !important;
          }

          .dlrms-landbd-record .record-table td {
            padding: 1.35mm 1.25mm !important;
          }

          .dlrms-landbd-record .record-brand-logo {
            width: 46mm !important;
            margin-bottom: 1.5mm !important;
          }

          .dlrms-landbd-record .qr-card {
            width: 29mm !important;
            flex-basis: 29mm !important;
            padding: 1mm !important;
          }

          .dlrms-landbd-record .qr-card img {
            width: 25mm !important;
            height: 25mm !important;
          }

          .dlrms-landbd-record .qr-card span {
            font-size: 7pt !important;
          }

          .dlrms-landbd-record .record-watermark {
            display: none !important;
          }

          .dlrms-landbd-record .record-local-ribbon {
            display: none !important;
          }

        }
      `}</style>

      <div className="w-full overflow-x-auto bg-slate-50/40 px-0 py-2 sm:px-1">
        <article
          className={`dlrms-landbd-record record-page-${pageOrientation} relative mx-auto overflow-hidden border border-slate-200 bg-white px-7 py-7 shadow-[0_12px_38px_rgba(15,45,30,0.08)] print:min-w-0 print:max-w-none ${
            pageOrientation === "landscape"
              ? "min-w-[1000px] max-w-[1320px]"
              : "min-w-[760px] max-w-[900px]"
          }`}
          data-page-orientation={pageOrientation}
        >
          <div className="record-accent" aria-hidden="true"><span /><span /><span /></div>
          <div className="record-watermark" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-bangla.svg" alt="" />
          </div>

          <div className="record-content">
            <header className="mb-5">
              <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-5">
                <div className="pt-1 text-[14px] leading-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="record-brand-logo" src="/brand/landbd-logo-horizontal.svg" alt="LandBD" />
                  <p className="font-semibold">সরকারি ডিএলআরএমএস ভূমি রেকর্ড</p>
                  <p>{model.badgeBn}{model.surveyLabel ? ` · ${model.surveyLabel}` : ""}</p>
                  {officialVerificationId ? (
                    <p className="mt-1 text-[12px] text-slate-500">DLRMS যাচাইকরণ আইডি: {officialVerificationId}</p>
                  ) : null}
                </div>

                <div className="min-w-[180px] text-center">
                  <h2 className="text-[27px] font-medium leading-none text-slate-950">
                    খতিয়ান নং {toBanglaDigits(khatian.KHATIAN_NO || "—")}
                  </h2>
                </div>

                <div className="flex items-start justify-end gap-3">
                  <div className="pt-1 text-right text-[12px] leading-5 text-slate-700">
                    <p>রেকর্ড আইডি: {toBanglaDigits(khatian.ID)}</p>
                    {khatian.KHATIAN_ENTRY_ID != null ? (
                      <p>এন্ট্রি আইডি: {toBanglaDigits(khatian.KHATIAN_ENTRY_ID)}</p>
                    ) : null}
                    {landBdVerification ? (
                      <p className="mt-1 max-w-[200px] break-all font-sans text-[9px] text-slate-500">
                        {landBdVerification.reportId}
                      </p>
                    ) : null}
                  </div>

                  <a
                    className="qr-card"
                    href={landBdVerification?.verificationUrl || "/dlrms-khatian"}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        landBdVerification
                          ? `/api/reports/mouza-porcha/qr?id=${encodeURIComponent(landBdVerification.reportId)}`
                          : "/api/reports/mouza-porcha/qr?target=dlrms-khatian"
                      }
                      alt={landBdVerification ? "LandBD verification QR" : "LandBD khatian QR"}
                    />
                    <span>{landBdVerification ? "Verify via LandBD" : "Open in LandBD"}</span>
                  </a>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-4 gap-x-8 text-center text-[15px]">
                <p>জেলা: <strong className="font-medium">{khatian.DISTRICT_NAME || "—"}</strong></p>
                <p>উপজেলা / সার্কেল: <strong className="font-medium">{khatian.UPAZILA_NAME || "—"}</strong></p>
                <p>মৌজা: <strong className="font-medium">{khatian.MOUZA_NAME || "—"}</strong></p>
                <p>জে.এল নং: <strong className="font-medium">{toBanglaDigits(khatian.JL_NUMBER || "—")}</strong></p>
              </div>
            </header>

            {visibleColumns.length ? (
              <div className="record-table-scroll w-full overflow-x-auto">
                <table className="record-table" style={{ minWidth: tableMinWidth }}>
                  <thead>
                    <tr>
                      {visibleColumns.map((column) => (
                        <th key={column.key}>{column.label}</th>
                      ))}
                    </tr>
                    <tr className="official-column-numbers">
                      {visibleColumns.map((column) => (
                        <th key={column.key}>{column.officialNo}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {tableDags.map((dag, rowIndex) => (
                      <tr key={dag.dagNo || `empty-${rowIndex}`} className="align-top print:break-inside-avoid">
                        {visibleColumns.map((column) => {
                          if (column.scope === "record") {
                            if (rowIndex !== 0) return null;
                            return (
                              <td
                                key={column.key}
                                rowSpan={tableDags.length}
                                className={column.key === "share" || column.key === "tax" ? "text-center" : ""}
                              >
                                {renderRecordCell(column.key)}
                              </td>
                            );
                          }

                          return (
                            <td
                              key={column.key}
                              className={column.key === "remarks" ? "" : "text-center"}
                            >
                              {renderDagCell(column.key, dag)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {hasValue(totalLandDisplay) ? (
                      <tr>
                        <td colSpan={visibleColumns.length} style={{ backgroundColor: "#f5f8f6" }}>
                          <div className="flex items-center justify-end gap-8">
                            <span className="font-medium">মোট জমি</span>
                            <strong className="min-w-[150px] text-center font-semibold">{toBanglaDigits(totalLandDisplay)}</strong>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
                টেবিলে দেখানোর মতো উৎস তথ্য পাওয়া যায়নি।
              </div>
            )}

            {extraRows.length ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full border-collapse border border-slate-800 text-[17px] leading-[1.42]">
                  <tbody>
                    {extraRows.map((row) => (
                      <tr key={`${row.label}-${row.value}`}>
                        <td className="w-[22%] border border-slate-800 bg-slate-50 px-3 py-2 font-medium">{row.label}</td>
                        <td className="border border-slate-800 px-3 py-2">{toBanglaDigits(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            <section className="mt-7 text-[13px] leading-6 text-slate-800">
              <p className="font-semibold">বিশেষ দ্রষ্টব্য:</p>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5">
                <li>এই প্রদর্শন সরকারি ডিএলআরএমএস উৎসে পাওয়া রেকর্ড তথ্যের ভিত্তিতে তৈরি।</li>
                <li>এটি সরকার কর্তৃক জারি করা সার্টিফাইড/আইনগত খতিয়ান কপি নয়।</li>
                <li>উৎসে অনুপস্থিত মালিক, দাগ, শ্রেণী বা জমির পরিমাণ অনুমান করে পূরণ করা হয়নি।</li>
                <li>সরকারি যাচাই ও কিউআর কপির জন্য ডিএলআরএমএস / ePorcha ব্যবহার করুন।</li>
              </ol>
            </section>

            <footer className="mt-5 border-t border-slate-300 pt-2 text-[10px] leading-4 text-slate-500">
              <div className="flex items-end justify-between gap-5">
                <span>LandBD · Digital Land Record Viewer</span>
                <span className="text-right">
                  রেকর্ড আইডি: {toBanglaDigits(khatian.ID)}
                  {khatian.KHATIAN_ENTRY_ID != null ? ` · এন্ট্রি আইডি: ${toBanglaDigits(khatian.KHATIAN_ENTRY_ID)}` : ""}
                  {khatian.JL_NUMBER ? ` · জে.এল নং: ${toBanglaDigits(khatian.JL_NUMBER)}` : ""}
                </span>
              </div>
              <LandBdPrintRibbon className="record-local-ribbon mt-2 rounded-[3px]" />
            </footer>
          </div>
        </article>
      </div>

      {isLoggedIn ? (
        <div className="dlrms-landbd-record mt-3 border border-dashed border-slate-400 bg-white print:hidden" data-exclude-export="1">
          <button
            type="button"
            onClick={() => setTechOpen((value) => !value)}
            className="flex w-full items-center justify-between px-4 py-3 text-left text-sm"
          >
            প্রযুক্তিগত তথ্য
            {techOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {techOpen ? (
            <div className="space-y-1 border-t border-slate-300 px-4 py-3 text-xs leading-6">
              <p>রেকর্ড ID: {khatian.ID}</p>
              {khatian.KHATIAN_ENTRY_ID != null ? <p>KHATIAN_ENTRY_ID: {khatian.KHATIAN_ENTRY_ID}</p> : null}
              <p>JL_NUMBER_ID: {khatian.JL_NUMBER_ID}</p>
              {khatian.SURVEY_ID != null ? <p>SURVEY_ID: {khatian.SURVEY_ID}</p> : null}
              {fullKhatian ? <p>LISF status: {fullKhatian.lisf.status}</p> : null}
              {model.reconstruction ? (
                <pre className="mt-2 max-h-48 overflow-auto border border-slate-300 bg-slate-50 p-2 text-[10px]">
                  {JSON.stringify(model.reconstruction, null, 2)}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
