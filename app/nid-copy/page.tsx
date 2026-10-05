"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type RecordData = {
  registrationDate: string | null;
  registrationOffice: string | null;
  issuanceDate: string | null;
  dateOfBirth: string | null;
  birthRegistrationNumber: string | null;
  sex: string | null;
  nameBn: string | null;
  nameEn: string | null;
  placeOfBirthBn: string | null;
  placeOfBirthEn: string | null;
  motherNameBn: string | null;
  motherNameEn: string | null;
  motherNationalityBn: string | null;
  motherNationalityEn: string | null;
  fatherNameBn: string | null;
  fatherNameEn: string | null;
  fatherNationalityBn: string | null;
  fatherNationalityEn: string | null;
};

type ApiResponse = {
  ok: boolean;
  code?: string;
  error?: string;
  refreshCaptcha?: boolean;
  verifiedAt?: string;
  challenge?: { captchaImage: string; expiresInSeconds: number };
  record?: RecordData;
};

function Field(props: { label: string; value: string | null | undefined }) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <span className="block text-[11px] font-extrabold uppercase tracking-wide text-slate-500">
        {props.label}
      </span>
      <input
        value={props.value ?? ""}
        readOnly
        className="mt-1 w-full bg-transparent text-sm font-semibold text-slate-950 outline-none"
      />
    </label>
  );
}

export default function NidCopyPage() {
  const [ubrn, setUbrn] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaImage, setCaptchaImage] = useState<string | null>(null);
  const [authorizedUse, setAuthorizedUse] = useState(false);
  const [loadingCaptcha, setLoadingCaptcha] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const loadCaptcha = useCallback(async () => {
    setLoadingCaptcha(true);
    setCaptcha("");
    setError(null);

    try {
      const response = await fetch("/api/public/bdris", {
        cache: "no-store",
        credentials: "same-origin",
        headers: { accept: "application/json" },
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;
      if (!response.ok || !data?.ok || !data.challenge?.captchaImage) {
        throw new Error(data?.error || "Captcha could not be loaded.");
      }
      setCaptchaImage(data.challenge.captchaImage);
    } catch (caught) {
      setCaptchaImage(null);
      setError(caught instanceof Error ? caught.message : "Captcha could not be loaded.");
    } finally {
      setLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    void loadCaptcha();
  }, [loadCaptcha]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setVerifying(true);
    setError(null);
    setRecord(null);
    setVerifiedAt(null);

    try {
      const response = await fetch("/api/public/bdris", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          ubrn,
          birthDate,
          captchaInputText: captcha,
          authorizedUse,
        }),
      });
      const data = (await response.json().catch(() => null)) as ApiResponse | null;

      if (data?.challenge?.captchaImage) {
        setCaptchaImage(data.challenge.captchaImage);
        setCaptcha("");
      }

      if (!response.ok || !data?.ok || !data.record) {
        if (data?.refreshCaptcha && !data.challenge?.captchaImage) {
          void loadCaptcha();
        }
        throw new Error(data?.error || "Verification failed.");
      }

      setRecord(data.record);
      setVerifiedAt(data.verifiedAt || new Date().toISOString());
      setCaptcha("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  const fields: Array<[string, string | null]> = record
    ? [
        ["Birth Registration Number", record.birthRegistrationNumber],
        ["Date of Birth", record.dateOfBirth],
        ["Sex", record.sex],
        ["নাম", record.nameBn],
        ["Name", record.nameEn],
        ["জন্মস্থান", record.placeOfBirthBn],
        ["Place of Birth", record.placeOfBirthEn],
        ["মাতার নাম", record.motherNameBn],
        ["Mother's Name", record.motherNameEn],
        ["পিতার নাম", record.fatherNameBn],
        ["Father's Name", record.fatherNameEn],
        ["মাতার জাতীয়তা", record.motherNationalityBn],
        ["Mother's Nationality", record.motherNationalityEn],
        ["পিতার জাতীয়তা", record.fatherNationalityBn],
        ["Father's Nationality", record.fatherNationalityEn],
        ["Registration Date", record.registrationDate],
        ["Registration Office", record.registrationOffice],
        ["Issuance Date", record.issuanceDate],
      ]
    : [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                LandBD · BDRIS verified data fill
              </p>
              <h1 className="mt-2 text-3xl font-black">NID Copy</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Enter the 17-digit Birth Registration Number, date of birth and the
                BDRIS captcha. The captcha is solved by you. After successful
                verification, supported BDRIS fields are filled below.
              </p>
            </div>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-800">
              NOT AN OFFICIAL NID
            </span>
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4 lg:grid-cols-2">
            <label>
              <span className="mb-2 block text-xs font-extrabold">
                Birth Registration Number
              </span>
              <input
                value={ubrn}
                onChange={(event) =>
                  setUbrn(event.target.value.replace(/\D/g, "").slice(0, 17))
                }
                inputMode="numeric"
                autoComplete="off"
                placeholder="17 digits"
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <label>
              <span className="mb-2 block text-xs font-extrabold">Date of Birth</span>
              <input
                type="date"
                value={birthDate}
                onChange={(event) => setBirthDate(event.target.value)}
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex min-h-20 items-center justify-center rounded-xl bg-white p-3">
                {loadingCaptcha ? (
                  <span className="text-sm text-slate-500">Loading captcha…</span>
                ) : captchaImage ? (
                  <img
                    src={captchaImage}
                    alt="BDRIS captcha"
                    className="max-h-20 max-w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-semibold text-red-600">
                    Captcha unavailable
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => void loadCaptcha()}
                disabled={loadingCaptcha || verifying}
                className="mt-3 text-xs font-black text-emerald-700 disabled:opacity-50"
              >
                Refresh captcha
              </button>
            </div>

            <label>
              <span className="mb-2 block text-xs font-extrabold">Captcha answer</span>
              <input
                value={captcha}
                onChange={(event) =>
                  setCaptcha(
                    event.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 10),
                  )
                }
                autoComplete="off"
                className="h-12 w-full rounded-2xl border border-slate-300 bg-white px-4 outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
                required
              />
            </label>

            <label className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 lg:col-span-2">
              <input
                type="checkbox"
                checked={authorizedUse}
                onChange={(event) => setAuthorizedUse(event.target.checked)}
                className="mt-0.5 size-4 accent-emerald-700"
              />
              <span>
                I confirm that I have lawful authorization or consent to verify
                this person's birth registration information.
              </span>
            </label>

            <div className="lg:col-span-2">
              <button
                type="submit"
                disabled={
                  verifying ||
                  loadingCaptcha ||
                  !captchaImage ||
                  ubrn.length !== 17 ||
                  !birthDate ||
                  !captcha ||
                  !authorizedUse
                }
                className="h-12 rounded-2xl bg-emerald-700 px-7 text-sm font-black text-white shadow-sm hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {verifying ? "Verifying…" : "Verify and fill data"}
              </button>
            </div>
          </form>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
              {error}
            </div>
          ) : null}
        </section>

        {record ? (
          <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                  VERIFIED VIA BDRIS
                </p>
                <h2 className="mt-1 text-2xl font-black">Verified record data</h2>
              </div>
              {verifiedAt ? (
                <span className="text-xs font-semibold text-slate-500">
                  {new Date(verifiedAt).toLocaleString("en-GB")}
                </span>
              ) : null}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {fields.map(([label, value]) => (
                <Field key={label} label={label} value={value} />
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
              BDRIS verification does not return an NID number, NID photograph,
              voter-area data or NID address. LandBD does not invent or auto-fill
              those fields.
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}
