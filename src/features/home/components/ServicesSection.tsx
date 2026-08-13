import { Search, Map, FileText, Layout } from "lucide-react";
import { t } from "@/src/locales";

const services = [
  {
    id: "search",
    title: t.services.searchPlot.title,
    description: t.services.searchPlot.description,
    icon: <Search size={28} className="accent-text" />,
    delay: "0s",
  },
  {
    id: "records",
    title: t.services.landRecords.title,
    description: t.services.landRecords.description,
    icon: <FileText size={28} className="accent-text" />,
    delay: "100ms",
  },
  {
    id: "documents",
    title: t.services.documents.title,
    description: t.services.documents.description,
    icon: <Layout size={28} className="accent-text" />,
    delay: "200ms",
  },
  {
    id: "maps",
    title: t.services.surveyMaps.title,
    description: t.services.surveyMaps.description,
    icon: <Map size={28} className="accent-text" />,
    delay: "300ms",
  },
];

export default function ServicesSection() {
  return (
    <section id="features" className="py-24 surface-bg border-t border-c">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 fade-in visible">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            একের ভেতর <span className="accent-text">সব সমাধান</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            ভূমি সংক্রান্ত জটিল কাজগুলো এখন স্মার্ট প্রযুক্তির সাহায্যে মুহূর্তেই সমাধান করুন।
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div
              key={service.id}
              className="card-new fade-in visible text-center group"
              style={{ transitionDelay: service.delay }}
            >
              <div className="w-16 h-16 rounded-2xl accent-bg bg-opacity-20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">{service.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
