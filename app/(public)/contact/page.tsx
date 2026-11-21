import Link from "next/link";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";
import { SITE_CONFIG } from "@/src/shared/config/site";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

export default function ContactPage() {
  return (
    <>
      <HeroBanner
        align="center"
        badge="যোগাযোগ"
        title={
          <>
            আমাদের সাথে <span className="text-[var(--primary)]">যোগাযোগ করুন</span>
          </>
        }
        description={`${SITE_CONFIG.name} সেবা, মানচিত্র বা ব্লগ সম্পর্কে প্রশ্ন থাকলে নিচের মাধ্যমে জানান।`}
        pattern="none"
      />

      <div className="landbd-service-workspace max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid gap-6 sm:grid-cols-2">
          <a
            href={`mailto:${SITE_CONFIG.contactEmail}`}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 no-underline hover:border-[#006a4e]/40 transition-colors"
          >
            <Mail className="text-[var(--primary)] mb-3" size={28} />
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">ইমেইল</h2>
            <p className="text-sm text-[var(--muted-foreground)] m-0">{SITE_CONFIG.contactEmail}</p>
          </a>
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
            <MessageCircle className="text-[var(--primary)] mb-3" size={28} />
            <h2 className="text-lg font-bold text-[var(--foreground)] mb-1">সেবা সহায়তা</h2>
            <p className="text-sm text-[var(--muted-foreground)] m-0">
              খতিয়ান, ফারায়েজ বা মানচিত্র টুল ব্যবহারের প্রশ্ন — FAQ ও ব্লগ দেখুন।
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={FEATURE_ROUTES.faq}
                className="text-sm font-bold text-[var(--primary)] no-underline"
              >
                প্রশ্নোত্তর →
              </Link>
              <Link
                href={FEATURE_ROUTES.blog}
                className="text-sm font-bold text-[var(--primary)] no-underline"
              >
                ব্লগ →
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
          <div className="flex gap-3">
            <MapPin className="text-amber-600 shrink-0" size={22} />
            <div>
              <h3 className="font-bold text-[var(--foreground)] mb-2">গুরুত্বপূর্ণ</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 m-0 leading-relaxed">
                {SITE_CONFIG.legalDisclaimer} সরকারি নামজারি, রেজিস্ট্রি বা সার্টিফাইড কপির জন্য
                সংশ্লিষ্ট ভূমি অফিস / land.gov.bd ব্যবহার করুন।
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
