import { Zap, ShieldCheck, Map, Smartphone } from "lucide-react";
import { t } from "@/src/locales";
import { Card, CardBody } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

export default function FeatureHighlightsSection() {
  const highlights = [
    {
      title: t.features.smartSearch.title,
      description: t.features.smartSearch.description,
      icon: <Zap size={24} className="text-primary" />
    },
    {
      title: t.features.gisIntel.title,
      description: t.features.gisIntel.description,
      icon: <Map size={24} className="text-primary" />
    },
    {
      title: t.features.unifiedData.title,
      description: t.features.unifiedData.description,
      icon: <ShieldCheck size={24} className="text-primary" />
    },
    {
      title: t.features.fastPerformance.title,
      description: t.features.fastPerformance.description,
      icon: <Smartphone size={24} className="text-primary" />
    }
  ];

  return (
    <section className="py-5" style={{ backgroundColor: "var(--background)" }}>
      <div className="container py-4">
        <SectionHeader 
          title={t.features.title}
          centered={true}
          badge="HIGHLIGHTS"
        />

        <div className="row g-4 mt-2">
          {highlights.map((item, idx) => (
            <div key={idx} className="col-md-6 animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
              <Card hoverEffect variant="default" className="h-100 border-0" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                <CardBody className="d-flex gap-4 p-4 p-xl-5 align-items-center">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style={{ width: "60px", height: "60px" }}>
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="fw-bold text-white mb-2">{item.title}</h5>
                    <p className="text-secondary mb-0">{item.description}</p>
                  </div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
