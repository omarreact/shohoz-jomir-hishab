import Link from "next/link";
import { MapPinOff } from "lucide-react";
import { FEATURE_ROUTES, FEATURE_LABELS } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-12 text-center sm:py-16">
      <div className="w-full max-w-xl rounded-3xl border border-[var(--border-color)] bg-white px-5 py-9 shadow-[var(--shadow-md)] sm:px-10 sm:py-12">
        <span className="landbd-icon-tile mx-auto h-14 w-14">
          <MapPinOff size={26} />
        </span>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-gold-text)]">৪০৪</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl">পেজ পাওয়া যায়নি</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
          আপনি যে ঠিকানায় গেছেন সেটি নেই বা সরানো হয়েছে। {SITE_CONFIG.name} এর মূল সেবাগুলো থেকে বেছে নিন।
        </p>
        <div className="mt-7 grid gap-2.5 sm:grid-cols-2">
          <Link
            href={FEATURE_ROUTES.home}
            className="landbd-primary-button inline-flex min-h-12 items-center justify-center px-5 text-sm font-extrabold no-underline"
          >
            হোমে যান
          </Link>
          <Link
            href={FEATURE_ROUTES.records}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-extrabold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]"
          >
            {FEATURE_LABELS.records.bn}
          </Link>
          <Link
            href={FEATURE_ROUTES.landMap}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-extrabold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]"
          >
            {FEATURE_LABELS.landMap.bn}
          </Link>
          <Link
            href={FEATURE_ROUTES.blog}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[var(--border-color)] bg-white px-5 text-sm font-extrabold text-[var(--foreground)] no-underline hover:bg-[var(--brand-gold-faint)]"
          >
            {FEATURE_LABELS.blog.bn}
          </Link>
        </div>
      </div>
    </main>
  );
}
