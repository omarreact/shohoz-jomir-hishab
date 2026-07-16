import Link from "next/link";
import { Map, ArrowRight } from "lucide-react";
import { t } from "@/src/locales";

export default function MapPreviewSection() {
  return (
    <section className="py-5" style={{ backgroundColor: "var(--slate-900)" }}>
      <div className="container py-4">
        <div className="row align-items-center g-5">
          <div className="col-lg-6 animate-slide-up">
            <h2 className="display-5 fw-bold text-white mb-4">
              {t.mapPreview.title}
            </h2>
            <p className="lead text-white text-opacity-75 mb-5">
              {t.mapPreview.subtitle}
            </p>
            <Link href="/dap-map" className="btn btn-primary rounded-pill px-5 py-3 fw-bold d-inline-flex align-items-center gap-2 shadow-sm hover-transform">
              <Map size={20} /> {t.mapPreview.cta} <ArrowRight size={18} />
            </Link>
          </div>
          <div className="col-lg-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="position-relative rounded-4 overflow-hidden shadow-lg border border-white border-opacity-10" style={{ height: "400px" }}>
              <div 
                className="position-absolute w-100 h-100" 
                style={{
                  backgroundImage: "url('https://images.unsplash.com/photo-1524813686514-a57563d77965?q=80&w=1200&auto=format&fit=crop')",
                  backgroundSize: "cover",
                  backgroundPosition: "center"
                }}
              />
              <div className="position-absolute w-100 h-100 top-0 start-0" style={{ background: "linear-gradient(135deg, rgba(246, 195, 67, 0.2) 0%, rgba(13, 17, 23, 0.9) 100%)" }} />
              
              <div className="position-absolute bottom-0 start-0 p-4 w-100">
                <div className="bg-dark bg-opacity-75 p-3 rounded-3 border border-white border-opacity-10 backdrop-blur d-inline-block">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-primary rounded-circle p-2">
                      <Map size={20} className="text-dark" />
                    </div>
                    <div>
                      <div className="text-white fw-bold">Live GIS Feed</div>
                      <div className="text-white text-opacity-75 small">Dhaka Metro Area</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
