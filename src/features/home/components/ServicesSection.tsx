import { Search, Map, FileText, Layout } from "lucide-react";
import { t } from "@/src/locales";

const services = [
  {
    id: "search",
    title: t.services.searchPlot.title,
    description: t.services.searchPlot.description,
    icon: Search,
    delay: "0s",
  },
  {
    id: "records",
    title: t.services.landRecords.title,
    description: t.services.landRecords.description,
    icon: FileText,
    delay: "100ms",
  },
  {
    id: "documents",
    title: t.services.documents.title,
    description: t.services.documents.description,
    icon: Layout,
    delay: "200ms",
  },
  {
    id: "maps",
    title: t.services.surveyMaps.title,
    description: t.services.surveyMaps.description,
    icon: Map,
    delay: "300ms",
  },
];

export default function ServicesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 fade-in visible">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            একের ভেতর <span className="text-[#006a4e]">সব সমাধান</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto text-lg">
            ভূমি সংক্রান্ত জটিল কাজগুলো এখন স্মার্ট প্রযুক্তির সাহায্যে মুহূর্তেই সমাধান করুন।
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className="bg-white dark:bg-slate-900 h-full border-0 shadow-sm rounded-3xl transition-all hover:shadow-lg overflow-hidden fade-in visible group relative"
              style={{ transitionDelay: service.delay }}
            >
              <div className="p-6 md:p-8 relative">
                {/* Ghost background icon */}
                <div
                  className="absolute top-0 right-0 opacity-[0.03] dark:opacity-10 -translate-y-4 -mr-4 pointer-events-none"
                >
                  <service.icon size={120} className="text-[#006a4e]" />
                </div>

                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div
                    className="bg-[#006a4e]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"
                    style={{ width: 65, height: 65 }}
                  >
                    <service.icon size={32} className="text-[#006a4e]" />
                  </div>
                </div>

                <h4 className="font-bold mb-3 text-slate-900 dark:text-white text-xl relative z-10">{service.title}</h4>
                <p className="text-slate-500 dark:text-slate-400 mb-0 relative z-10 leading-loose text-sm">{service.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
