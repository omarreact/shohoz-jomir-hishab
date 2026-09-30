"use client";

import { FormEvent, useEffect, useState } from "react";
import type { NormalizedNidRecord } from "./schema";

type VerifyResponse = {
  ok: boolean;
  requestId?: string;
  provider?: string;
  responseTimeMs?: number;
  verifiedAt?: string;
  record?: NormalizedNidRecord;
  error?: string;
  code?: string;
};

const maskId = (value: string | null) =>
  value && value.length > 4
    ? `${"•".repeat(value.length - 4)}${value.slice(-4)}`
    : value || "—";

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

function Address({
  title,
  address,
}: {
  title: string;
  address: NormalizedNidRecord["presentAddress"];
}) {
  const rows: Array<[string, string | null]> = [
    ["বিভাগ", address.division],
    ["জেলা", address.district],
    ["উপজেলা/থানা", address.upazila],
    ["সিটি/ইউনিয়ন", address.city || address.union],
    ["মৌজা", address.mouza],
    ["ওয়ার্ড", address.ward],
    ["গ্রাম/রাস্তা", address.village],
    ["বাড়ি/হোল্ডিং", address.house],
    ["ডাকঘর", address.postOffice],
    ["পোস্ট কোড", address.postCode],
    ["ভোটার এলাকা", address.voterArea],
    ["পূর্ণ ঠিকানা", address.addressLine],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <Field key={label} label={label} value={value} />
        ))}
      </div>
    </section>
  );
}

