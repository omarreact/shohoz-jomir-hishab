"use client";

import { useMemo } from "react";
import { Clock3, FileText, MapPinned, Trash2, Users, Calculator } from "lucide-react";
import { useRouter } from "next/navigation";
import { useHistoryStore, type CalculationRecord } from "@/src/shared/stores/useHistoryStore";

function formatBangladeshTime(timestamp: number): string {
  return new Intl.DateTimeFormat("bn-BD", {
    timeZone: "Asia/Dhaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function summary(record: CalculationRecord): string {
  const input = asRecord(record.input);
  if (record.domain === "faraez") {
    const assets = asRecord(input.assets);
    const heirs = asRecord(input.heirs);
    const land = Number(assets.land ?? 0);
    const heirCount = Object.entries(heirs).reduce((total, [key, value]) => {
      if (key === "spouse") return total + Number(value ?? 0);
      return total + Number(value ?? 0);
    }, 0);
    return `${Number.isFinite(land) ? land.toLocaleString("bn-BD") : "০"} শতাংশ · ${heirCount.toLocaleString("bn-BD")} ওয়ারিশ`;
  }

  const plots = Array.isArray(input.plots) ? input.plots : [];
  const owners = Array.isArray(input.owners) ? input.owners : [];
  const quickData = asRecord(input.quickData);
  const land = quickData.totalLand ?? plots.map((plot) => asRecord(plot).a).find(Boolean);
  return `${plots.length.toLocaleString("bn-BD")} প্লট · ${owners.length.toLocaleString("bn-BD")} মালিক${land ? ` · ${String(land)} শতাংশ` : ""}`;
}

function provenanceLabel(record: CalculationRecord): string | null {
  const p = record.provenance;
  if (!p || p.source !== "rajuk") return null;
  const plotId = p.plotId ?? asRecord(p.plot).plotId ?? asRecord(p.plot).id;
  const rs = asRecord(p.plot).rs;
  if (rs) return `RAJUK RS-${String(rs)}`;
  return plotId != null ? `RAJUK · ${String(plotId)}` : "RAJUK GIS";
}

export default function HistoryList() {
  const router = useRouter();
  const drafts = useHistoryStore((state) => state.drafts);
  const history = useHistoryStore((state) => state.history);
  const loadDraft = useHistoryStore((state) => state.loadDraft);
  const deleteCalculation = useHistoryStore((state) => state.deleteCalculation);

  const records = useMemo(() => history
    .map((id) => drafts[id])
    .filter((record): record is CalculationRecord => Boolean(record))
    .sort((a, b) => b.updatedAt - a.updatedAt), [drafts, history]);

  const load = (record: CalculationRecord) => {
    loadDraft(record.id);
    router.push(record.domain === "faraez" ? "/faraez" : "/khatiyan");
  };

  if (!records.length) {
    return (
      <div className="rounded-3xl border border-dashed border-[var(--border-color)] bg-[var(--card-bg)] p-12 text-center">
        <Clock3 className="mx-auto mb-4 text-[var(--muted-foreground)]" size={36} />
        <h2 className="text-lg font-bold">কোনো সংরক্ষিত হিসাব নেই</h2>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">খতিয়ান বা ফারায়েজ ক্যালকুলেটরে কাজ শুরু করলে হিসাবগুলো এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {records.map((record) => {
        const provenance = provenanceLabel(record);
        const isFaraez = record.domain === "faraez";
        return (
          <article key={record.id} className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <button type="button" onClick={() => load(record)} className="min-w-0 flex-1 text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--secondary)] px-2.5 py-1 text-xs font-bold">
                    {isFaraez ? <Users size={13} /> : <Calculator size={13} />}
                    {isFaraez ? "Faraez" : "Khatiyan"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--muted-foreground)]"><Clock3 size={13} /> {formatBangladeshTime(record.updatedAt)}</span>
                  {provenance && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300"><MapPinned size={13} /> {provenance}</span>}
                </div>
                <p className="mt-3 font-bold text-[var(--foreground)]">{summary(record)}</p>
                <p className="mt-1 text-xs text-[var(--muted-foreground)]">{record.status === "calculated" ? "হিসাব সম্পন্ন" : "ড্রাফট"}</p>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => load(record)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)] hover:opacity-90">
                  <FileText size={15} /> খুলুন
                </button>
                <button type="button" aria-label="হিসাব মুছুন" onClick={() => { if (window.confirm("এই হিসাবটি মুছে ফেলতে চান?")) deleteCalculation(record.id); }} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
