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
 * A standardized, premium Hero Banner for LandBD 4.0.
 * Follows the Light/Dark hybrid theme.
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
    <section
      className="relative overflow-hidden hero-gradient border-b border-c"
      style={{ padding: "6rem 0" }}
    >
      {/* Decorative Glow */}
      <div
        className="absolute rounded-full opacity-10 dark:opacity-20 pointer-events-none"
        style={{
          top: "50%",
          left: isCenter ? "50%" : "20%",
          transform: "translate(-50%, -50%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Decorative Pattern */}
      {pattern === "dots" && (
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      )}
      {pattern === "grid" && (
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div
          className={`flex flex-wrap items-center gap-10 ${
            isCenter ? "justify-center text-center" : ""
          }`}
        >
          {/* Content */}
          <div
            className={`${illustration ? "flex-1 min-w-0 max-w-xl" : "w-full max-w-3xl"} ${
              isCenter ? "mx-auto" : ""
            } fade-in visible`}
          >
            {badge && (
              <div
                className={`mb-4 flex ${isCenter ? "justify-center" : "justify-start"}`}
              >
                <div className="inline-block bg-[var(--surface)] text-[var(--text-secondary)] px-4 py-2 rounded-full text-sm font-medium border border-c">
                  {badge}
                </div>
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight text-[var(--text-primary)]">
              {title}
            </h1>

            {subtitle && (
              <h3 className="text-xl text-[var(--text-primary)] font-medium mb-3">{subtitle}</h3>
            )}

            {description && (
              <div
                className={`text-[var(--text-secondary)] mb-8 text-lg leading-relaxed ${
                  isCenter ? "mx-auto" : ""
                }`}
                style={{ maxWidth: "600px" }}
              >
                {description}
              </div>
            )}

            {children && <div className="mb-8">{children}</div>}

            {actions && (
              <div
                className={`flex flex-wrap gap-3 ${
                  isCenter ? "justify-center" : "justify-start"
                }`}
              >
                {actions}
              </div>
            )}
          </div>

          {/* Illustration */}
          {illustration && (
            <div
              className="flex-1 min-w-0 max-w-xl fade-in visible"
              style={{ transitionDelay: "200ms" }}
            >
              <div className="relative">
                <div
                  className="absolute inset-0 rounded-full opacity-10 pointer-events-none"
                  style={{ background: "var(--accent)", filter: "blur(60px)" }}
                />
                <div className="relative z-10">{illustration}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
