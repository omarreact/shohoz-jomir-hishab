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
  primary: "bg-[#006a4e]/10 text-[#006a4e]",
  success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  destructive: "bg-red-500/10 text-red-600 dark:text-red-400",
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
      <div className="h-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-300 overflow-hidden hover:shadow-lg hover:-translate-y-1 hover:border-[#006a4e]/30">
        <div className="p-4 sm:p-6 relative">
          {/* Ghost background icon */}
          <div className="absolute top-0 right-0 opacity-5 -translate-y-1/2 translate-x-1/2 pointer-events-none text-[#006a4e]">
            <Icon size={120} />
          </div>

          <div className="flex justify-between items-start mb-6 relative z-10">
            <div
              className="rounded-2xl bg-[#006a4e]/10 flex items-center justify-center transition-colors group-hover:bg-[#006a4e] group-hover:text-white text-[#006a4e]"
              style={{ width: 64, height: 64 }}
            >
              <Icon size={32} />
            </div>
            {badge && (
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-xs font-bold shadow-sm",
                  badgeColorMap[badgeColor] || badgeColorMap.success,
                )}
              >
                {badge}
              </span>
            )}
          </div>

          <h4 className="font-bold mb-3 text-slate-900 dark:text-white relative z-10 text-xl group-hover:text-[#006a4e] transition-colors">
            {title}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 mb-6 relative z-10 leading-relaxed line-clamp-2">
            {description}
          </p>

          <div className="inline-flex items-center font-bold text-[#006a4e] relative z-10 mt-auto group-hover:gap-3 transition-all">
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
