import { ArrowUpRight, BadgeInfo, Landmark, ShieldAlert } from "lucide-react";
import {
  GIS_COVERAGE_NOTE,
  OFFICIAL_LAND_HELPLINE,
  OFFICIAL_LAND_SERVICES,
  OFFICIAL_LAND_USE_CLASSES,
} from "../lib/officialLandSources";

export default function OfficialLandSourceDock({ detailed = false }: { detailed?: boolean }) {
  return (
    <section aria-label="বাংলাদেশ সরকারি ভূমি তথ্যসূত্র" className="rounded-[22px] border border-[#d9ded8] bg-white p-4 text-[#20393c] shadow-[0_6px_25px_rgba(16,42,42,.04)]">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#eaf1ed] text-[#19636b]"><Landmark size={19} /></span>
        <div>
          <h3 className="text-sm font-black">সরকারি ভূমি তথ্যসূত্র</h3>
          <p className="text-[11px] text-[#687c7c]">ভূমি মন্ত্রণালয় ও DLRS</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {OFFICIAL_LAND_SERVICES.map((service) => (
          <a key={service.id} href={service.href} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-2 rounded-xl border border-[#edf0ea] bg-[#fafbf8] px-3 py-2.5 transition hover:border-[#a7c3b8] hover:bg-[#eff5f0]">
            <span className="mt-0.5 min-w-0 flex-1">
              <span className="block text-xs font-bold">{service.title}</span>
              {detailed ? <span className="mt-0.5 block text-[11px] leading-4 text-[#627777]">{service.subtitle}</span> : null}
            </span>
            <ArrowUpRight size={14} className="mt-0.5 shrink-0 text-[#5f817f] transition group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>

      {detailed ? (
        <div className="mt-4 border-t border-[#e7ece6] pt-3">
          <div className="flex items-center gap-1.5 text-xs font-extrabold"><BadgeInfo size={15} /> সরকারি ভূমি ব্যবহারের শ্রেণি</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {OFFICIAL_LAND_USE_CLASSES.map((label) => (
              <span key={label} className="rounded-full border border-[#d5dfd8] bg-[#f4f7f2] px-2 py-1 text-[10px] font-semibold text-[#516a67]">{label}</span>
            ))}
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#667775]">এই শ্রেণিগুলো মন্ত্রণালয়ের ভূমি জোনিং প্রকল্পে বর্ণিত; নির্বাচিত দাগের প্রকৃত শ্রেণি নয়।</p>
        </div>
      ) : null}

      <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#fff2e5] px-3 py-2.5 text-[11px] leading-5 text-[#88502c]">
        <ShieldAlert size={16} className="mt-0.5 shrink-0" />
        <p>{GIS_COVERAGE_NOTE}</p>
      </div>
      <p className="mt-3 text-[11px] text-[#748482]">সরকারি ভূমিসেবা সহায়তা: <a href={`tel:${OFFICIAL_LAND_HELPLINE}`} className="font-extrabold text-[#21636b] underline">{OFFICIAL_LAND_HELPLINE}</a></p>
    </section>
  );
}
