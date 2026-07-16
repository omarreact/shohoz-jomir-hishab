interface SectionHeaderProps {
  eyebrow?: string;        // Small badge text above the heading
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  centered?: boolean;
  className?: string;
}

/**
 * Reusable Section Header — eyebrow badge, h2, and optional subtitle.
 * Eliminates repeated markup across all pages.
 */
export default function SectionHeader({
  title,
  subtitle,
  badge,
  icon,
  centered = false,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`mb-5 ${centered ? "text-center" : ""} ${className}`}>
      {badge && (
        <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-2 rounded-pill mb-3 fw-medium letter-spacing-wide">
          {badge}
        </span>
      )}
      <h2 className={`display-6 fw-bold text-body mb-3 d-flex align-items-center ${centered ? "justify-content-center" : ""}`}>
        {icon && <span className="me-3 text-primary">{icon}</span>}
        {title}
      </h2>
      {subtitle && (
        <p className={`lead text-muted max-w-2xl ${centered ? "mx-auto" : ""} mb-0`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
