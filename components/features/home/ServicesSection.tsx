import { Search, Map, FileText, Layout } from "lucide-react";
import { t } from "@/src/locales";
import { Card, CardBody } from "@/components/ui/Card";
import SectionHeader from "@/components/ui/SectionHeader";

export default function ServicesSection() {
  const services = [
    {
      id: "search",
      title: t.services.searchPlot.title,
      description: t.services.searchPlot.description,
      icon: <Search size={24} className="text-primary" />,
      delay: "0.1s"
    },
    {
      id: "records",
      title: t.services.landRecords.title,
      description: t.services.landRecords.description,
      icon: <FileText size={24} className="text-primary" />,
      delay: "0.2s"
    },
    {
      id: "documents",
      title: t.services.documents.title,
      description: t.services.documents.description,
      icon: <Layout size={24} className="text-primary" />,
      delay: "0.3s"
    },
    {
      id: "maps",
      title: t.services.surveyMaps.title,
      description: t.services.surveyMaps.description,
      icon: <Map size={24} className="text-primary" />,
      delay: "0.4s"
    }
  ];

  return (
    <section className="py-5" style={{ backgroundColor: "var(--background)" }}>
      <div className="container py-4">
        <SectionHeader 
          title={t.services.title}
          centered={true}
          badge="OUR SERVICES"
        />

        <div className="row g-4 mt-2">
          {services.map((service) => (
            <div key={service.id} className="col-12 col-md-6 col-lg-3 animate-slide-up" style={{ animationDelay: service.delay }}>
              <Card hoverEffect variant="default" className="h-100 text-center border-0" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                <CardBody className="d-flex flex-column align-items-center p-4 p-xl-5">
                  <div className="bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center mb-4 transition-all" style={{ width: "80px", height: "80px" }}>
                    {service.icon}
                  </div>
                  <h5 className="fw-bold text-white mb-3">{service.title}</h5>
                  <p className="text-secondary mb-0">{service.description}</p>
                </CardBody>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
