import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers3, MapPinned } from "lucide-react";

/** Scoped to /geospatial-map; other LandBD pages retain their independent header. */
export default function RajukStyleMapHeader() {
  return (
    <header className="flex h-[68px] w-full items-center justify-between gap-2 border-b-[3px] border-[#3b89cb] bg-[#082853] px-3 text-white shadow-[0_4px_14px_rgba(0,25,58,.24)] sm:px-5">
      <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" aria-label="LandBD হোম">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-white/25 bg-white/10"><MapPinned size={21} /></span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-[15px] font-black tracking-tight sm:text-lg">LandBD <span className="text-[#8bcaee]">GIS</span></span>
          <span className="block text-[9px] font-semibold tracking-wider text-[#c4d9ef] sm:text-[10px]">MASTER PLAN MAP</span>
        </span>
      </Link>
      <div className="hidden min-w-0 text-center md:block">
        <p className="text-sm font-black">ডিজিটাল ভূমি ও নগর পরিকল্পনা মানচিত্র</p>
        <p className="text-[10px] text-[#b5d5ed]">RS / MS প্লট • DAP স্তর • স্যাটেলাইট তুলনা</p>
      </div>
      <nav aria-label="অন্যান্য মানচিত্র সেবা" className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Link href="/mouza-map" className="inline-flex min-h-10 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 text-[11px] font-bold hover:bg-white/20 sm:px-3"><MapPinned size={15}/><span className="hidden sm:inline">মৌজা ম্যাপ</span></Link>
        <Link href="/rajuk-test" className="inline-flex min-h-10 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 text-[11px] font-bold hover:bg-white/20 sm:px-3"><Layers3 size={15}/><span className="hidden sm:inline">দাগ যাচাই</span></Link>
        <Link href="/dlrms-khatian" className="hidden min-h-10 items-center gap-1 rounded-md bg-[#e9f2fa] px-3 text-[11px] font-black text-[#103f70] hover:bg-white lg:inline-flex"><BookOpen size={15}/> খতিয়ান <ArrowUpRight size={13}/></Link>
      </nav>
    </header>
  );
}
