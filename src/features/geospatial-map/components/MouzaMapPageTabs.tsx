"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookMarked, Compass, FileDown, FileWarning, Landmark, Layers3, MapPinned, ShieldCheck } from "lucide-react";
import AtlasWorkspaceHeader from "./AtlasWorkspaceHeader";
import OfficialLandSourceDock from "./OfficialLandSourceDock";
import MouzaMapClient from "./MouzaMapClient";
import MouzaMapViewer from "@/src/features/mouza-map/MouzaMapViewer";
import { GIS_COVERAGE_NOTE, LAND_SURVEY_LABELS, LEGAL_SURVEY_NOTE } from "../lib/officialLandSources";

type Mode = "workspace" | "sources" | "demo";

export default function MouzaMapPageTabs({ demoBrowserEnabled }: { demoBrowserEnabled: boolean }) {
  const [mode, setMode] = useState<Mode>("workspace");

  return (
    <main className="min-h-screen bg-[#f5f3ec] font-sans text-[#223e42]">
      <AtlasWorkspaceHeader active="mouza" />

      <section className="relative isolate overflow-hidden border-b border-[#e4e3d9] bg-[#e7eee8]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[.24]" style={{ backgroundImage:"linear-gradient(#b7cbbd 1px,transparent 1px),linear-gradient(90deg,#b7cbbd 1px,transparent 1px)",backgroundSize:"34px 34px" }}/>
        <div className="relative mx-auto grid max-w-[1400px] items-end gap-5 px-4 pb-9 pt-10 sm:px-8 md:grid-cols-[1fr_280px] md:py-14">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#bdd3c6] bg-white/80 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[.12em] text-[#28636b]"><MapPinned size={14}/> Bangladesh · cadastral workspace</p>
            <h1 className="max-w-[720px] text-4xl font-black leading-[1.16] tracking-[-.05em] text-[#183c41] sm:text-5xl">মৌজা নকশা <span className="text-[#bc7651]">থেকে</span><br/>জমির তথ্য পর্যন্ত।</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#57706b]">প্রাপ্য RAJUK জরিপ ডেটা দিয়ে কভারেজ ও সার্ভে বেছে মৌজা ম্যাপ তালিকা ব্রাউজ করুন, অন-ডিমান্ড প্রিভিউ দেখুন, GIS শেয়ার কপি ডাউনলোড করুন এবং সরকারি DLRS/Settlement PDF উৎস যাচাই করুন।</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/geospatial-map" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#1e5860] px-5 text-sm font-extrabold text-white transition hover:bg-[#183d43]"><Compass size={17}/> পূর্ণ GIS ম্যাপ <ArrowUpRight size={15}/></Link>
              <Link href="/dlrms-khatian" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#b7cbc0] bg-white/90 px-5 text-sm font-extrabold text-[#295e62]"><BookMarked size={17}/> খতিয়ান অনুসন্ধান</Link>
            </div>
          </div>
          <div className="rounded-[25px] border border-[#bad0c4] bg-white/90 p-5 shadow-[0_15px_38px_rgba(28,70,59,.08)]">
            <p className="text-[10px] font-black tracking-[.17em] text-[#ca7950]">SOURCE PROVENANCE</p>
            <div className="mt-3 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e3eee9] text-[#235f66]"><ShieldCheck size={23}/></span><div><p className="text-sm font-black">তথ্যের উৎস আগে</p><p className="text-[11px] text-[#687b72]">Record, map & survey এক নয়</p></div></div>
            <p className="mt-3 text-xs leading-6 text-[#607772]">{GIS_COVERAGE_NOTE}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1400px] px-3 pb-14 pt-7 sm:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce3d9] pb-5">
          <div className="flex flex-wrap gap-2" role="group" aria-label="মৌজা ম্যাপ ও সূত্র">
            {([
              { id: "workspace", label: "মৌজা ম্যাপ তৈরি", Icon: Layers3 },
              { id: "sources", label: "সরকারি তথ্যসূত্র", Icon: Landmark },
              ...(demoBrowserEnabled ? [{ id: "demo", label: "নমুনা PDF (ডেভ)", Icon: FileWarning }] : []),
            ] as const).map(({id,label,Icon}) => (
              <button type="button" key={id} onClick={()=>setMode(id as Mode)} aria-pressed={mode===id} className={["inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-xs font-extrabold transition",mode===id?"bg-[#1f555b] text-white shadow-sm":"border border-[#dce3d9] bg-white text-[#58716b] hover:border-[#a6bfb2]"].join(" ")}><Icon size={16}/>{label}</button>
            ))}
          </div>
          <span className="text-[11px] font-semibold text-[#85918a]">GIS preview ≠ প্রত্যয়িত দলিল</span>
        </div>

        {mode==="demo" && demoBrowserEnabled ? (
          <div className="rounded-[26px] bg-white p-4 shadow-sm"><p className="mb-3 rounded-xl bg-[#ffede0] px-4 py-3 text-xs font-bold text-[#925a3c]">নমুনা PDF: শুধুমাত্র ডেভেলপমেন্ট টেস্ট ডেটা; সরকারি দলিল নয়।</p><MouzaMapViewer /></div>
        ) : mode==="sources" ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="rounded-[26px] border border-[#dce3d9] bg-white p-6 sm:p-8">
              <span className="text-[11px] font-black tracking-[.14em] text-[#ba7851]">GOVERNMENT DIRECTORY</span>
              <h2 className="mt-2 text-2xl font-black">সরকারি নকশা ও খতিয়ান সেবা</h2>
              <p className="mt-3 text-sm leading-7 text-[#657970]">ভূমি মন্ত্রণালয়ের জাতীয় ভূমি জোনিং প্রকল্পে বিভাগ, জেলা, উপজেলা, মৌজা, শিট ও প্লট বাছাই করা যায়। জোনিং প্রকল্পের কাজ চলমান — সব জায়গার রেকর্ড অনলাইনে পাওয়া যাবে এমন নিশ্চয়তা নেই।</p>
              <h3 className="mt-7 text-sm font-black">প্রচলিত জরিপের নাম</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">{LAND_SURVEY_LABELS.map((survey)=><div key={survey.code} className="flex items-center gap-3 rounded-2xl border border-[#e0e6df] bg-[#f8faf7] p-3"><span className="grid h-10 w-14 place-items-center rounded-xl bg-[#e6eee8] text-xs font-black text-[#2b6063]">{survey.code}</span><span className="text-xs font-bold text-[#5b716c]">{survey.name}</span></div>)}</div>
              <p className="mt-6 rounded-xl bg-[#fff0e6] p-4 text-xs leading-6 text-[#8f5839]">{LEGAL_SURVEY_NOTE}</p>
            </div>
            <OfficialLandSourceDock detailed />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_326px]">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5efea] text-[#22616b]"><FileDown size={19}/></span><div><h2 className="text-xl font-black">ডেটা-ভিত্তিক ম্যাপ ও ডাউনলোড</h2><p className="text-xs text-[#6b8279]">নির্বাচিত মৌজা ছাড়া কোনো নমুনা তথ্য দেখানো হবে না</p></div></div>
              <MouzaMapClient />
            </div>
            <div className="space-y-5">
              <OfficialLandSourceDock />
              <div className="rounded-[24px] border border-[#dfe4d9] bg-white p-5">
                <h3 className="text-sm font-black">GIS প্রক্রিয়া</h3>
                <div className="mt-4 space-y-4">
                  {[
                    ["01","কভারেজ ও সার্ভে","ঢাকা coverage → RS / MS → জেলা → উপজেলা"],
                    ["02","ম্যাপ তালিকা ও প্রিভিউ","মৌজা / JL বেছে অন-ডিমান্ড GIS প্রিভিউ"],
                    ["03","ডাউনলোড ও উৎস","Visitor PNG · Admin Vector PDF · সরকারি DLRS যাচাই"],
                  ].map(([no,title,detail])=>(
                    <div key={no} className="flex gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f1e9d9] text-xs font-black text-[#aa7149]">{no}</span><div><p className="text-xs font-black">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#718079]">{detail}</p></div></div>
                  ))}
                </div>
              </div>
              <a href="https://map.settlement.gov.bd/" target="_blank" rel="noopener noreferrer" className="flex min-h-12 items-center justify-between rounded-2xl border border-[#c4d8cb] bg-[#e7f0e9] px-4 text-xs font-black text-[#27646a]">সরকারি মৌজা নকশা কিনুন / যাচাই করুন <ArrowUpRight size={17}/></a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
