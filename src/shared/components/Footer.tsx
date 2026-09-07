"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calculator, FileText, HelpCircle, Mail, Map, ShieldCheck } from "lucide-react";
import { FEATURE_LABELS, FEATURE_ROUTES, FOOTER_LEGAL_LINKS, FOOTER_QUICK_LINKS } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type FooterPage = { id: string; title: string; slug: string };

export default function Footer() {
  const [dynamicPages, setDynamicPages] = useState<FooterPage[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 8000);
    fetch("/api/pages", { signal: ac.signal })
      .then((response) => (response.ok ? response.json() : { pages: [] }))
      .then((data) => setDynamicPages(data.pages ?? []))
      .catch(() => {})
      .finally(() => clearTimeout(timer));
    return () => {
      ac.abort();
      clearTimeout(timer);
    };
  }, []);

  const tools = ["records", "landMeasurement", "inheritance", "landMap", "documents"] as const;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--card-bg)] py-10 text-[var(--foreground)] print:hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-3 no-underline">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#17663A] text-white">
                <Calculator size={20} />
              </span>
              <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">সহজ জমির হিসাব</span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-[var(--muted-foreground)]">{SITE_CONFIG.description}</p>
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] no-underline transition hover:border-[#17663A]/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
            >
              <Mail size={15} className="text-[#17663A] dark:text-[#54A878]" />
              {SITE_CONFIG.contactEmail}
            </a>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-[#17663A] dark:text-[#54A878]">সব টুল</h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-1 p-0 sm:grid-cols-2">
              {tools.map((key) => (
                <li key={key}>
                  <Link
                    href={FEATURE_ROUTES[key]}
                    className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-[var(--muted-foreground)] no-underline transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    <Map size={15} className="text-[#17663A] dark:text-[#54A878]" />
                    {FEATURE_LABELS[key].bn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-[#17663A] dark:text-[#54A878]">সহায়তা ও তথ্য</h2>
            <ul className="m-0 list-none space-y-1 p-0">
              {FOOTER_LEGAL_LINKS.map((key) => {
                const Icon = key === "privacy" ? ShieldCheck : key === "contact" ? Mail : key === "faq" ? HelpCircle : FileText;
                return (
                  <li key={key}>
                    <Link
                      href={FEATURE_ROUTES[key]}
                      className="inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm text-[var(--muted-foreground)] no-underline transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                    >
                      <Icon size={15} className="text-[#17663A] dark:text-[#54A878]" />
                      {FEATURE_LABELS[key].bn}
                    </Link>
                  </li>
                );
              })}
              {FOOTER_QUICK_LINKS.filter((key) => !tools.includes(key as (typeof tools)[number])).map((key) => (
                <li key={key}>
                  <Link
                    href={FEATURE_ROUTES[key]}
                    className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm text-[var(--muted-foreground)] no-underline transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    {FEATURE_LABELS[key].bn}
                  </Link>
                </li>
              ))}
              {dynamicPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/p/${page.slug}`}
                    className="inline-flex min-h-10 items-center rounded-lg px-2 text-sm text-[var(--muted-foreground)] no-underline transition hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--border-color)] pt-5 text-center text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p className="m-0">© {currentYear} সহজ জমির হিসাব। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0">ভূমি সংক্রান্ত গুরুত্বপূর্ণ সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
