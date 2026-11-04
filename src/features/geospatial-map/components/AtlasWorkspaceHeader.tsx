import Link from "next/link";
import { ArrowUpRight, BookOpenText, Compass, Files, MapPinned, ShieldCheck } from "lucide-react";

export type AtlasPage = "map" | "mouza" | "rajuk";

const NAV = [
  { id: "map", label: "GIS এটলাস", href: "/geospatial-map", Icon: Compass },
  { id: "mouza", label: "মৌজা ম্যাপ", href: "/mouza-map", Icon: MapPinned },
  { id: "rajuk", label: "দাগ অনুসন্ধান", href: "/rajuk-test", Icon: Files },
] as const;

export default function AtlasWorkspaceHeader({ active, compact = false }: { active: AtlasPage; compact?: boolean }) {
  return (
    <header className="relative z-[70] w-full border-b border-[#d7d4c9] bg-[#fcfaf5] text-[#193538] shadow-[0_6px_25px_rgba(18,39,41,.07)]">
      <div className={`mx-auto flex min-h-[68px] w-full items-center gap-3 px-3 sm:px-5 ${compact ? "" : "max-w-[1680px]"}`}>
        <Link href="/" className="group flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-[#d97649]" aria-label="LandBD হোম">
          <span className="grid h-10 w-10 place-items-center rounded-[13px] bg-[#173b40] text-[#f6cb7d] shadow-[inset_0_0_0_1px_rgba(255,255,255,.12)]">
            <BookOpenText size={21} />
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-black tracking-[-.04em]">LANDBD<span className="ml-1 text-[#c26d47]">/</span>ATLAS</span>
            <span className="block text-[10px] font-semibold tracking-[.12em] text-[#637879]">LAND RECORD WORKSPACE</span>
          </span>
        </Link>

        <nav aria-label="মানচিত্র সেবা" className="mx-auto flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] sm:gap-2">
          {NAV.map(({ id, label, href, Icon }) => (
            <Link
              key={id}
              href={href}
              aria-current={active === id ? "page" : undefined}
              className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold transition sm:px-4 sm:text-sm ${active === id ? "bg-[#193d43] text-white shadow-sm" : "text-[#58696a] hover:bg-[#ece9de] hover:text-[#173b40]"}`}
            >
              <Icon size={15} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <Link href="/dlrms-khatian" className="hidden min-h-10 shrink-0 items-center gap-2 rounded-full border border-[#b8c8c4] bg-white px-4 text-xs font-extrabold text-[#1b565b] transition hover:bg-[#e9f0ec] md:inline-flex">
          <ShieldCheck size={16} /> খতিয়ান যাচাই <ArrowUpRight size={15} />
        </Link>
      </div>
    </header>
  );
}
