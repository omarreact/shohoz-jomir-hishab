import { Zap, ShieldCheck, Map, Smartphone } from "lucide-react";
import { t } from "@/src/locales";
import SectionHeader from "@/components/ui/SectionHeader";

const highlights = [
  {
    title: t.features.smartSearch.title,
    description: t.features.smartSearch.description,
    icon: <Zap size={24} className="text-[#f6c343]" />,
  },
  {
    title: t.features.gisIntel.title,
    description: t.features.gisIntel.description,
    icon: <Map size={24} className="text-[#f6c343]" />,
  },
  {
    title: t.features.unifiedData.title,
    description: t.features.unifiedData.description,
    icon: <ShieldCheck size={24} className="text-[#f6c343]" />,
  },
  {
    title: t.features.fastPerformance.title,
    description: t.features.fastPerformance.description,
    icon: <Smartphone size={24} className="text-[#f6c343]" />,
  },
];

export default function FeatureHighlightsSection() {
  return (
    <section className="py-20" style={{ backgroundColor: "var(--background)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <SectionHeader title={t.features.title} centered badge="HIGHLIGHTS" titleClassName="text-[#f6c343]" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          {highlights.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-5 p-6 xl:p-8 rounded-2xl border border-white/[0.08] hover:border-[#f6c343]/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{
                backgroundColor: "var(--card-bg-secondary)",
                animationDelay: `${idx * 0.1}s`,
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f6c343]/20 border border-[#f6c343]/30"
              >
                {item.icon}
              </div>
              <div>
                <h5 className="font-bold text-white text-lg mb-2">{item.title}</h5>
                <p className="text-[#b7bdc8] text-sm leading-relaxed m-0">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
