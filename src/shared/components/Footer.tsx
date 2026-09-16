import Image from "next/image";
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
    <footer className="mt-auto border-t border-[var(--border-color)] bg-white text-[var(--foreground)] print:hidden">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-7 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3 no-underline" aria-label="LandBD — হোম">
            <Image src="/brand/landbd-symbol.svg" width={44} height={44} alt="" aria-hidden className="h-11 w-11 shrink-0" />
            <div>
              <p className="m-0 text-base font-extrabold text-[#006A3D]">LandBD</p>
              <p className="mt-0.5 text-xs font-semibold text-[var(--muted-foreground)]">সহজ জমির হিসাব · ভূমি তথ্যের ডিজিটাল সহায়ক</p>
            </div>
          </Link>

          <nav aria-label="ফুটার লিংক" className="flex flex-wrap gap-x-4 gap-y-2">
            {LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-xs font-semibold text-[var(--muted-foreground)] no-underline transition-colors hover:text-[#006A3D]">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-[var(--border-color)] pt-4 text-[11px] leading-5 text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p className="m-0">© {currentYear} LandBD। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0">দাপ্তরিক সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন।</p>
        </div>
      </div>
    </footer>
  );
}
