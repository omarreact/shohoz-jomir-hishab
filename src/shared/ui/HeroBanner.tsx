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

/** Shared LandBD page hero used across calculators, records, maps and content pages. */
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
    <section className="hero-gradient relative overflow-hidden border-b border-[var(--border-color)] bg-white print:hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[var(--brand-gold-soft)] opacity-60 blur-3xl sm:h-96 sm:w-96"
      />
      {pattern === "dots" ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, #946200 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      ) : null}

      {pattern === "grid" ? (
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              "linear-gradient(#946200 1px, transparent 1px), linear-gradient(90deg, #946200 1px, transparent 1px)",
            backgroundSize: "30px 30px",
          }}
        />
      ) : null}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-14">
        <div
          className={`flex flex-col items-stretch gap-7 lg:flex-row lg:items-center lg:gap-12 ${
            isCenter ? "justify-center text-center" : ""
          }`}
        >
          <div
            className={`${illustration ? "min-w-0 flex-1 lg:max-w-2xl" : "w-full max-w-3xl"} ${
              isCenter ? "mx-auto" : ""
            }`}
          >
            {badge ? (
              <div className={`mb-3 flex sm:mb-4 ${isCenter ? "justify-center" : "justify-start"}`}>
                <span className="landbd-section-kicker inline-flex items-center px-3 py-1.5 text-[11px] font-extrabold sm:text-xs">
                  {badge}
                </span>
              </div>
            ) : null}

            <h1 className="text-[clamp(1.85rem,7vw,3.25rem)] font-extrabold leading-[1.12] tracking-[-0.025em] text-[var(--foreground)]">
              {title}
            </h1>

            {subtitle ? (
              <h2 className="mt-3 text-base font-bold leading-7 text-[var(--brand-ink-soft)] sm:mt-4 sm:text-xl">
                {subtitle}
              </h2>
            ) : null}

            {description ? (
              <div
                className={`mt-3 max-w-2xl text-sm leading-7 text-[var(--muted-foreground)] sm:mt-4 sm:text-base ${
                  isCenter ? "mx-auto" : ""
                }`}
              >
                {description}
              </div>
            ) : null}

            {children ? <div className="mt-4 sm:mt-5">{children}</div> : null}

            {actions ? (
              <div className={`mt-5 flex flex-col gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:gap-3 ${isCenter ? "sm:justify-center" : "sm:justify-start"}`}>
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
