import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, MapPinned } from "lucide-react";
import { SITE_CONFIG } from "@/src/shared/config/site";

/** GIS keeps its compact map toolbar but uses the canonical LandBD white/green brand. */
export default function RajukStyleMapHeader() {
  return (
    <header className="h-[76px] w-full px-2 pt-2 text-[var(--foreground)] sm:px-3">
      <div className="flex h-[64px] w-full items-center justify-between gap-2 rounded-[14px] border border-[var(--border-color)] bg-[var(--card-bg)]/95 px-3 shadow-[0_10px_30px_rgba(11,45,30,.10)] backdrop-blur-xl sm:px-4">
        <Link
          href="/"
          className="flex min-w-0 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
          aria-label={SITE_CONFIG.name + " — হোম"}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--brand-green-faint)]">
            <Image src="/brand/logo-square.svg" alt="" width={40} height={40} className="h-10 w-10 object-contain" />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-extrabold tracking-tight text-[var(--foreground)] sm:text-[16px]">{SITE_CONFIG.name}</span>
            <span className="block text-[10px] font-semibold text-[var(--muted-foreground)]">{SITE_CONFIG.shortName} · GIS</span>
          </span>
        </Link>

        <div className="hidden min-w-0 text-center lg:block">
          <p className="text-[13px] font-extrabold text-[var(--foreground)]">ডিজিটাল ভূমি ও নগর পরিকল্পনা মানচিত্র</p>
          <p className="text-[10px] text-[var(--muted-foreground)]">RS কালো · MS লাল • DAP স্তর • স্যাটেলাইট তুলনা</p>
        </div>

        <nav aria-label="অন্যান্য মানচিত্র সেবা" className="flex min-w-0 items-center gap-1 sm:gap-2">
          <Link
            href="/mouza-map"
            aria-label="মৌজা ম্যাপ"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-2 text-[11px] font-bold text-[var(--primary)] transition hover:bg-[var(--brand-green-soft)] sm:px-3"
          >
            <MapPinned size={16} /><span className="hidden sm:inline">মৌজা ম্যাপ</span>
          </Link>
          <Link
            href="/dlrms-khatian"
            className="hidden min-h-10 items-center gap-1.5 rounded-xl border border-[var(--primary)] bg-[var(--primary)] px-3 text-[11px] font-extrabold text-white transition hover:bg-[var(--brand-gold-strong)] xl:inline-flex"
          >
            <BookOpen size={16} /> খতিয়ান <ArrowUpRight size={13} />
          </Link>
        </nav>
      </div>
    </header>
  );
}
