"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  ExternalLink,
  FileKey2,
  FileText,
  Loader2,
  LockKeyhole,
  ReceiptText,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import ResultDocument from "@/src/shared/components/ResultDocument";
import ResultDownloadButton from "@/src/shared/components/ResultDownloadButton";
import ResultPrintButton from "@/src/shared/components/ResultPrintButton";
import { useGeneratePDF } from "@/src/shared/hooks/useGeneratePDF";
import { Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/src/shared/ui/Card";
import { Input } from "@/src/shared/ui/Input";
import { landRecordsApi } from "../api";
import type {
  DlrmsCitizenApplication,
  DlrmsCitizenInvoice,
  DlrmsCitizenPage,
  DlrmsCitizenPrint,
} from "../dlrms-citizen";

const FIELD_LABELS: Record<string, string> = {
  FORM_NO: "ফরম নং",
  THANA_OYAR_NONG: "থানা / ওয়ার্ড নং",
  REF_PAGE_NO: "রেফারেন্স পৃষ্ঠা",
  SA_KHATIAN_NO: "SA খতিয়ান নং",
  SABACK_JL_NO: "সাবেক JL নং",
  EJARADARER_NUM_THIKANA: "ইজারাদারের নাম ও ঠিকানা",
  SOTTADHIKARI_SHRENI: "স্বত্বাধিকারীর শ্রেণি",
  OTRO_SOTTER_BIBORON_JOT: "অন্যান্য স্বত্ব / জোত বিবরণ",
  RAJOSO: "রাজস্ব",
  RAJOSO_TAKA: "রাজস্ব (টাকা)",
  RAJOSO_POYSA: "রাজস্ব (পয়সা)",
  DAG_NONG: "দাগ নং",
  JOMIR_ROKOM: "জমির শ্রেণি",
  JOMIR_ROKOM_KRISHI: "জমির শ্রেণি (কৃষি)",
  JOMIR_ROKOM_OKRISHI: "জমির শ্রেণি (অকৃষি)",
  DAGER_MOT_PORIMAN_AKOR: "দাগের মোট পরিমাণ (একর)",
  DAGER_MOT_PORIMAN_SHOTANGSHO: "দাগের মোট পরিমাণ (শতাংশ)",
  DAGER_MODDA_OTRO_KHATIAN_ONGSO: "দাগে এই খতিয়ানের অংশ",
  ONGSANOJAE_JOMI_PORIMAN_AKOR: "অংশ অনুযায়ী জমি (একর)",
  ONGSANOJAE_JOMI_PORIMAN_SHOTOK: "অংশ অনুযায়ী জমি (শতক)",
  MOT_JOMI_AKOR: "মোট জমি (একর)",
  MOT_JOMI_SHOTANGSHO: "মোট জমি (শতাংশ)",
  SORBO_MOT_AKOR: "সর্বমোট (একর)",
  SORBO_MOT_SHOTOK: "সর্বমোট (শতক)",
  OTS_DOKHOLKAR: "দখলকার / স্বত্বাধিকারীর বিবরণ",
  OTS_DOKHOLKAR_ONGSO: "দখলকারের অংশ",
  OTS_DOKHOLKAR_2: "অতিরিক্ত দখলকার / স্বত্বাধিকারী",
  OTS_DOKHOLKAR_ONGSO_2: "অতিরিক্ত দখলকারের অংশ",
  OTS_SHRENI_NIYOM_ONUSONGO: "স্বত্বের শ্রেণি / নিয়ম",
  MANTOBBO_PROTHOM_PATA: "প্রথম পাতার মন্তব্য",
  MANTOBBO_DITIYO_PATA: "দ্বিতীয় পাতার মন্তব্য",
  ONNANNO_MANTOBBO: "অন্যান্য মন্তব্য",
  DHARAMOTA_NOTE_PORIBORTON: "ধারামতে নোট / পরিবর্তন",
  LOCAL_DAG_ANOSARE_JOMI_PORIMAN: "স্থানীয় দাগ অনুযায়ী জমির পরিমাণ",
  WARD_NONG: "ওয়ার্ড নং",
  SHEET_NONG: "শিট নং",
};

function labelForField(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/_/g, " ");
}

function safeFilePart(value: unknown, fallback: string): string {
  const text = String(value ?? "").trim();
  return (
    text
      .replace(/[^\w\u0980-\u09FF-]+/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 48) || fallback
  );
}

function SummaryList({
  label,
  values,
}: {
  label: string;
  values: string[];
}) {
  if (!values.length) return null;
  return (
    <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--canvas)] p-3">
      <p className="text-xs font-extrabold uppercase tracking-[.08em] text-[var(--survey-teal)]">{label}</p>
      <div className="mt-2 space-y-1 text-sm leading-6 text-[var(--foreground)]">
        {values.map((value, index) => (
          <p key={`${label}-${index}-${value}`}>{value}</p>
        ))}
      </div>
    </div>
  );
}

