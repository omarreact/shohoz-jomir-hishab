import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  Icon: LucideIcon;
  ctaLabel?: string;
}

/**
 * Reusable Feature Card — used on the homepage grid and any feature listing.
 * Renders a card with an icon, badge, title, description, and CTA arrow link.
 */
export default function FeatureCard({
  href,
  title,
  description,
  badge,
  badgeColor = "success",
  Icon,
  ctaLabel = "হিসাব শুরু করুন",
}: FeatureCardProps) {
  return (
    <Link href={href} className="text-decoration-none h-100 d-block">
      <div className="card h-100 border-0 shadow-sm rounded-4 transition-all hover-shadow bg-white overflow-hidden">
        <div className="card-body p-4 p-xl-5 position-relative">
          {/* Ghost background icon */}
          <div
            className="position-absolute top-0 end-0 opacity-10 translate-middle-y me-n4 mt-4"
            style={{ pointerEvents: "none" }}
          >
            <Icon size={120} className="text-success" />
          </div>

          <div className="d-flex justify-content-between align-items-start mb-4 position-relative z-1">
            <div
              className="bg-success bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center"
              style={{ width: 65, height: 65 }}
            >
              <Icon size={32} className="text-success" />
            </div>
            {badge && (
              <span
                className={`badge bg-${badgeColor} rounded-pill px-3 py-2 fw-bold shadow-sm d-flex align-items-center`}
              >
                {badge === "New" && <Sparkles size={14} className="me-1" />}
                {badge}
              </span>
            )}
          </div>

          <h4 className="fw-bold mb-3 text-dark position-relative z-1">{title}</h4>
          <p className="text-secondary mb-4 position-relative z-1 lh-lg">{description}</p>

          <div className="d-inline-flex align-items-center fw-bold text-success position-relative z-1 mt-auto">
            {ctaLabel} <ArrowRight size={18} className="ms-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}
