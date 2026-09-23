"use client";

import { useEffect, useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import {
  WARISH_RELATIONS,
  type WarishSanadFormValues,
} from "@/src/features/warishsanad/schema";

type WardOption = {
  id: string;
  label: string;
  zoneId: string;
};

type Props = {
  form: UseFormReturn<WarishSanadFormValues>;
};

function FieldError({ message }: { message?: string }) {
  return message ? <p className="warish-field-error">{message}</p> : null;
}

export default function CertificateForm({ form }: Props) {
  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "heirs" });
  const [wards, setWards] = useState<WardOption[]>([]);
  const [loadingWards, setLoadingWards] = useState(true);
  const [loadingZone, setLoadingZone] = useState(false);
  const [loadingAuthority, setLoadingAuthority] = useState(false);
  const [apiError, setApiError] = useState("");

  const ward = watch("ward");
  const zoneId = watch("zoneId");

  useEffect(() => {
    const controller = new AbortController();
    setLoadingWards(true);
    fetch("/api/wards", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.ok) throw new Error(json?.error || "ওয়ার্ড লোড ব্যর্থ");
        setWards(Array.isArray(json.data) ? json.data : []);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setApiError(error instanceof Error ? error.message : "ওয়ার্ড লোড ব্যর্থ");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingWards(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    setValue("zoneId", "", { shouldValidate: false });
    setValue("zoneName", "", { shouldValidate: false });
    setValue("officerName", "", { shouldValidate: false });
    setValue("officerTitle", "", { shouldValidate: false });
    setValue("councillorName", "", { shouldValidate: false });
    setValue("councillorTitle", "", { shouldValidate: false });
    setApiError("");

    if (!ward) return () => controller.abort();

    setLoadingZone(true);
    fetch(`/api/ward-data?scope=zone&ward=${encodeURIComponent(ward)}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.ok) throw new Error(json?.error || "জোন লোড ব্যর্থ");
        setValue("zoneId", String(json.data.id), { shouldValidate: true });
        setValue("zoneName", String(json.data.name), { shouldValidate: true });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setApiError(error instanceof Error ? error.message : "জোন লোড ব্যর্থ");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingZone(false);
      });

    return () => controller.abort();
  }, [ward, setValue]);

  useEffect(() => {
    const controller = new AbortController();
    if (!ward || !zoneId) return () => controller.abort();

    setLoadingAuthority(true);
    setApiError("");

    fetch(
      `/api/ward-data?scope=authority&ward=${encodeURIComponent(ward)}&zoneId=${encodeURIComponent(zoneId)}`,
      { signal: controller.signal, cache: "no-store" },
    )
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok || !json?.ok) throw new Error(json?.error || "কর্তৃপক্ষের তথ্য লোড ব্যর্থ");
        setValue("officerName", json.data.officerName ?? "", { shouldValidate: true });
        setValue("officerTitle", json.data.officerTitle ?? "", { shouldValidate: true });
        setValue("councillorName", json.data.councillorName ?? "", { shouldValidate: true });
        setValue("councillorTitle", json.data.councillorTitle ?? "", { shouldValidate: true });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setApiError(error instanceof Error ? error.message : "কর্তৃপক্ষের তথ্য লোড ব্যর্থ");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAuthority(false);
      });

    return () => controller.abort();
  }, [ward, zoneId, setValue]);

  return (
    <form className="warish-form" onSubmit={(event) => event.preventDefault()}>
      <section className="warish-form-section">
        <div className="warish-section-heading">
          <h2>সনদের তথ্য</h2>
          <span>Reference + date</span>
        </div>
        <div className="warish-grid two">
          <label>
            স্মারক নং
            <input {...register("referenceNo")} />
            <FieldError message={errors.referenceNo?.message} />
          </label>
          <label>
            ইস্যু তারিখ
            <input type="date" {...register("issueDate")} />
            <FieldError message={errors.issueDate?.message} />
          </label>
        </div>
      </section>

      <section className="warish-form-section">
        <div className="warish-section-heading">
          <h2>Ward → Zone → Authority</h2>
          <span>{loadingAuthority ? "Authority loading…" : loadingZone ? "Zone loading…" : "Auto mapped"}</span>
        </div>

        <div className="warish-grid two">
          <label>
            ওয়ার্ড
            <select {...register("ward")} disabled={loadingWards}>
              <option value="">{loadingWards ? "লোড হচ্ছে…" : "ওয়ার্ড নির্বাচন করুন"}</option>
              {wards.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <FieldError message={errors.ward?.message} />
          </label>
          <label>
            অঞ্চল / Zone
            <input {...register("zoneName")} placeholder="Ward নির্বাচন করলে auto-load হবে" />
            <FieldError message={errors.zoneName?.message} />
          </label>
        </div>

        <input type="hidden" {...register("zoneId")} />
        {apiError ? <p className="warish-api-error">{apiError}</p> : null}

        <div className="warish-grid two">
          <label>
            আঞ্চলিক নির্বাহী কর্মকর্তার নাম
            <input {...register("officerName")} />
            <FieldError message={errors.officerName?.message} />
          </label>
          <label>
            কর্মকর্তার পদবি
            <input {...register("officerTitle")} />
            <FieldError message={errors.officerTitle?.message} />
          </label>
          <label>
            কাউন্সিলরের নাম
            <input {...register("councillorName")} />
            <FieldError message={errors.councillorName?.message} />
          </label>
          <label>
            কাউন্সিলরের পদবি
            <input {...register("councillorTitle")} />
            <FieldError message={errors.councillorTitle?.message} />
          </label>
        </div>
      </section>

      <section className="warish-form-section">
        <div className="warish-section-heading">
          <h2>মৃত ব্যক্তি ও আবেদনকারী</h2>
          <span>Certificate body</span>
        </div>
        <div className="warish-grid two">
          <label>
            মৃত ব্যক্তির নাম
            <input {...register("deceasedName")} />
            <FieldError message={errors.deceasedName?.message} />
          </label>
          <label>
            পিতা/স্বামীর নাম
            <input {...register("fatherOrHusbandName")} />
            <FieldError message={errors.fatherOrHusbandName?.message} />
          </label>
          <label>
            মাতার নাম
            <input {...register("motherName")} />
            <FieldError message={errors.motherName?.message} />
          </label>
          <label>
            মৃত্যুর তারিখ (ঐচ্ছিক)
            <input type="date" {...register("deathDate")} />
          </label>
          <label className="span-two">
            পূর্ণ ঠিকানা
            <textarea rows={3} {...register("address")} />
            <FieldError message={errors.address?.message} />
          </label>
          <label className="span-two">
            আবেদনকারীর নাম
            <input {...register("applicantName")} />
            <FieldError message={errors.applicantName?.message} />
          </label>
        </div>
      </section>

      <section className="warish-form-section">
        <div className="warish-section-heading">
          <div>
            <h2>ওয়ারিশ তালিকা</h2>
            <span>সর্বোচ্চ ৬ জন · প্রতি preview row 9.77mm</span>
          </div>
          <button
            type="button"
            className="warish-secondary-button"
            disabled={fields.length >= 6}
            onClick={() => append({ name: "", relation: "পুত্র", idNumber: "" })}
          >
            + ওয়ারিশ যোগ করুন
          </button>
        </div>

        <div className="warish-heir-editor">
          {fields.map((field, index) => (
            <div className="warish-heir-card" key={field.id}>
              <div className="warish-heir-index">{index + 1}</div>
              <label>
                নাম
                <input {...register(`heirs.${index}.name`)} />
                <FieldError message={errors.heirs?.[index]?.name?.message} />
              </label>
              <label>
                সম্পর্ক
                <select {...register(`heirs.${index}.relation`)}>
                  {WARISH_RELATIONS.map((relation) => (
                    <option key={relation} value={relation}>{relation}</option>
                  ))}
                </select>
                <FieldError message={errors.heirs?.[index]?.relation?.message} />
              </label>
              <label>
                NID/জন্ম নিবন্ধন (ঐচ্ছিক)
                <input {...register(`heirs.${index}.idNumber`)} />
              </label>
              <button
                type="button"
                className="warish-remove-button"
                disabled={fields.length === 1}
                onClick={() => remove(index)}
                aria-label={`ওয়ারিশ ${index + 1} মুছুন`}
              >
                মুছুন
              </button>
            </div>
          ))}
        </div>
        <FieldError message={typeof errors.heirs?.message === "string" ? errors.heirs.message : undefined} />
      </section>
    </form>
  );
}
