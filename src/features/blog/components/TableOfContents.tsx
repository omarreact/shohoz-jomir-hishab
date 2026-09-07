"use client";

import { useEffect, useState } from "react";

export type TocHeader = {
  id: string;
  text: string;
  level?: number;
};

export default function TableOfContents({
  headers = [],
}: {
  headers?: TocHeader[];
}) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!headers.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]?.target?.id) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -65% 0px", threshold: [0, 1] },
    );

    headers.forEach((h) => {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headers]);

  if (!headers.length) {
    return (
      <div className="sticky top-24">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h5 className="mb-2 border-b border-slate-100 pb-3 text-base font-bold text-slate-900 dark:border-slate-800 dark:text-white">
            সূচিপত্র
          </h5>
          <p className="text-sm text-slate-400">এই পোস্টে শিরোনাম নেই।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-24">
      <div className="overflow-hidden rounded-2xl border border-slate-200 border-l-4 border-l-[#006a4e] bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="p-5">
          <h5 className="mb-4 border-b border-slate-100 pb-3 text-base font-bold text-slate-900 dark:border-slate-800 dark:text-white">
            সূচিপত্র
          </h5>
          <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto">
            {headers.map((header) => (
              <a
                key={header.id}
                href={`#${header.id}`}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  header.level === 3 ? "pl-5 text-[13px]" : ""
                } ${
                  activeId === header.id
                    ? "bg-[#006a4e]/10 text-[#006a4e]"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                }`}
                onClick={() => setActiveId(header.id)}
              >
                {header.text}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
