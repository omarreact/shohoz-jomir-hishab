import type { Metadata } from "next";
import Link from "next/link";
import { collections, isFirebaseAdminReady } from "@/src/modules/database/firebaseAdmin";

export const metadata: Metadata = {
  title: "ডকুমেন্ট যাচাই | LandBD",
  description: "LandBD-তে তৈরি খতিয়ান ভিউ বা তথ্যভিত্তিক রিপোর্টের generation record যাচাই করুন।",
};

export const dynamic = "force-dynamic";

const REPORT_ID = /^LANDBD-[A-Z0-9]{8,20}$/;

function value(data: Record<string, unknown> | null, key: string): string {
  const item = data?.[key];
  if (item === null || item === undefined || item === "") return "—";
  return String(item);
}

export default async function ReportVerificationPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId: rawReportId } = await params;
  const reportId = decodeURIComponent(rawReportId).trim().toUpperCase();

  let record: Record<string, unknown> | null = null;
  let serviceError = false;

  if (REPORT_ID.test(reportId) && isFirebaseAdminReady()) {
    try {
      const snapshot = await collections.reportVerifications.doc(reportId).get();
      if (snapshot.exists) record = snapshot.data() ?? null;
    } catch (error) {
      console.error("[report-verification] lookup failed", error);
      serviceError = true;
    }
  } else if (!isFirebaseAdminReady()) {
    serviceError = true;
  }

  const found = Boolean(record);
  const isKhatianView = value(record, "documentType") === "KHATIAN_VIEW";

  const details = isKhatianView
    ? [
        ["খতিয়ান নং", value(record, "khatianNo")],
        ["জেলা", value(record, "district")],
        ["উপজেলা / সার্কেল", value(record, "upazila")],
        ["সার্ভে", value(record, "survey")],
        ["মৌজা", value(record, "mouza")],
        ["JL নং", value(record, "jlNumber")],
        ["রেকর্ড ID", value(record, "recordId")],
        ["এন্ট্রি ID", value(record, "khatianEntryId")],
        ["মোট জমি", value(record, "totalLand")],
        ["তৈরির সময়", value(record, "generatedAt")],
      ]
    : [
        ["জেলা", value(record, "district")],
        ["উপজেলা", value(record, "upazila")],
        ["সার্ভে", value(record, "survey")],
        ["মৌজা", value(record, "mouza")],
        ["JL নং", value(record, "jlNumber")],
        ["মোট খতিয়ান", value(record, "totalKhatians")],
        ["তৈরির সময়", value(record, "generatedAt")],
        ["ডেটা উৎস", "DLRMS public records"],
      ];

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-5 py-5 sm:px-7">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#006a4e]">LandBD</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{isKhatianView ? "খতিয়ান যাচাই" : "রিপোর্ট যাচাই"}</h1>
          <p className="mt-2 break-all font-mono text-sm text-slate-600">{reportId}</p>
        </div>

        <div className="p-5 sm:p-7">
          {serviceError ? (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
              যাচাই সেবা এই মুহূর্তে পাওয়া যাচ্ছে না। পরে আবার চেষ্টা করুন।
            </div>
          ) : found ? (
            <>
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950">
                <p className="text-base font-bold">✓ LandBD-তে এই Report ID-এর generation record পাওয়া গেছে।</p>
                <p className="mt-1 text-sm leading-6">
                  এই যাচাই শুধুমাত্র LandBD কর্তৃক {isKhatianView ? "এই খতিয়ান ভিউটি" : "রিপোর্টটি"} তৈরি হওয়ার রেকর্ড নিশ্চিত করে; এটি সরকারি প্রত্যয়ন নয়।
                </p>
              </div>

              <dl className="mt-6 grid grid-cols-1 overflow-hidden rounded-xl border border-slate-200 sm:grid-cols-2">
                {details.map(([label, item]) => (
                  <div key={label} className="border-b border-slate-200 p-3 last:border-b-0 sm:border-r sm:even:border-r-0">
                    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                    <dd className="mt-1 text-sm font-semibold text-slate-900">{item}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-600">
                <p><strong>Payload fingerprint:</strong> <span className="break-all font-mono">{value(record, "payloadHash")}</span></p>
                {isKhatianView ? (
                  <>
                    <p className="mt-1">মালিক সংখ্যা: {Array.isArray(record?.owners) ? record.owners.length : 0}</p>
                    <p className="mt-1">দাগ সংখ্যা: {Array.isArray(record?.dags) ? record.dags.length : 0}</p>
                  </>
                ) : (
                  <p className="mt-1">হাল/সাবেক mapping: {value(record, "halSabekMapped")} / {value(record, "halSabekRequested")}</p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950">
              এই Report ID-এর কোনো LandBD generation record পাওয়া যায়নি। IDটি সঠিক কিনা যাচাই করুন।
            </div>
          )}

          <div className="mt-6 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-950">
            <p className="font-bold">গুরুত্বপূর্ণ আইনি ঘোষণা</p>
            <p className="mt-1">
              এটি সরকারি প্রত্যয়িত পর্চা, খতিয়ান বা মালিকানা সনদ নয়। আইনি, নিবন্ধন, নামজারি, আদালত বা অন্য কোনো দাপ্তরিক কাজে ব্যবহারের আগে সংশ্লিষ্ট সরকারি রেকর্ডের সাথে তথ্য যাচাই করুন।
            </p>
          </div>

          <div className="mt-6">
            <Link href={isKhatianView ? "/dlrms-khatian" : "/mouza-porcha-report"} className="font-semibold text-[#006a4e] hover:underline">
              ← {isKhatianView ? "DLRMS খতিয়ানে ফিরে যান" : "মৌজা পর্চা রিপোর্টে ফিরে যান"}
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
