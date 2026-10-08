import { ChevronDown, HelpCircle } from "lucide-react";
import LatestBlogs from "@/src/shared/components/LatestBlogs";
import HeroBanner from "@/src/shared/ui/HeroBanner";

const FAQS = [
  {
    q: "এই ক্যালকুলেটর কি সম্পূর্ণ ফ্রি?",
    a: "হ্যাঁ, স্মার্ট খতিয়ান ক্যালকুলেটর সবার জন্য সম্পূর্ণ ফ্রি।",
  },
  {
    q: "আমার হিসাব করা ডাটা কি অন্য কেউ দেখতে পারবে?",
    a: "না, আপনার সব ডাটা আপনার নিজের মোবাইলে বা ব্রাউজারে সেভ থাকে। আমরা কোনো ডাটা সার্ভারে নিই না।",
  },
  {
    q: "ফারায়েজ হিসাবে যদি ভুল মনে হয়, তাহলে কী করবো?",
    a: "আমাদের সিস্টেমটি প্রচলিত আইনের ওপর ভিত্তি করে তৈরি। তবে জটিল ক্ষেত্রে আইনজীবীর পরামর্শ নিন।",
  },
] as const;

export default function FAQPage() {
  return (
    <div className="landbd-page">
      <HeroBanner
        badge="সহায়তা কেন্দ্র"
        title="সাধারণ জিজ্ঞাসা"
        description="LandBD-এর হিসাব, ডাটা ও ব্যবহার সম্পর্কে সাধারণ প্রশ্নের সংক্ষিপ্ত উত্তর দেখুন।"
        pattern="dots"
      />

      <main className="landbd-page-inner py-7 sm:py-10">
        <section className="mx-auto max-w-4xl">
          <div className="mb-5 flex items-center gap-3 sm:mb-6">
            <span className="landbd-icon-tile h-11 w-11 shrink-0">
              <HelpCircle size={21} />
            </span>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--foreground)] sm:text-2xl">প্রশ্ন ও উত্তর</h2>
              <p className="mt-0.5 text-sm text-[var(--muted-foreground)]">প্রশ্নে ট্যাপ বা ক্লিক করে উত্তর দেখুন।</p>
            </div>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, index) => (
              <details
                key={faq.q}
                className="group overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-[var(--shadow-sm)] open:border-[color-mix(in_srgb,var(--brand-gold)_28%,var(--border-color))]"
              >
                <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-4 py-3.5 text-sm font-extrabold text-[var(--foreground)] marker:hidden sm:px-5 sm:text-base [&::-webkit-details-marker]:hidden">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-gold-soft)] text-xs font-extrabold text-[var(--brand-gold-text)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1">{faq.q}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 text-[var(--muted-foreground)] transition-transform group-open:rotate-180" />
                </summary>
                <div className="border-t border-[var(--border-color)] bg-[#fcfcfd] px-4 py-4 text-sm leading-7 text-[var(--muted-foreground)] sm:px-5 sm:text-base">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-10 sm:mt-14">
          <LatestBlogs />
        </div>
      </main>
    </div>
  );
}
