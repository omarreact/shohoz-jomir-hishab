"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";
import LegalDisclaimer from "@/src/shared/ui/LegalDisclaimer";

const FAQS = [
  {
    question: "সহজ জমির হিসাব কী?",
    answer:
      "সহজ জমির হিসাব একটি বিনামূল্যের ডিজিটাল সহায়ক—খতিয়ানের আনা-গন্ডা হিসাব, জমি পরিমাপ, ফারায়েজ বণ্টন এবং RS/MS মৌজা মানচিত্র এক জায়গায়।",
  },
  {
    question: "খতিয়ান ক্যালকুলেটর কীভাবে ব্যবহার করব?",
    answer:
      "খতিয়ান পেজে গিয়ে আপনার দাগ/খতিয়ান সংক্রান্ত মান ইনপুট করুন। টুল আনা, গন্ডা, শতাংশ ও কাঠা হিসাব দেখাবে। এটি প্রাথমিক সহায়ক হিসাব; আইনি কাজে মূল নথি যাচাই করুন।",
  },
  {
    question: "ফারায়েজ ক্যালকুলেটর কীভাবে কাজ করে?",
    answer:
      "ইসলামি উত্তরাধিকার নিয়ম অনুযায়ী ওয়ারিশদের তথ্য দিলে অংশ স্বয়ংক্রিয়ভাবে হিসাব হয়। জটিল মামলা বা বিরোধে আইনজীবীর পরামর্শ নিন।",
  },
  {
    question: "মানচিত্রে কী দেখা যায়?",
    answer:
      "পাবলিক ব্যবহারকারী RS ও MS মৌজা টাইল দেখতে ও প্লটে ট্যাপ করে প্রাথমিক ফলাফল পেতে পারেন। লগইন করলে অতিরিক্ত লেয়ার ও FeatureServer সীমানা পাওয়া যায়।",
  },
  {
    question: "তথ্য কতটা নির্ভুল?",
    answer: SITE_CONFIG.legalDisclaimer,
  },
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 dark:border-slate-800 dark:bg-slate-900/30 md:py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#006a4e]">
            FAQ
          </p>
          <h2 className="mb-3 text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">
            সচরাচর <span className="text-[#006a4e]">জিজ্ঞাস্য</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            সাধারণ প্রশ্নগুলোর সংক্ষিপ্ত উত্তর।
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={`overflow-hidden rounded-2xl border transition ${
                  isOpen
                    ? "border-[#006a4e]/30 bg-white shadow-md dark:bg-slate-950"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"
                }`}
              >
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent p-5 text-left outline-none"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                >
                  <h3
                    className={`m-0 flex-1 text-base font-bold transition ${
                      isOpen
                        ? "text-[#006a4e]"
                        : "text-slate-900 dark:text-white"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                      isOpen
                        ? "rotate-180 bg-[#006a4e] text-white"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }`}
                  >
                    <ChevronDown size={16} />
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-sm leading-relaxed text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <LegalDisclaimer className="mt-8" />

        <div className="mt-6 text-center">
          <Link
            href={FEATURE_ROUTES.faq}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#006a4e] no-underline hover:underline"
          >
            আরও প্রশ্নোত্তর <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
