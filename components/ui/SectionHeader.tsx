interface SectionHeaderProps {
  eyebrow: string;        // Small badge text above the heading
  title: string;
  subtitle?: string;
  subtitleMaxWidth?: number;
  centered?: boolean;
}

/**
 * Reusable Section Header — eyebrow badge, h2, and optional subtitle.
 * Eliminates repeated markup across all pages.
 */
export default function SectionHeader({
  eyebrow,
  title,
  subtitle,
  subtitleMaxWidth = 600,
  centered = true,
}: SectionHeaderProps) {
  return (
    <div className={`mb-5 pb-2 pt-5 ${centered ? "text-center" : ""}`}>
      <span className="text-success fw-bold text-uppercase small bg-success bg-opacity-10 px-3 py-1 rounded-pill mb-3 d-inline-block">
        {eyebrow}
      </span>
      <h2 className="fw-bold text-dark display-6 mb-3">{title}</h2>
      {subtitle && (
        <p
          className={`text-secondary fs-6 ${centered ? "mx-auto" : ""}`}
          style={{ maxWidth: subtitleMaxWidth }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
