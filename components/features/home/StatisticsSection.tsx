import { Users, MapPin, Database, Activity } from "lucide-react";
import { t } from "@/src/locales";
import { Card, CardBody } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

export default function StatisticsSection() {
  const stats = [
    { label: t.stats.plots, value: "১,২৫,০০০+", icon: <MapPin size={28} className="text-primary mb-3" /> },
    { label: t.stats.districts, value: "৬৪", icon: <Activity size={28} className="text-primary mb-3" /> },
    { label: t.stats.mouzas, value: "১৫,০০০+", icon: <Database size={28} className="text-primary mb-3" /> },
    { label: t.stats.maps, value: "৩৫০+", icon: <Users size={28} className="text-primary mb-3" /> }
  ];

  return (
    <section className="py-5 border-top border-bottom" style={{ backgroundColor: "var(--background)" }}>
      <div className="container py-4">
        <SectionHeader 
          title={t.stats.title}
          centered={true}
        />
        <div className="row g-4 justify-content-center mt-2">
          {stats.map((stat, i) => (
            <div key={i} className="col-6 col-md-3 text-center animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <Card hoverEffect variant="flat" className="h-100 bg-transparent border-0">
                <CardBody className="p-4 rounded-4" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                  {stat.icon}
                  <h2 className="display-6 fw-bold text-white mb-2">{stat.value}</h2>
                  <div className="text-secondary fw-medium fs-5">{stat.label}</div>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
