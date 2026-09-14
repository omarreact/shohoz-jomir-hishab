import { ShieldCheck } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";

const SECTIONS = [
  {
    title: "১. তথ্য সংগ্রহ",
    body: "আমরা আমাদের ব্যবহারকারীদের কোনো ব্যক্তিগত তথ্য (যেমন- নাম, ফোন নম্বর, ঠিকানা) সার্ভারে সংরক্ষণ করি না। আপনার করা সকল হিসাব আপনার ব্রাউজারেই (Local Storage) সেভ থাকে।",
  },
  {
    title: "২. কুকিজ (Cookies) ও বিজ্ঞাপন",
    body: "গুগল অ্যাডসেন্স বা অন্যান্য থার্ড-পার্টি বিজ্ঞাপনদাতারা ব্যবহারকারীর পছন্দ অনুযায়ী বিজ্ঞাপন দেখানোর জন্য কুকিজ ব্যবহার করতে পারে।",
  },
  {
    title: "৩. থার্ড-পার্টি লিংক",
    body: "আমাদের ওয়েবসাইটে অন্যান্য ওয়েবসাইটের লিংক থাকতে পারে। ওই ওয়েবসাইটগুলোর প্রাইভেসি পলিসির দায়ভার আমাদের নয়।",
  },
] as const;

export default function PrivacyPolicy() {
  return (
    <div className="landbd-page">
      <HeroBanner
        badge="তথ্য ও নীতিমালা"
        title="গোপনীয়তা নীতি"
        description="LandBD ব্যবহারের সময় তথ্য, কুকিজ এবং তৃতীয় পক্ষের লিংক সম্পর্কে বর্তমান নীতিমালা দেখুন।"
        pattern="dots"
      />

      <main className="landbd-page-inner py-7 sm:py-10">
        <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--brand-gold-faint)] px-4 py-4 sm:px-6 sm:py-5">
            <span className="landbd-icon-tile h-11 w-11 shrink-0">
              <ShieldCheck size={21} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold text-[var(--foreground)] sm:text-xl">প্রাইভেসি পলিসি</h2>
              <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">
                সর্বশেষ আপডেট: {new Date().toLocaleDateString("bn-BD")}
              </p>
            </div>
          </header>

          <div className="divide-y divide-[var(--border-color)]">
            {SECTIONS.map((section) => (
              <section key={section.title} className="px-4 py-5 sm:px-6 sm:py-6">
                <h3 className="text-base font-extrabold text-[var(--foreground)] sm:text-lg">{section.title}</h3>
                <p className="mt-2 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base sm:leading-8">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </article>
      </main>
    </div>
  );
}
