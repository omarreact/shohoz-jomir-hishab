"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { t } from "@/src/locales";
import { Card } from "@/components/ui/Card";

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "LandBD 2.0 কী?",
      answer: "LandBD 2.0 হলো বাংলাদেশের প্রথম আধুনিক জিআইএস ভিত্তিক ডিজিটাল ভূমি ইন্টেলিজেন্স প্ল্যাটফর্ম। এর মাধ্যমে আপনি যেকোনো জমির খতিয়ান, দাগ এবং জোনিং ডাটা অনলাইনে দেখতে পারেন।"
    },
    {
      question: "আমি কীভাবে আমার দাগ বা জমির তথ্য খুঁজবো?",
      answer: "আমাদের স্মার্ট সার্চ ইঞ্জিনে আপনার দাগ নম্বর, খতিয়ান নম্বর বা এলাকার নাম লিখে খুঁজলেই আপনি সাথে সাথে বিস্তারিত তথ্য পেয়ে যাবেন।"
    },
    {
      question: "ফারায়েজ ক্যালকুলেটর কীভাবে কাজ করে?",
      answer: "ইসলামিক উত্তরাধিকার আইন অনুযায়ী স্বয়ংক্রিয়ভাবে জমির অংশীদারিত্ব হিসাব করার জন্য ফারায়েজ ক্যালকুলেটর ব্যবহার করতে পারেন। শুধু ওয়ারিশদের সংখ্যা নির্বাচন করুন, এটি বাকি হিসাব করে দেবে।"
    },
    {
      question: "LandBD-এর তথ্য কতটা নির্ভুল?",
      answer: "LandBD সরকারি সূত্র, পরিকল্পনা কর্তৃপক্ষ এবং ডিজিটাল জরিপ ডাটা সমন্বয় করে কাজ করে, তাই এর তথ্য শতভাগ নির্ভরযোগ্য। তবে আইনি প্রক্রিয়ার জন্য মূল নথির সাথে মিলিয়ে নেওয়া বাঞ্ছনীয়।"
    }
  ];

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-5" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
      <div className="container py-4">
        <div className="row align-items-center">
          <div className="col-lg-5 mb-5 mb-lg-0 animate-slide-up">
            <div className="bg-primary bg-opacity-10 d-inline-flex align-items-center justify-content-center rounded-circle mb-4" style={{ width: "60px", height: "60px" }}>
              <HelpCircle size={30} className="text-primary" />
            </div>
            <h2 className="display-6 fw-bold text-white mb-4">{t.faq.title}</h2>
            <p className="lead text-secondary mb-4">
              বাংলাদেশ ভূমি রেকর্ড এবং LandBD প্ল্যাটফর্ম সম্পর্কে সাধারণ জিজ্ঞাসার উত্তরগুলো জেনে নিন।
            </p>
            <Card variant="flat" className="mt-4 p-4 border-0" style={{ backgroundColor: "var(--card-bg)" }}>
              <h5 className="fw-bold text-white">আরও প্রশ্ন আছে?</h5>
              <p className="text-secondary small mb-0">আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন অথবা ফোরামে প্রশ্ন করুন।</p>
            </Card>
          </div>

          <div className="col-lg-7 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="accordion custom-accordion d-flex flex-column gap-3">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <Card key={index} variant="default" className="border-0" style={{ backgroundColor: "var(--card-bg)" }}>
                    <button 
                      className="btn w-100 text-start p-4 d-flex justify-content-between align-items-center bg-transparent border-0"
                      onClick={() => toggleAccordion(index)}
                      style={{ boxShadow: "none" }}
                    >
                      <h5 className={`fw-bold mb-0 ${isOpen ? 'text-primary' : 'text-white'}`}>
                        {faq.question}
                      </h5>
                      <div className={`transition-all ${isOpen ? 'text-primary' : 'text-secondary'}`} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0)' }}>
                        <ChevronDown size={20} />
                      </div>
                    </button>
                    <div 
                      className="overflow-hidden transition-all" 
                      style={{ maxHeight: isOpen ? "500px" : "0", opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="p-4 pt-0 text-secondary lh-lg border-top border-secondary border-opacity-25">
                        {faq.answer}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
