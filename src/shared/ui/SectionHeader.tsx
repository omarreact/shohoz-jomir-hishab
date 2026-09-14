interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  centered?: boolean;
  className?: string;
  titleClassName?: string;
}

/** Shared section heading used across public and admin surfaces. */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  badge,
  icon,
  centered = false,
  className = "",
  titleClassName = "",
}: SectionHeaderProps) {
  const kicker = badge || eyebrow;

  return (
    <div className={`mb-6 sm:mb-8 ${centered ? "text-center" : ""} ${className}`}>
      {kicker ? (
        <span className="landbd-section-kicker inline-flex items-center px-3 py-1.5 text-[11px] font-extrabold tracking-wide sm:text-xs">
          {kicker}
        </span>
      ) : null}

      <h2
        className={`mt-2.5 flex items-center gap-2.5 text-2xl font-extrabold leading-tight tracking-[-0.02em] text-[var(--foreground)] sm:text-3xl ${
          centered ? "justify-center" : ""
        } ${titleClassName}`}
      >
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]">
            {icon}
          </span>
        ) : null}
        <span>{title}</span>
      </h2>

      {subtitle ? (
        <p
          className={`mt-2 max-w-2xl text-sm leading-6 text-[var(--muted-foreground)] sm:text-base sm:leading-7 ${
            centered ? "mx-auto" : ""
          }`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
