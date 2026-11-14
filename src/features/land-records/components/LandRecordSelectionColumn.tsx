"use client";

import { useMemo, useState } from "react";

export type LandRecordSelectionOption = {
  value: string;
  label: string;
  meta?: string;
};

export default function LandRecordSelectionColumn({
  label,
  placeholder,
  options,
  value,
  onSelect,
  loading = false,
  disabledMessage,
  className = "",
}: {
  label: string;
  placeholder: string;
  options: LandRecordSelectionOption[];
  value: string;
  onSelect: (value: string) => void;
  loading?: boolean;
  disabledMessage?: string;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("bn-BD");
    if (!needle) return options;
    return options.filter((option) =>
      `${option.label} ${option.meta ?? ""}`.toLocaleLowerCase("bn-BD").includes(needle),
    );
  }, [options, query]);

  return (
    <section
      className={`app-surface flex min-h-[20rem] min-w-0 flex-col overflow-hidden ${className}`}
      aria-label={label}
    >
      <div className="flex items-center justify-between border-b border-[var(--border-color)] bg-[var(--secondary)] px-3 py-3">
        <p className="text-sm font-semibold text-[var(--foreground)]">{label}</p>
        {value ? <span className="text-xs font-semibold text-[var(--primary)]">✓</span> : null}
      </div>

      <div className="border-b border-[var(--border-color)] px-2.5 py-2">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          disabled={Boolean(disabledMessage)}
          className="w-full min-w-0 rounded-lg border border-[var(--border-color)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_15%,transparent)] disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 [scrollbar-color:var(--border-color)_transparent] [scrollbar-width:thin]" style={{ maxHeight: "27rem" }}>
        {loading ? (
          <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-xs text-[var(--muted-foreground)]">
            তথ্য লোড হচ্ছে…
          </div>
        ) : disabledMessage ? (
          <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-xs text-[var(--muted-foreground)]">
            {disabledMessage}
          </div>
        ) : filtered.length ? (
          <div className="space-y-1">
            {filtered.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onSelect(option.value)}
                  aria-pressed={active}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? "bg-[var(--primary)] font-semibold text-[var(--primary-foreground)]"
                      : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  }`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {active ? <span className="shrink-0 text-xs">✓</span> : null}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex h-full min-h-40 items-center justify-center px-4 text-center text-xs text-[var(--muted-foreground)]">
            কোনো তথ্য পাওয়া যায়নি
          </div>
        )}
      </div>
    </section>
  );
}
