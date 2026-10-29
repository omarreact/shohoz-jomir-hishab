import type { NormalizedNidRecord } from "./schema";

export function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
      <p className="text-[11px] font-bold text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value || "—"}
      </p>
    </div>
  );
}

export function Address({
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

