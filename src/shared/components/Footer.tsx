import Link from "next/link";

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
    <footer className="mt-auto border-t border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="m-0 text-sm font-bold text-slate-950 dark:text-white">সহজ জমির হিসাব · ল্যান্ডবিডি</p>
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">ভূমি তথ্য ও হিসাবের ডিজিটাল সহায়ক</p>
          </div>

          <nav aria-label="ফুটার লিংক" className="flex flex-wrap gap-x-4 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-[var(--muted-foreground)] no-underline transition hover:text-[#17663A] dark:hover:text-[#54A878]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-1 border-t border-[var(--border-color)] pt-4 text-xs text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between">
          <p className="m-0">© {currentYear} ল্যান্ডবিডি। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0">দাপ্তরিক সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
