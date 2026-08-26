import Link from "next/link";
import { Calculator, Ruler, Scale, Map, FileText, ArrowRight, type LucideIcon } from "lucide-react";
import { FEATURE_ROUTES, FEATURE_LABELS } from "@/src/shared/config/feature-routes";

type ToolCard = {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  cta: string;
};

const TOOLS: ToolCard[] = [
  { href: FEATURE_ROUTES.records, title: FEATURE_LABELS.records.bn, description: "সিএস, এসএ, আরএস খতিয়ানের আনা-গন্ডা, শতাংশ ও কাঠা হিসাব করুন।", icon: Calculator, badge: "জনপ্রিয়", cta: "হিসাব করুন" },
  { href: FEATURE_ROUTES.landMeasurement, title: FEATURE_LABELS.landMeasurement.bn, description: "স্কয়ার ফিট, শতাংশ, কাঠা ও একর একক রূপান্তর ও পরিমাপ।", icon: Ruler, badge: "বিনামূল্যে", cta: "পরিমাপ করুন" },
  { href: FEATURE_ROUTES.inheritance, title: FEATURE_LABELS.inheritance.bn, description: "ইসলামি উত্তরাধিকার হিসাবের জন্য ওয়ারিশদের অংশ নির্ণয়ে সহায়তা।", icon: Scale, badge: "বিনামূল্যে", cta: "হিসাব করুন" },
  { href: FEATURE_ROUTES.landMap, title: "GIS মানচিত্র", description: "RS ও MS মৌজা, প্লট এবং উপলভ্য মানচিত্র স্তর দেখুন।", icon: Map, badge: "নতুন", cta: "মানচিত্র দেখুন" },
  { href: FEATURE_ROUTES.documents, title: FEATURE_LABELS.documents.bn, description: "পর্চা ও সংশ্লিষ্ট ভূমি তথ্য খোঁজার জন্য সহায়ক তথ্য।", icon: FileText, badge: "বিনামূল্যে", cta: "তথ্য দেখুন" },
];

export default function ServicesSection() {
  return (
    <section id="tools" className="border-t border-[var(--border-color)] bg-[var(--card-bg)] py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <p className="mb-2 text-sm font-bold text-[#1A6B3C]">প্রয়োজনীয় টুল</p>
          <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)] md:text-4xl">এক জায়গায় দরকারি ভূমি টুল</h2>
          <p className="mt-3 text-base leading-7 text-[var(--muted-foreground)] md:text-lg">আপনার কাজ অনুযায়ী টুল বেছে নিন এবং সরাসরি কাজ শুরু করুন।</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool) => (
            <Link key={tool.href} href={tool.href} className="group relative flex min-h-[260px] flex-col rounded-2xl border border-[var(--border-color)] bg-[var(--background)] p-6 no-underline shadow-sm transition hover:-translate-y-1 hover:border-[#1A6B3C]/35 hover:shadow-lg">
              <span className="absolute right-5 top-5 rounded-full bg-[#1A6B3C]/10 px-2.5 py-1 text-[11px] font-bold text-[#1A6B3C]">{tool.badge}</span>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#1A6B3C]/10 text-[#1A6B3C]"><tool.icon size={24} /></div>
              <h3 className="text-lg font-bold text-[var(--foreground)]">{tool.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-[var(--muted-foreground)]">{tool.description}</p>
              <span className="mt-5 inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1A6B3C] transition group-hover:gap-2.5">{tool.cta}<ArrowRight size={15} /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
