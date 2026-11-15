import Link from "next/link";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";
import { toBanglaDigits } from "@/src/shared/i18n/bangla";

export default function MobileLegalFooter() {
  const year = toBanglaDigits(new Date().getFullYear());

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-5 text-[var(--muted-foreground)] md:hidden print:hidden">
      <nav
        aria-label="মোবাইল আইনগত লিংক"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      >
        <Link
          href={FEATURE_ROUTES.privacy}
          className="font-semibold no-underline hover:text-[var(--primary)]"
        >
          গোপনীয়তা
        </Link>
        <Link
          href={FEATURE_ROUTES.terms}
          className="font-semibold no-underline hover:text-[var(--primary)]"
        >
          শর্তাবলি
        </Link>
        <Link
          href={FEATURE_ROUTES.contact}
          className="font-semibold no-underline hover:text-[var(--primary)]"
        >
          যোগাযোগ
        </Link>
      </nav>
      <p className="mx-auto mt-3 max-w-xl text-center leading-7">
        {SITE_CONFIG.legalDisclaimer}
      </p>
      <p className="mt-2 text-center font-semibold">© {year} LandBD</p>
    </footer>
  );
}
