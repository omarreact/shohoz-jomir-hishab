import Link from "next/link";
import { Calculator } from "lucide-react";

const LINKS = [
  { href: "/", label: "হোম" },
  { href: "/dlrms-khatian", label: "খতিয়ান" },
  { href: "/geospatial-map", label: "মানচিত্র" },
  { href: "/privacy", label: "গোপনীয়তা" },
  { href: "/terms", label: "শর্তাবলি" },
  { href: "/contact", label: "যোগাযোগ" },
] as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-white text-[var(--foreground)] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)] ring-1 ring-[color-mix(in_srgb,var(--brand-gold)_24%,transparent)]">
              <Calculator size={19} />
            </span>
            <div>
              <p className="m-0 text-sm font-extrabold text-slate-950">সহজ জমির হিসাব</p>
              <p className="mt-0.5 text-xs font-medium text-[var(--muted-foreground)]">LandBD · ভূমি তথ্য ও হিসাবের ডিজিটাল সহায়ক</p>
            </div>
          </div>

          <nav aria-label="ফুটার লিংক" className="flex flex-wrap gap-x-4 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--brand-gold-text)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4 text-[11px] leading-5 text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p className="m-0">© {currentYear} ল্যান্ডবিডি। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0">দাপ্তরিক সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
