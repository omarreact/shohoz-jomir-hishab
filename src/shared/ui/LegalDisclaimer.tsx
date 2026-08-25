import { SITE_CONFIG } from "@/src/shared/config/site";

export default function LegalDisclaimer({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`text-xs leading-relaxed text-slate-500 dark:text-slate-400 ${compact ? "" : "mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2"} ${className}`}
      role="note"
    >
      <span className="font-semibold text-amber-700 dark:text-amber-400">সতর্কবার্তা: </span>
      {SITE_CONFIG.legalDisclaimer}
    </p>
  );
}
