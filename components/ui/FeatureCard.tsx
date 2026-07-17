import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
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
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-500",
  warning: "bg-amber-500/10 text-amber-500",
  destructive: "bg-destructive/10 text-destructive",
};

export default function FeatureCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  ctaLabel = "Explore",
  badgeColor = "success",
}: FeatureCardProps) {
  return (
    <Link href={href} className="no-underline h-full block group">
      <div className="h-full rounded-2xl border border-border bg-card transition-all duration-200 overflow-hidden hover:shadow-lg hover:-translate-y-1">
        <div className="p-4 sm:p-5 xl:p-6 relative">
          {/* Ghost background icon */}
          <div className="absolute top-0 right-0 opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none">
            <Icon size={120} />
          </div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div
              className="rounded-xl bg-emerald-500/10 flex items-center justify-center"
              style={{ width: 56, height: 56 }}
            >
              <Icon size={28} className="text-emerald-500" />
            </div>
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold shadow-sm",
                  badgeColorMap[badgeColor] || badgeColorMap.success,
                )}
              >
                {badge}
              </span>
            )}
          </div>

          <h4 className="font-bold mb-3 text-foreground relative z-10">
            {title}
          </h4>
          <p className="text-muted-foreground mb-4 relative z-10 leading-relaxed line-clamp-2">
            {description}
          </p>

          <div className="inline-flex items-center font-bold text-emerald-500 relative z-10 mt-auto group-hover:gap-3 transition-all">
            {ctaLabel}{" "}
            <ArrowRight
              size={18}
              className="ml-2 transition-transform group-hover:translate-x-1"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
