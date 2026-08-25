import Link from "next/link";
import {
  Calculator,
  Ruler,
  Scale,
  Map,
  FileText,
  BookOpen,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { FEATURE_ROUTES, FEATURE_LABELS } from "@/src/shared/config/feature-routes";

type ToolCard = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

const TOOLS: ToolCard[] = [
  {
    href: FEATURE_ROUTES.records,
    title: FEATURE_LABELS.records.bn,
    description:
      "সিএস, এসএ, আরএস খতিয়ানের আনা-গন্ডা, শতাংশ ও কাঠা হিসাব করুন।",
    icon: Calculator,
    badge: "জনপ্রিয়",
  },
  {
    href: FEATURE_ROUTES.landMeasurement,
    title: FEATURE_LABELS.landMeasurement.bn,
    description: "স্কয়ার ফিট, শতাংশ, কাঠা ও একর একক রূপান্তর ও পরিমাপ।",
    icon: Ruler,
  },
  {
    href: FEATURE_ROUTES.inheritance,
    title: FEATURE_LABELS.inheritance.bn,
    description: "ইসলামি উত্তরাধিকার নিয়মে ওয়ারিশদের অংশ স্বয়ংক্রিয় বণ্টন।",
    icon: Scale,
  },
  {
    href: FEATURE_ROUTES.landMap,
    title: FEATURE_LABELS.landMap.bn,
    description: "RS ও MS মৌজা টাইল, প্লট ট্যাপ ও সীমানা দেখুন (পাবলিক)।",
    icon: Map,
    badge: "নতুন",
  },
  {
    href: FEATURE_ROUTES.documents,
    title: FEATURE_LABELS.documents.bn,
    description: "পর্চা ও সংশ্লিষ্ট দলিল সংক্রান্ত সহায়ক তথ্য।",
    icon: FileText,
  },
  {
    href: FEATURE_ROUTES.blog,
    title: FEATURE_LABELS.blog.bn,
    description: "ভূমি আইন, রেজিস্ট্রেশন ও ব্যবহারিক নির্দেশিকা।",
    icon: BookOpen,
  },
];

export default function ServicesSection() {
  return (
    <section
      id="tools"
      className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 md:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#006a4e]">
            টুলস
          </p>
          <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            একের ভেতর <span className="text-[#006a4e]">সব সমাধান</span>
          </h2>
          <p className="mx-auto max-w-2xl text-base text-slate-500 dark:text-slate-400 md:text-lg">
            খতিয়ান হিসাব থেকে মানচিত্র পর্যন্ত—প্রয়োজনীয় টুল বেছে নিয়ে এখনই
            শুরু করুন।
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="group relative flex h-full flex-col rounded-3xl border border-slate-200 bg-slate-50/80 p-6 no-underline shadow-sm transition hover:-translate-y-1 hover:border-[#006a4e]/35 hover:bg-white hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-900"
            >
              {tool.badge && (
                <span className="absolute right-4 top-4 rounded-full bg-[#006a4e]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#006a4e]">
                  {tool.badge}
                </span>
              )}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006a4e]/10 transition group-hover:scale-110">
                <tool.icon size={28} className="text-[#006a4e]" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
                {tool.title}
              </h3>
              <p className="mb-4 flex-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {tool.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-[#006a4e] transition group-hover:gap-2">
                খুলুন <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
