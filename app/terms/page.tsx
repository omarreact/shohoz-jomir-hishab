import { FileText } from "lucide-react";
import HeroBanner from "@/src/shared/ui/HeroBanner";

const SECTIONS = [
  {
    title: "১. সাধারণ শর্ত",
    body: "এই ওয়েবসাইটটি ব্যবহার করার অর্থ হলো আপনি আমাদের সকল শর্তাবলীর সাথে একমত। যদি একমত না হন, তবে দয়া করে সাইটটি ব্যবহার করা থেকে বিরত থাকুন।",
  },
  {
    title: "২. ফলাফলের দায়বদ্ধতা (Disclaimer)",
    body: "এই ওয়েবসাইটের ক্যালকুলেটরগুলো শুধুমাত্র ধারণা দেওয়ার জন্য একটি ডিজিটাল টুলমাত্র। এই ফলাফলের ওপর ভিত্তি করে কোনো আইনি সিদ্ধান্ত নেওয়ার আগে অবশ্যই একজন অভিজ্ঞ আইনজীবী বা ভূমি কর্মকর্তার পরামর্শ নেওয়ার অনুরোধ করা হলো। কোনো গাণিতিক ভুলের জন্য কর্তৃপক্ষ দায়ী থাকবে না।",
  },
  {
    title: "৩. কপিরাইট",
    body: "এই ওয়েবসাইটের ডিজাইন, কোড এবং কন্টেন্ট সম্পূর্ণ কপিরাইট সংরক্ষিত। অনুমতি ছাড়া এটি বাণিজ্যিক ব্যবহার দণ্ডনীয় অপরাধ।",
  },
] as const;

export default function TermsOfService() {
  return (
    <div className="landbd-page">
      <HeroBanner
        badge="তথ্য ও নীতিমালা"
        title="ব্যবহারের শর্তাবলী"
        description="LandBD ব্যবহার করার আগে প্রযোজ্য সাধারণ শর্ত, ফলাফলের সীমাবদ্ধতা এবং কপিরাইট সংক্রান্ত তথ্য পড়ুন।"
        pattern="grid"
      />

      <main className="landbd-page-inner py-7 sm:py-10">
        <article className="mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[var(--border-color)] bg-white shadow-[var(--shadow-sm)]">
          <header className="flex items-center gap-3 border-b border-[var(--border-color)] bg-[var(--brand-gold-faint)] px-4 py-4 sm:px-6 sm:py-5">
            <span className="landbd-icon-tile h-11 w-11 shrink-0">
              <FileText size={21} />
            </span>
            <div>
              <h2 className="text-lg font-extrabold text-[var(--foreground)] sm:text-xl">LandBD ব্যবহারের নীতিমালা</h2>
              <p className="mt-0.5 text-xs leading-5 text-[var(--muted-foreground)] sm:text-sm">সহজ ভাষায় গুরুত্বপূর্ণ শর্তগুলো নিচে দেওয়া হলো।</p>
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
