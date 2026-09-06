import React from "react";

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
 * Shared LandBD page hero.
 * Intentionally restrained: clear hierarchy, generous whitespace and minimal decoration.
 */
export default function HeroBanner({
  badge,
  title,
  subtitle,
  description,
  actions,
  illustration,
  pattern = "none",
  align = "left",
  children,
}: HeroBannerProps) {
  const isCenter = align === "center";

  return (
    <section className="hero-gradient relative overflow-hidden border-b border-[var(--border-color)] bg-[var(--card-bg)] print:hidden">
      {pattern === "dots" ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.025] dark:opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      ) : null}

      {pattern === "grid" ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.022] dark:opacity-[0.055]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div
          className={`flex flex-wrap items-center gap-8 lg:gap-12 ${
            isCenter ? "justify-center text-center" : ""
          }`}
        >
          <div
            className={`${illustration ? "min-w-0 flex-1 lg:max-w-2xl" : "w-full max-w-3xl"} ${
              isCenter ? "mx-auto" : ""
            }`}
          >
            {badge ? (
              <div className={`mb-4 flex ${isCenter ? "justify-center" : "justify-start"}`}>
                <span className="inline-flex items-center rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--muted-foreground)] shadow-sm">
                  {badge}
                </span>
              </div>
            ) : null}

            <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.12] tracking-[-0.025em] text-slate-950 dark:text-white">
              {title}
            </h1>

            {subtitle ? (
              <h3 className="mt-4 text-lg font-semibold text-slate-800 dark:text-slate-100 sm:text-xl">
                {subtitle}
              </h3>
            ) : null}

            {description ? (
              <div
                className={`mt-4 max-w-2xl text-[15px] leading-7 text-[var(--muted-foreground)] sm:text-base ${
                  isCenter ? "mx-auto" : ""
                }`}
              >
                {description}
              </div>
            ) : null}

            {children ? <div className="mt-5">{children}</div> : null}

            {actions ? (
              <div className={`mt-6 flex flex-wrap gap-3 ${isCenter ? "justify-center" : "justify-start"}`}>
                {actions}
              </div>
            ) : null}
          </div>

          {illustration ? (
            <div className="min-w-0 flex-1 lg:max-w-xl">
              <div className="relative">{illustration}</div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
