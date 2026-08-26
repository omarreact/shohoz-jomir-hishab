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
    const t = setTimeout(() => ac.abort(), 8000);
    fetch("/api/pages", { signal: ac.signal }).then((r) => (r.ok ? r.json() : { pages: [] })).then((data) => setDynamicPages(data.pages ?? [])).catch(() => {}).finally(() => clearTimeout(t));
    return () => { ac.abort(); clearTimeout(t); };
  }, []);

  const tools = ["records", "landMeasurement", "inheritance", "landMap", "documents"] as const;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[#1A6B3C]/30 bg-[#0D1F17] pt-12 pb-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-3 text-white no-underline">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1A6B3C] text-white"><Calculator size={20} /></span>
              <span className="text-xl font-bold">সহজ জমির হিসাব</span>
            </Link>
            <p className="max-w-md text-sm leading-7 text-white/70">{SITE_CONFIG.description}</p>
            <a href={`mailto:${SITE_CONFIG.contactEmail}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white no-underline hover:bg-white/10"><Mail size={15} /> {SITE_CONFIG.contactEmail}</a>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-[#F0A500]">সব টুল</h2>
            <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
              {tools.map((key) => <li key={key}><Link href={FEATURE_ROUTES[key]} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/75 no-underline hover:text-white"><Map size={15} className="text-[#54A878]" />{FEATURE_LABELS[key].bn}</Link></li>)}
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold text-[#F0A500]">সহায়তা ও তথ্য</h2>
            <ul className="m-0 list-none space-y-2 p-0">
              {FOOTER_LEGAL_LINKS.map((key) => {
                const Icon = key === "privacy" ? ShieldCheck : key === "contact" ? Mail : key === "faq" ? HelpCircle : FileText;
                return <li key={key}><Link href={FEATURE_ROUTES[key]} className="inline-flex min-h-11 items-center gap-2 text-sm text-white/75 no-underline hover:text-white"><Icon size={15} className="text-[#54A878]" />{FEATURE_LABELS[key].bn}</Link></li>;
              })}
              {FOOTER_QUICK_LINKS.filter((key) => !tools.includes(key as (typeof tools)[number])).map((key) => <li key={key}><Link href={FEATURE_ROUTES[key]} className="inline-flex min-h-11 items-center text-sm text-white/75 no-underline hover:text-white">{FEATURE_LABELS[key].bn}</Link></li>)}
              {dynamicPages.map((page) => <li key={page.id}><Link href={`/p/${page.slug}`} className="inline-flex min-h-11 items-center text-sm text-white/75 no-underline hover:text-white">{page.title}</Link></li>)}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/55">
          <p className="m-0">© {currentYear} সহজ জমির হিসাব। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0 mt-2">ভূমি সংক্রান্ত গুরুত্বপূর্ণ সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
