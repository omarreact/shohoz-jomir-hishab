import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/src/shared/utils";
import type { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  ctaLabel?: string;
  badgeColor?: "primary" | "success" | "warning" | "destructive" | string;
}

const badgeColorMap: Record<string, string> = {
  primary: "bg-[var(--brand-gold-soft)] text-[var(--brand-gold-text)]",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
  destructive: "bg-red-50 text-red-700",
};

export default function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  ctaLabel = "দেখুন",
  badgeColor = "primary",
}: FeatureCardProps) {
  return (
    <Link href={href} className="group block h-full no-underline">
      <article className="relative flex h-full min-h-[12rem] flex-col overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white p-5 shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-gold)_30%,var(--border-color))] hover:shadow-[var(--shadow-md)] sm:p-6">
        <div className="pointer-events-none absolute -right-8 -top-10 text-[var(--brand-gold)] opacity-[0.045]">
          <Icon size={132} />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-3">
          <span className="landbd-icon-tile h-12 w-12 shrink-0 sm:h-14 sm:w-14">
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>

          {badge ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold sm:text-xs",
                badgeColorMap[badgeColor] || badgeColorMap.primary,
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>

        <div className="relative z-10 mt-5 flex-1">
          <h3 className="text-lg font-extrabold leading-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--brand-gold-text)] sm:text-xl">
            {title}
          </h3>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--muted-foreground)]">
            {description}
          </p>
        </div>

        <span className="relative z-10 mt-5 inline-flex items-center gap-1.5 text-sm font-extrabold text-[var(--brand-gold-text)]">
          {ctaLabel}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </article>
    </Link>
  );
}