function PageFields({ page }: { page: DlrmsCitizenPage }) {
  const fields = Object.entries(page.fields);
  return (
    <section className="rounded-[14px] border border-[var(--border-color)] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--border-color)] pb-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[.08em] text-[var(--survey-teal)]">
            DLRMS source page
          </p>
          <h4 className="mt-1 text-base font-black text-[var(--foreground)]">{page.name}</h4>
        </div>
        <div className="text-right text-[10px] leading-5 text-[var(--muted-foreground)]">
          <p>Page type: {page.pageType ?? "—"}</p>
          <p>Template: {page.templateType ?? "—"}</p>
        </div>
      </div>

      {fields.length ? (
        <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
          {fields.map(([key, value]) => (
            <div key={key} className="min-w-0 border-b border-[var(--border-color)]/70 pb-2 last:border-0">
              <p className="text-[10px] font-bold text-[var(--muted-foreground)]">
                {labelForField(key)}
              </p>
              <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-[var(--foreground)]">
                {value}
              </p>
              <p className="mt-0.5 font-mono text-[9px] text-slate-400">{key}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[var(--muted-foreground)]">এই source page-এ আলাদা field value পাওয়া যায়নি।</p>
      )}
    </section>
  );
}

function CitizenPrintReport({
  result,
  captureRef,
}: {
  result: DlrmsCitizenPrint;
  captureRef: RefObject<HTMLDivElement | null>;
}) {
  const summary = result.summary;
  const generated = new Intl.DateTimeFormat("bn-BD", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Asia/Dhaka",
  }).format(new Date(result.fetchedAt));

  return (
    <ResultDocument ref={captureRef} className="rounded-[14px] border border-[var(--border-color)] p-5 sm:p-7">
      <div className="border-b-2 border-[var(--primary)] pb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.12em] text-[var(--survey-teal)]">
              DLRMS CITIZEN SOURCE · LANDBD
            </p>
            <h2 className="mt-1 text-2xl font-black text-[var(--foreground)]">
              খতিয়ান নং {result.khatian.khatianNo || "—"}
            </h2>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">
              {result.khatian.mouzaName || "—"} · JL {result.khatian.jlNumber || "—"} · Survey ID {result.khatian.surveyId ?? "—"}
            </p>
          </div>
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50 px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-[.1em] text-emerald-700">Authenticated source</p>
            <p className="mt-0.5 text-xs font-bold text-emerald-950">Application {result.applicationId}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["জেলা", result.khatian.districtName || result.districtName || "—"],
          ["উপজেলা", result.khatian.upazilaName || "—"],
          ["মৌজা", result.khatian.mouzaName || "—"],
          ["JL নং", result.khatian.jlNumber || "—"],
          ["RS নং", result.khatian.rsNo || "—"],
          ["ভলিউম", result.khatian.volumeNo || "—"],
          ["DLRMS Khatian ID", String(result.khatian.id || "—")],
          ["Source pages", String(result.totalPages)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[10px] border border-[var(--border-color)] bg-[var(--canvas)] px-3 py-2.5">
            <p className="text-[10px] font-bold text-[var(--muted-foreground)]">{label}</p>
            <p className="mt-0.5 break-words text-sm font-bold text-[var(--foreground)]">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">
        <strong>LandBD ব্যাখ্যামূলক কপি:</strong> নিচের মানগুলো authenticated DLRMS citizen
        print response থেকে নেওয়া। এটি সরকারি certified copy-এর বিকল্প নয়; আইনগত ব্যবহারে মূল
        DLRMS নথির সাথে যাচাই করুন।
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        <SummaryList label="দখলকার / স্বত্বাধিকারী" values={summary.occupantText} />
        <SummaryList label="অংশ" values={summary.shareText} />
        <SummaryList label="দাগ" values={summary.dagText} />
        <SummaryList label="জমির শ্রেণি" values={summary.landTypeText} />
        <SummaryList label="জমির পরিমাণ" values={summary.areaText} />
        <SummaryList label="রাজস্ব / খাজনা" values={summary.rentText} />
        <SummaryList label="মন্তব্য" values={summary.remarks} />
      </div>

      <div className="mt-5 space-y-4">
        {result.pages.map((page) => (
          <PageFields key={page.id} page={page} />
        ))}
      </div>

      <div className="mt-5 border-t border-[var(--border-color)] pt-3 text-xs leading-5 text-[var(--muted-foreground)]">
        <p>উৎস: gateway.dlrms.land.gov.bd · citizen print-khatian response</p>
        <p>LandBD fetch time: {generated}</p>
        {result.khatian.uuid ? <p className="break-all font-mono">Khatian UUID: {result.khatian.uuid}</p> : null}
      </div>
    </ResultDocument>
  );
}

export default function DlrmsCitizenImport() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const [token, setToken] = useState("");
  const [invoiceRef, setInvoiceRef] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [invoice, setInvoice] = useState<DlrmsCitizenInvoice | null>(null);
  const [printResult, setPrintResult] = useState<DlrmsCitizenPrint | null>(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [loadingPrint, setLoadingPrint] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  const fileName = useMemo(() => {
    if (!printResult) return "LandBD-DLRMS-Citizen-Khatian-A4";
    return `LandBD-DLRMS-${safeFilePart(printResult.khatian.mouzaName, "Mouza")}-Khatian-${safeFilePart(printResult.khatian.khatianNo, "Record")}-Application-${printResult.applicationId}-A4`;
  }, [printResult]);

  const { generatePDF, isGenerating, pdfError } = useGeneratePDF({
    sourceRef: captureRef,
    fileName,
  });

  const clearSensitiveSession = () => {
    setToken("");
    setInvoice(null);
    setPrintResult(null);
    setApplicationId("");
    setError(null);
  };

  const loadInvoice = async () => {
    if (!token.trim() || !invoiceRef.trim()) {
      setError("DLRMS user-token এবং Invoice / Order ID দিন।");
      return;
    }
    setLoadingInvoice(true);
    setError(null);
    setInvoice(null);
    setPrintResult(null);
    try {
      setInvoice(await landRecordsApi.citizenInvoice(token, invoiceRef));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "DLRMS invoice লোড করা যায়নি।");
    } finally {
      setLoadingInvoice(false);
    }
  };

  const loadPrint = async (targetId?: number) => {
    const id = targetId ?? Number(applicationId);
    if (!token.trim() || !Number.isSafeInteger(id) || id <= 0) {
      setError("DLRMS user-token এবং সঠিক Application ID দিন।");
      return;
    }
    setLoadingPrint(true);
    setError(null);
    setPrintResult(null);
    try {
      const result = await landRecordsApi.citizenPrintKhatian(token, id);
      setApplicationId(String(id));
      setPrintResult(result);
      requestAnimationFrame(() => {
        document.getElementById("dlrms-citizen-print-result")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "DLRMS print-khatian লোড করা যায়নি।");
    } finally {
      setLoadingPrint(false);
    }
  };

  if (authLoading) {
    return (
      <Card className="mt-6">
        <CardBody>
          <div className="flex items-center gap-2 py-4 text-sm text-[var(--muted-foreground)]">
            <Loader2 className="animate-spin" size={16} /> নিরাপদ citizen import প্রস্তুত হচ্ছে…
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!isLoggedIn) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>নিজের DLRMS Citizen কপি</CardTitle>
          <CardDescription>
            Paid / authenticated DLRMS application-এর পূর্ণ print record LandBD-তে আনতে লগইন প্রয়োজন।
          </CardDescription>
        </CardHeader>
        <CardBody>
          <Link href="/login?from=/dlrms-khatian" className="landbd-primary-button inline-flex min-h-11 items-center gap-2 px-4 py-2.5 text-sm font-bold no-underline">
            <LockKeyhole size={16} /> LandBD-তে লগইন করুন
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <section className="mt-6" aria-label="DLRMS Citizen authenticated import">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>নিজের DLRMS Citizen কপি আনুন</CardTitle>
              <CardDescription>
                DLRMS citizen session-এর Invoice / Order থেকে application খুঁজুন অথবা সরাসরি Application ID দিয়ে
                authenticated <code>print-khatian</code> record আনুন।
              </CardDescription>
            </div>
            <span className="landbd-status-chip border-emerald-200 bg-emerald-50 text-emerald-800">
              <ShieldCheck size={13} /> Logged-in only
            </span>
          </div>
        </CardHeader>
        <CardBody>
          <div className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 shrink-0" size={15} />
              <p>
                <strong>DLRMS user-token একটি সংবেদনশীল session credential.</strong> LandBD এটি
                localStorage, Firestore বা database-এ সংরক্ষণ করে না। এই পেজের memory-তে থাকে এবং
                HTTPS request-এর জন্য server-এ সাময়িকভাবে পাঠানো হয়। কাজ শেষে “Token মুছুন” চাপুন।
              </p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-bold text-[var(--foreground)]" htmlFor="dlrms-user-token">
              DLRMS Citizen user-token
            </label>
            <input
              id="dlrms-user-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              placeholder="Bearer ছাড়া JWT token পেস্ট করুন"
              className="mt-1 min-h-11 w-full rounded-[10px] border border-[var(--border-color)] bg-white px-3 py-2 font-mono text-xs outline-none transition focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_14%,transparent)]"
            />
            <p className="mt-1 text-[10px] leading-4 text-[var(--muted-foreground)]">
              Token UI-তে mask করা থাকে; LandBD response-এ token ফেরত পাঠায় না।
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--canvas)] p-4">
              <div className="flex items-center gap-2">
                <ReceiptText size={17} className="text-[var(--survey-teal)]" />
                <h3 className="font-black text-[var(--foreground)]">Invoice / Order থেকে applications</h3>
              </div>
              <div className="mt-3">
                <Input
                  label="Invoice / Order ID"
                  value={invoiceRef}
                  onChange={(event) => setInvoiceRef(event.target.value)}
                  placeholder="যেমন: DLRMS order / invoice reference"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadInvoice()}
                disabled={loadingInvoice || !token.trim() || !invoiceRef.trim()}
                className="landbd-secondary-button mt-3 inline-flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingInvoice ? <Loader2 className="animate-spin" size={15} /> : <ReceiptText size={15} />}
                Invoice দেখুন
              </button>
            </div>

            <div className="rounded-[14px] border border-[var(--border-color)] bg-[var(--canvas)] p-4">
              <div className="flex items-center gap-2">
                <FileKey2 size={17} className="text-[var(--primary)]" />
                <h3 className="font-black text-[var(--foreground)]">সরাসরি Application ID</h3>
              </div>
              <div className="mt-3">
                <Input
                  label="Application ID"
                  value={applicationId}
                  onChange={(event) => setApplicationId(event.target.value.replace(/\D+/g, ""))}
                  placeholder="সংখ্যাসূচক application ID"
                  inputMode="numeric"
                />
              </div>
              <button
                type="button"
                onClick={() => void loadPrint()}
                disabled={loadingPrint || !token.trim() || !applicationId.trim()}
                className="landbd-primary-button mt-3 inline-flex min-h-10 items-center gap-2 px-3 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingPrint ? <Loader2 className="animate-spin" size={15} /> : <FileText size={15} />}
                পূর্ণ print record আনুন
              </button>
            </div>
          </div>

          {error || pdfError ? (
            <div role="alert" className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error || pdfError}
            </div>
          ) : null}

          {invoice ? (
            <div className="mt-5 rounded-[14px] border border-[var(--border-color)] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[.1em] text-[var(--survey-teal)]">DLRMS INVOICE</p>
                  <h3 className="mt-1 font-black text-[var(--foreground)]">{invoice.displayCode || invoice.invoiceId}</h3>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    {invoice.applications.length}টি application · Payment status {invoice.paymentStatus}
                  </p>
                </div>
                <span className={`landbd-status-chip ${invoice.isDownloadable ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}>
                  {invoice.isDownloadable ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
                  {invoice.isDownloadable ? "Downloadable" : "Not marked downloadable"}
                </span>
              </div>

              <div className="mt-3 grid gap-2">
                {invoice.applications.map((application: DlrmsCitizenApplication) => (
                  <div
                    key={application.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-[var(--border-color)] bg-[var(--canvas)] p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-black text-[var(--foreground)]">
                        খতিয়ান {application.khatianNo || "—"} · {application.mouza.name || "—"}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                        JL {application.jlNumber || "—"} · Survey ID {application.surveyId} · Application {application.id}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadPrint(application.id)}
                      disabled={loadingPrint}
                      className="landbd-primary-button inline-flex min-h-9 items-center gap-1.5 px-3 py-1.5 text-xs font-bold disabled:opacity-60"
                    >
                      {loadingPrint ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />}
                      পূর্ণ কপি
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={clearSensitiveSession}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700"
            >
              <Trash2 size={14} /> Token ও ফলাফল মুছুন
            </button>
            <a
              href="https://citizen.dlrms.land.gov.bd/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] border border-[var(--border-color)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--primary)] no-underline"
            >
              সরকারি Citizen DLRMS খুলুন <ExternalLink size={13} />
            </a>
          </div>
        </CardBody>
      </Card>

      {printResult ? (
        <section id="dlrms-citizen-print-result" className="mt-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.1em] text-[var(--survey-teal)]">
                AUTHENTICATED DLRMS SOURCE
              </p>
              <h2 className="mt-1 text-lg font-black text-[var(--foreground)]">
                পূর্ণ citizen print record
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <ResultDownloadButton
                onClick={() => void generatePDF()}
                loading={isGenerating}
              />
              <ResultPrintButton />
            </div>
          </div>

          <CitizenPrintReport result={printResult} captureRef={captureRef} />
        </section>
      ) : null}
    </section>
  );
}
