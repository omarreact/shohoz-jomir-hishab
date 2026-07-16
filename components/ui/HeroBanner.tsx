import React from "react";
import { Badge } from "./Badge";

interface HeroBannerProps {
  badge?: string;
  title: React.ReactNode;
  subtitle?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  illustration?: React.ReactNode;
  pattern?: "dots" | "grid" | "none";
  align?: "left" | "center";
  children?: React.ReactNode;
}

/**
 * A standardized, premium Hero Banner for LandBD 3.2.
 * Enforces a global dark aesthetic with golden glowing accents, glassmorphism,
 * and decorative background patterns.
 */
export default function HeroBanner({
  badge,
  title,
  subtitle,
  description,
  actions,
  illustration,
  pattern = "dots",
  align = "left",
  children,
}: HeroBannerProps) {
  const isCenter = align === "center";

  return (
    <section className="position-relative overflow-hidden" style={{ padding: "6rem 0", backgroundColor: "var(--background)" }}>
      {/* Decorative Glow */}
      <div 
        className="position-absolute translate-middle rounded-circle blur-effect opacity-25" 
        style={{ 
          top: "50%", 
          left: isCenter ? "50%" : "20%", 
          width: "600px", 
          height: "600px", 
          background: "radial-gradient(circle, rgba(246, 195, 67, 0.4) 0%, transparent 70%)"
        }} 
      />

      {/* Decorative Pattern */}
      {pattern === "dots" && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 opacity-25 blur-effect"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      )}
      {pattern === "grid" && (
        <div
          className="position-absolute top-0 start-0 w-100 h-100 opacity-25 blur-effect"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      <div className="container position-relative z-1">
        <div className={`row align-items-center ${isCenter ? "justify-content-center text-center" : ""}`}>
          <div className={`${illustration ? "col-lg-6" : "col-lg-8"} ${isCenter ? "mx-auto" : ""}`}>
            <div className="animate-slide-up">
              {badge && (
                <div className={`mb-4 d-flex ${isCenter ? "justify-content-center" : "justify-content-start"}`}>
                  <Badge variant="primary" pill size="sm" className="px-3 py-2 text-uppercase letter-spacing-wide border border-primary border-opacity-50">
                    {badge}
                  </Badge>
                </div>
              )}
              
              <h1 className="display-4 fw-bold mb-3 lh-sm text-body text-balance">
                {title}
              </h1>
              
              {subtitle && (
                <h3 className="h4 text-primary fw-medium mb-3">
                  {subtitle}
                </h3>
              )}
              
              {description && (
                <div className={`lead text-muted mb-5 max-w-2xl ${isCenter ? "mx-auto" : ""}`} style={{ fontSize: "1.15rem", lineHeight: 1.8 }}>
                  {description}
                </div>
              )}
              
              {children && (
                <div className="mb-5">
                  {children}
                </div>
              )}
              
              {actions && (
                <div className={`d-flex flex-wrap gap-3 ${isCenter ? "justify-content-center" : "justify-content-start"}`}>
                  {actions}
                </div>
              )}
            </div>
          </div>

          {illustration && (
            <div className="col-lg-6 mt-5 mt-lg-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="position-relative">
                {/* Optional glass backing for illustrations */}
                <div className="position-absolute top-50 start-50 translate-middle w-100 h-100 bg-primary bg-opacity-10 rounded-circle blur-effect" style={{ filter: "blur(60px)" }} />
                <div className="position-relative z-1">
                  {illustration}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
