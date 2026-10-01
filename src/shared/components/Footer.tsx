import Image from "next/image";
import Link from "next/link";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

const GROUPS = [
  {
    title: "রেকর্ড",
    links: [
      [FEATURE_ROUTES.dlrmsKhatian, "DLRMS খতিয়ান"],
      [FEATURE_ROUTES.records, "খতিয়ান হিসাব"],
      [FEATURE_ROUTES.settlementKhatian, "সেটেলমেন্ট খতিয়ান"],
      [FEATURE_ROUTES.history, "ইতিহাস"],
    ],
  },
  {
    title: "হিসাব",
    links: [
      [FEATURE_ROUTES.landMeasurement, "জমি পরিমাপ"],
      [FEATURE_ROUTES.inheritance, "ফারায়েজ"],
    ],
  },
  {
    title: "মানচিত্র",
    links: [
      [FEATURE_ROUTES.landMap, "RAJUK GIS"],
      [FEATURE_ROUTES.mouzaDownload, "মৌজা ম্যাপ"],
    ],
  },
  {
    title: "ডকুমেন্ট",
    links: [
      [FEATURE_ROUTES.documents, "পর্চা"],
      [FEATURE_ROUTES.mouzaPorchaReport, "মৌজা পর্চা রিপোর্ট"],
      [FEATURE_ROUTES.warishSanad, "ওয়ারিশ সনদ"],
    ],
  },
  {
    title: "গাইড",
    links: [
      [FEATURE_ROUTES.blog, "ব্লগ"],
      [FEATURE_ROUTES.faq, "প্রশ্নোত্তর"],
      [FEATURE_ROUTES.contact, "যোগাযোগ"],
      [FEATURE_ROUTES.privacy, "গোপনীয়তা"],
      [FEATURE_ROUTES.terms, "শর্তাবলি"],
    ],
  },
] as const;

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-[var(--border-color)] bg-white text-[var(--foreground)] print:hidden">
      <div className="mx-auto max-w-[1440px] px-4 py-9 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3 no-underline" aria-label="LandBD — হোম">
              <Image
                src="/brand/landbd-symbol.svg"
                width={48}
                height={48}
                alt=""
                aria-hidden
                className="h-12 w-12 shrink-0"
              />
              <div>
                <p className="m-0 text-lg font-black text-[var(--primary)]">LandBD</p>
                <p className="mt-0.5 text-xs font-bold text-[var(--muted-foreground)]">ভূমি তথ্য, হিসাব ও মানচিত্রের ডিজিটাল সহায়ক</p>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
              খতিয়ান, জমির হিসাব, GIS মানচিত্র ও ডকুমেন্ট ওয়ার্কস্পেস—একটি Bangla-first পণ্য অভিজ্ঞতায়।
            </p>
            <div className="mt-4 landbd-trust-note max-w-max">
              দাপ্তরিক সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
            {GROUPS.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--foreground)]">{group.title}</p>
                <div className="mt-3 grid gap-2.5">
                  {group.links.map(([href, label]) => (
                    <Link
                      key={href}
                      href={href}
                      className="text-xs font-semibold leading-5 text-[var(--muted-foreground)] no-underline transition-colors hover:text-[var(--primary)]"
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-[var(--border-color)] pt-5 text-[11px] leading-5 text-[var(--muted-foreground)] sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <p className="m-0">© {currentYear} LandBD। সর্বস্বত্ব সংরক্ষিত।</p>
          <p className="m-0 max-w-2xl sm:text-right">{SITE_CONFIG.legalDisclaimer}</p>
        </div>
      </div>
    </footer>
  );
}
