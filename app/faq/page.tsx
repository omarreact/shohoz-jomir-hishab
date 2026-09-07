"use client";

import AppHeader from "@/src/shared/components/AppHeader";
import { HelpCircle } from "lucide-react";
import LatestBlogs from "@/src/shared/components/LatestBlogs";

export default function FAQPage() {
  const faqs = [
    { q: "এই ক্যালকুলেটর কি সম্পূর্ণ ফ্রি?", a: "হ্যাঁ, স্মার্ট খতিয়ান ক্যালকুলেটর সবার জন্য সম্পূর্ণ ফ্রি।" },
    { q: "আমার হিসাব করা ডাটা কি অন্য কেউ দেখতে পারবে?", a: "না, আপনার সব ডাটা আপনার নিজের মোবাইলে বা ব্রাউজারে সেভ থাকে। আমরা কোনো ডাটা সার্ভারে নিই না।" },
    { q: "ফারায়েজ হিসাবে যদি ভুল মনে হয়, তাহলে কী করবো?", a: "আমাদের সিস্টেমটি প্রচলিত আইনের ওপর ভিত্তি করে তৈরি। তবে জটিল ক্ষেত্রে আইনজীবীর পরামর্শ নিন।" }
  ];

  return (
    <div className="container py-5 fade-in">
      {/* <AppHeader /> */}
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
            <h2 className="fw-bold text-success mb-4 d-flex align-items-center">
              <HelpCircle className="me-2" size={28} /> সাধারণ জিজ্ঞাসা (FAQ)
            </h2>
            
            <div className="accordion mt-4" id="faqAccordion">
              {faqs.map((faq, idx) => (
                <div className="accordion-item border-0 mb-3 shadow-sm rounded-3 overflow-hidden" key={idx}>
                  <h2 className="accordion-header">
                    <button className="accordion-button collapsed fw-bold text-dark bg-light" type="button" data-bs-toggle="collapse" data-bs-target={`#faq-${idx}`}>
                      {faq.q}
                    </button>
                  </h2>
                  <div id={`faq-${idx}`} className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                    <div className="accordion-body text-secondary bg-white">
                      {faq.a}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <LatestBlogs />
    </div>
  );
}