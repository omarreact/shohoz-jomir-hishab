"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { t } from "@/src/locales";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "সহজ জমির হিসাব কী?",
      answer:
        "সহজ জমির হিসাব হলো বাংলাদেশের একটি ডিজিটাল প্ল্যাটফর্ম যার মাধ্যমে আপনি যেকোনো জমির খতিয়ান, দাগ এবং জোনিং ডাটা অনলাইনে দেখতে পারেন এবং ফারায়েজ হিসাব করতে পারেন।",
    },
    {
      question: "আমি কীভাবে আমার দাগ বা জমির তথ্য খুঁজবো?",
      answer:
        "আমাদের স্মার্ট সার্চ ইঞ্জিনে আপনার দাগ নম্বর, খতিয়ান নম্বর বা এলাকার নাম লিখে খুঁজলেই আপনি সাথে সাথে বিস্তারিত তথ্য পেয়ে যাবেন।",
    },
    {
      question: "ফারায়েজ ক্যালকুলেটর কীভাবে কাজ করে?",
      answer:
        "ইসলামিক উত্তরাধিকার আইন অনুযায়ী স্বয়ংক্রিয়ভাবে জমির অংশীদারিত্ব হিসাব করার জন্য ফারায়েজ ক্যালকুলেটর ব্যবহার করতে পারেন। শুধু ওয়ারিশদের সংখ্যা নির্বাচন করুন, এটি বাকি হিসাব করে দেবে।",
    },
    {
      question: "এর তথ্য কতটা নির্ভুল?",
      answer:
        "এটি সরকারি সূত্র, পরিকল্পনা কর্তৃপক্ষ এবং ডিজিটাল জরিপ ডাটা সমন্বয় করে কাজ করে, তাই এর তথ্য শতভাগ নির্ভরযোগ্য। তবে আইনি প্রক্রিয়ার জন্য মূল নথির সাথে মিলিয়ে নেওয়া বাঞ্ছনীয়।",
    },
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 fade-in visible">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            সচরাচর <span className="text-[#006a4e]">জিজ্ঞাস্য</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            আপনাদের সাধারণ প্রশ্নগুলোর উত্তর এখানে দেওয়া হলো।
          </p>
        </div>

        <div className="space-y-4 fade-in visible" style={{ transitionDelay: "100ms" }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className={`border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen ? "bg-white dark:bg-slate-900 shadow-md" : "bg-white dark:bg-slate-950"
                }`}
              >
                <button
                  className="w-full text-left p-6 flex justify-between items-center bg-transparent border-0 outline-none cursor-pointer group"
                  onClick={() => toggleAccordion(index)}
                >
                  <h3
                    className={`font-bold m-0 flex-1 text-lg transition-colors ${
                      isOpen
                        ? "text-[#006a4e]"
                        : "text-slate-900 dark:text-white group-hover:text-[#006a4e]"
                    }`}
                  >
                    {faq.question}
                  </h3>
                  <div
                    className={`transition-transform duration-300 ml-4 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      isOpen
                        ? "bg-[#006a4e] text-white rotate-180"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <ChevronDown size={18} />
                  </div>
                </button>
                <div
                  className="overflow-hidden transition-all duration-300 ease-in-out"
                  style={{
                    maxHeight: isOpen ? "500px" : "0",
                    opacity: isOpen ? 1 : 0,
                  }}
                >
                  <div className="px-6 pb-6 pt-0 text-slate-500 dark:text-slate-400 text-base leading-relaxed mt-2 border-t border-slate-100 dark:border-slate-800">
                    {faq.answer}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
