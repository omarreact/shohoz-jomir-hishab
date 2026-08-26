"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const FAQS = [
  { question: "সহজ জমির হিসাব কী?", answer: "সহজ জমির হিসাব একটি বিনামূল্যের ডিজিটাল সহায়ক—খতিয়ানের আনা-গন্ডা হিসাব, জমি পরিমাপ, ফারায়েজ বণ্টন এবং RS/MS মৌজা মানচিত্র এক জায়গায়।" },
  { question: "খতিয়ান ক্যালকুলেটর কীভাবে ব্যবহার করব?", answer: "খতিয়ান পেজে গিয়ে আপনার দাগ/খতিয়ান সংক্রান্ত মান ইনপুট করুন। টুল আনা, গন্ডা, শতাংশ ও কাঠা হিসাব দেখাবে। এটি প্রাথমিক সহায়ক হিসাব; আইনি কাজে মূল নথি যাচাই করুন।" },
  { question: "ফারায়েজ ক্যালকুলেটর কীভাবে কাজ করে?", answer: "ইসলামি উত্তরাধিকার নিয়ম অনুযায়ী ওয়ারিশদের তথ্য দিলে অংশ স্বয়ংক্রিয়ভাবে হিসাব হয়। জটিল মামলা বা বিরোধে আইনজীবীর পরামর্শ নিন।" },
  { question: "মানচিত্রে কী দেখা যায়?", answer: "RS ও MS মৌজা, উপলভ্য প্লট তথ্য এবং স্যাটেলাইটসহ বিভিন্ন মানচিত্র স্তর দেখা যায়। কিছু সুরক্ষিত তথ্যের জন্য লগইন প্রয়োজন হতে পারে।" },
  { question: "তথ্য কতটা নির্ভুল?", answer: "এই সাইটের হিসাব ও তথ্য সাধারণ সহায়তার জন্য। সরকারি মূল নথি, রেকর্ড বা আইনি সিদ্ধান্তের বিকল্প হিসেবে ব্যবহার করবেন না। গুরুত্বপূর্ণ কাজে সংশ্লিষ্ট সরকারি নথি যাচাই করুন।" },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-[var(--border-color)] bg-[var(--secondary)] py-16 md:py-20" aria-labelledby="faq-heading">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#1A6B3C]">FAQ</p>
          <h2 id="faq-heading" className="mb-3 text-3xl font-bold text-[var(--foreground)] md:text-4xl">সচরাচর <span className="text-[#1A6B3C]">জিজ্ঞাস্য</span></h2>
          <p className="text-[var(--muted-foreground)]">সাধারণ প্রশ্নগুলোর সংক্ষিপ্ত উত্তর।</p>
        </div>

        <div className="space-y-3" role="list">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const panelId = `faq-panel-${index}`;
            return (
              <div key={faq.question} role="listitem" className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-[#1A6B3C]/30 bg-[var(--card-bg)] shadow-md" : "border-[var(--border-color)] bg-[var(--card-bg)]"}`}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 bg-transparent p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#1A6B3C] focus-visible:ring-inset"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className={`flex-1 text-base font-bold ${isOpen ? "text-[#1A6B3C]" : "text-[var(--foreground)]"}`}>{faq.question}</span>
                  <ChevronDown aria-hidden="true" size={18} className={`shrink-0 transition-transform ${isOpen ? "rotate-180 text-[#1A6B3C]" : "text-[var(--muted-foreground)]"}`} />
                </button>
                <div id={panelId} hidden={!isOpen} className="border-t border-[var(--border-color)] px-5 pb-5 pt-3 text-sm leading-7 text-[var(--muted-foreground)]">{faq.answer}</div>
              </div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs leading-6 text-[var(--muted-foreground)]">
          গুরুত্বপূর্ণ সিদ্ধান্তের আগে সরকারি মূল নথি যাচাই করুন। <Link href={FEATURE_ROUTES.terms} className="font-semibold text-[#1A6B3C] no-underline hover:underline">বিস্তারিত শর্তাবলি</Link>
        </p>
        <div className="mt-6 text-center"><Link href={FEATURE_ROUTES.faq} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-[#1A6B3C] no-underline hover:underline">আরও প্রশ্নোত্তর <ArrowRight size={14} /></Link></div>
      </div>
    </section>
  );
}