export function NidDobClient() {
  const [access, setAccess] = useState<"loading" | "allowed" | "denied">(
    "loading",
  );
  const [nidNumber, setNidNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showNid, setShowNid] = useState(false);
  const [result, setResult] = useState<VerifyResponse | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!active) return;
        const role = data?.user?.role;
        setAccess(
          response.ok && (role === "Admin" || role === "Super Admin")
            ? "allowed"
            : "denied",
        );
      })
      .catch(() => active && setAccess("denied"));
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setShowNid(false);

    try {
      const response = await fetch("/api/nid-dob/verify", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        cache: "no-store",
        credentials: "same-origin",
        body: JSON.stringify({
          nidNumber,
          dateOfBirth,
          authorizedUse: consent,
        }),
      });

      setResult(
        (await response.json().catch(() => ({
          ok: false,
          error: `Request failed with HTTP ${response.status}.`,
        }))) as VerifyResponse,
      );
    } catch {
      setResult({ ok: false, error: "Verification service could not be reached." });
    } finally {
      setBusy(false);
    }
  }

  if (access === "loading") {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 p-5">
        <p className="rounded-2xl border bg-white px-5 py-4 text-sm text-slate-500">
          প্রবেশাধিকার যাচাই করা হচ্ছে…
        </p>
      </main>
    );
  }

  if (access !== "allowed") {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-slate-50 p-5">
        <section className="max-w-lg rounded-3xl border border-amber-200 bg-white p-7">
          <div className="text-3xl">🔒</div>
          <h1 className="mt-3 text-2xl font-black">সীমিত প্রশাসনিক টুল</h1>
          <p className="mt-2 text-sm text-slate-600">
            এই NID verification tool কেবল LandBD Admin / Super Admin-এর জন্য।
          </p>
        </section>
      </main>
    );
  }

  const record = result?.ok ? result.record : undefined;
  const info: Array<[string, string | null]> = record
    ? [
        ["NID", showNid ? record.nidNumber : maskId(record.nidNumber)],
        ["নাম (বাংলা)", record.nameBn],
        ["Name (English)", record.nameEn],
        ["জন্মতারিখ", record.dateOfBirth],
        ["লিঙ্গ", record.gender],
        ["জন্মস্থান", record.birthPlace],
        ["রক্তের গ্রুপ", record.bloodGroup],
        ["ধর্ম", record.religion],
        ["শিক্ষা", record.education],
        ["পেশা", record.occupation],
        ["বৈবাহিক অবস্থা", record.maritalStatus],
        ["মোবাইল", record.mobile],
        ["ইমেইল", record.email],
        ["পিতার নাম", record.fatherName],
        ["পিতার NID", maskId(record.fatherNid)],
        ["মাতার নাম", record.motherName],
        ["মাতার NID", maskId(record.motherNid)],
        ["স্বামী/স্ত্রী", record.spouseName],
        ["স্বামী/স্ত্রীর NID", maskId(record.spouseNid)],
        ["জন্ম নিবন্ধন", record.birthRegistration],
        ["TIN", record.tin],
        ["Passport", record.passport],
        ["Driving License", record.drivingLicense],
        ["প্রতিবন্ধিতা", record.disability],
        ["শনাক্তকরণ চিহ্ন", record.identificationMark],
        ["ভোটার এলাকা", record.voterArea],
        ["ঠিকানা বিবরণ", record.homeDescription],
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-[.15em] text-emerald-700">
            LandBD secure identity tool
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-black">NID + Date of Birth Verification</h1>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[11px] font-black text-emerald-700">
              ADMIN ONLY
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Authorized Porichoy verification only. Provider credentials server-side
            থাকে; এই page identity result localStorage/sessionStorage-এ রাখে না।
          </p>

          <form
            onSubmit={submit}
            className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <label>
              <span className="mb-2 block text-xs font-extrabold">NID নম্বর</span>
              <input
                value={nidNumber}
                onChange={(e) =>
                  setNidNumber(e.target.value.replace(/\D/g, "").slice(0, 17))
                }
                inputMode="numeric"
                autoComplete="off"
                placeholder="10 / 13 / 17 digit"
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-extrabold">জন্মতারিখ</span>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-slate-300 px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <button
              type="submit"
              disabled={!nidNumber || !dateOfBirth || !consent || busy}
              className="h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-black text-white disabled:opacity-45"
            >
              {busy ? "যাচাই হচ্ছে…" : "যাচাই করুন"}
            </button>

            <label className="flex gap-3 rounded-2xl border bg-slate-50 p-4 text-xs leading-5 text-slate-600 md:col-span-3">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 size-4 accent-emerald-700"
              />
              <span>
                আমি নিশ্চিত করছি যে এই পরিচয় তথ্য যাচাই করার বৈধ অনুমতি ও
                প্রয়োজনীয় সম্মতি আমার রয়েছে।
              </span>
            </label>
          </form>

          {result && !result.ok ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <strong>{result.error || "Verification failed."}</strong>
              {result.code ? <span className="ml-2 text-xs">({result.code})</span> : null}
              {result.requestId ? (
                <div className="mt-1 text-xs">Request ID: {result.requestId}</div>
              ) : null}
            </div>
          ) : null}
        </section>

        {record ? (
          <>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-emerald-700">
                    VERIFIED VIA {result?.provider || "PROVIDER"}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {result?.verifiedAt
                      ? new Date(result.verifiedAt).toLocaleString("en-GB")
                      : ""}
                    {typeof result?.responseTimeMs === "number"
                      ? ` · ${result.responseTimeMs} ms`
                      : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNid((value) => !value)}
                  className="rounded-xl border px-3 py-2 text-xs font-bold"
                >
                  {showNid ? "NID লুকান" : "পূর্ণ NID দেখান"}
                </button>
              </div>

              <div className="grid gap-5 lg:grid-cols-[180px_1fr]">
                {record.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={record.photoUrl}
                    alt="NID profile"
                    referrerPolicy="no-referrer"
                    className="aspect-[3/4] w-full rounded-2xl border object-cover"
                  />
                ) : (
                  <div className="grid aspect-[3/4] place-items-center rounded-2xl border border-dashed bg-slate-50 text-xs text-slate-400">
                    No photo
                  </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {info.map(([label, value]) => (
                    <Field key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
              <Address title="বর্তমান ঠিকানা" address={record.presentAddress} />
              <Address title="স্থায়ী ঠিকানা" address={record.permanentAddress} />
            </div>

            <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              Provider photo URL short-lived হতে পারে। URL expire হলে পুরোনো link
              reuse না করে নতুন authorized verification চালান।
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
