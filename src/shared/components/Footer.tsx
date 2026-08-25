"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Calculator, ShieldCheck, FileText, HelpCircle, Mail, Map } from "lucide-react";
import {
  FEATURE_LABELS,
  FEATURE_ROUTES,
  FOOTER_LEGAL_LINKS,
  FOOTER_QUICK_LINKS,
} from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

type FooterPage = { id: string; title: string; slug: string };

export default function Footer() {
  const [dynamicPages, setDynamicPages] = useState<FooterPage[]>([]);

  useEffect(() => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 8000);
    fetch("/api/pages", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : { pages: [] }))
      .then((data) => setDynamicPages(data.pages ?? []))
      .catch(() => {})
      .finally(() => clearTimeout(t));
  }, []);

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 text-white pt-12 pb-8 mt-auto border-t border-[#006a4e]/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          <div className="mb-6 lg:mb-0">
            <Link href="/" className="flex items-center text-white no-underline mb-4">
              <div className="bg-[#006a4e] text-white rounded-full p-2 mr-3 flex items-center justify-center shadow-sm w-[40px] h-[40px] shrink-0">
                <Calculator size={20} />
              </div>
              <h4 className="font-bold text-xl m-0">{SITE_CONFIG.name}</h4>
            </Link>
            <p className="text-white/75 text-sm m-0 leading-loose max-w-[350px]">
              {SITE_CONFIG.description}
            </p>
            <p className="text-white/50 text-xs mt-3 m-0">{SITE_CONFIG.shortName}</p>
          </div>

          <div className="mb-6 lg:mb-0">
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">
              কুইক লিংক
            </h6>
            <ul className="list-none p-0 m-0 space-y-3">
              {FOOTER_QUICK_LINKS.map((key) => (
                <li key={key}>
                  <Link
                    href={FEATURE_ROUTES[key]}
                    className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm"
                  >
                    {FEATURE_LABELS[key].bn}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6 lg:mb-0">
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">
              গুরুত্বপূর্ণ পেজ
            </h6>
            <ul className="list-none p-0 m-0 space-y-3">
              {FOOTER_LEGAL_LINKS.map((key) => {
                const Icon =
                  key === "privacy"
                    ? ShieldCheck
                    : key === "contact"
                      ? Mail
                      : key === "faq"
                        ? HelpCircle
                        : FileText;
                return (
                  <li key={key}>
                    <Link
                      href={FEATURE_ROUTES[key]}
                      className="flex items-center text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm"
                    >
                      <Icon size={16} className="mr-2 text-[#006a4e] shrink-0" />
                      {FEATURE_LABELS[key].bn}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h6 className="font-bold text-[#006a4e] mb-4 uppercase text-sm tracking-wider">
              সাইট ম্যাপ
            </h6>
            <ul className="list-none p-0 m-0 space-y-3">
              <li>
                <Link
                  href={FEATURE_ROUTES.landMap}
                  className="flex items-center text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm"
                >
                  <Map size={16} className="mr-2 text-[#006a4e] shrink-0" />
                  নগর পরিকল্পনা মানচিত্র
                </Link>
              </li>
              <li>
                <Link
                  href={FEATURE_ROUTES.home}
                  className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm"
                >
                  হোম
                </Link>
              </li>
              {dynamicPages.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/p/${page.slug}`}
                    className="text-white/75 no-underline hover:text-[#006a4e] transition-all text-sm"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center text-white/50 text-xs mt-12 pt-6 border-t border-white/10">
          <p className="m-0">
            &copy; {currentYear} {SITE_CONFIG.name}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="m-0 mt-2 text-white/40">{SITE_CONFIG.legalDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
