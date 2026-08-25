import Link from "next/link";
import { Mail, MessageCircle, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

export default function ContactSection() {
  return (
    <section className="border-t border-slate-200 bg-white py-16 dark:border-slate-800 dark:bg-slate-950 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 md:p-12">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#006a4e]/10">
            <MessageCircle size={28} className="text-[#006a4e]" />
          </div>
          <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            সাহায্য দরকার?{" "}
            <span className="text-[#006a4e]">যোগাযোগ করুন</span>
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-400">
            টুল বা সাইট সংক্রান্ত প্রশ্ন, পরামর্শ বা সমস্যার জন্য ইমেইল করুন। আমরা
            যত দ্রুত সম্ভব উত্তর দেওয়ার চেষ্টা করি।
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href={`mailto:${SITE_CONFIG.contactEmail}`}
              className="inline-flex items-center gap-2 rounded-full bg-[#006a4e] px-6 py-3.5 text-sm font-bold text-white no-underline shadow-md transition hover:bg-[#005a42]"
            >
              <Mail size={16} />
              {SITE_CONFIG.contactEmail}
            </a>
            <Link
              href={FEATURE_ROUTES.contact}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-900 no-underline transition hover:border-[#006a4e]/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              যোগাযোগ পৃষ্ঠা
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
