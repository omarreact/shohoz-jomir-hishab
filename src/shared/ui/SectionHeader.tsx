interface SectionHeaderProps {
  eyebrow?: string;
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
  titleClassName = "",
}: SectionHeaderProps & { titleClassName?: string }) {
  return (
    <div className={`mb-10 ${centered ? "text-center" : ""} ${className}`}>
      {badge && (
        <span className="inline-block bg-[#f6c343]/10 text-[#f6c343] px-3 py-1.5 rounded-full mb-3 text-xs font-semibold uppercase tracking-widest border border-[#f6c343]/20">
          {badge}
        </span>
      )}
      <h2
        className={`text-3xl sm:text-4xl font-bold mb-3 flex items-center ${
          centered ? "justify-center" : ""
        } ${titleClassName || "text-white"}`}
      >
        {icon && <span className="mr-3 text-[#f6c343]">{icon}</span>}
        {title}
      </h2>
      {subtitle && (
        <p
          className={`text-[#b7bdc8] text-lg leading-relaxed ${centered ? "mx-auto" : ""} mb-0`}
          style={{ maxWidth: "600px" }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}
