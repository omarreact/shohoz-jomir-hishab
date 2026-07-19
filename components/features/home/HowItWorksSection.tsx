"use client";

import { Search, FileText, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

export default function HowItWorksSection() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const steps = [
    {
      id: 1,
      title: "এলাকা নির্বাচন করুন",
      description: "প্রথমে আপনার বিভাগ, জেলা এবং কাঙ্ক্ষিত মৌজা বা জে.এল নম্বর নির্বাচন করুন।",
      icon: <Search size={24} className="accent-text" />,
      align: "left",
    },
    {
      id: 2,
      title: "দাগ বা খতিয়ান দিন",
      description: "আপনার কাছে থাকা দাগ নম্বর বা খতিয়ান নম্বরটি ইনপুট বক্সে প্রদান করুন।",
      icon: <FileText size={24} className="accent-text" />,
      align: "right",
    },
    {
      id: 3,
      title: "বিস্তারিত তথ্য পান",
      description: "মুহূর্তেই আপনার জমির সম্পূর্ণ বিবরণ, মালিকানা এবং ম্যাপ দেখুন।",
      icon: <CheckCircle size={24} className="accent-text" />,
      align: "left",
    },
  ];

  return (
    <section id="how-it-works" className="py-24 surface-bg border-t border-c">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`text-center mb-16 fade-in ${isLoaded ? "visible" : ""}`}>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[var(--text-primary)]">
            কিভাবে <span className="accent-text">কাজ করে?</span>
          </h2>
          <p className="text-[var(--text-secondary)] max-w-2xl mx-auto">
            খুব সহজেই মাত্র তিনটি ধাপে আপনার কাঙ্ক্ষিত তথ্য খুঁজে নিন।
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Timeline Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[var(--border)] -translate-x-1/2"></div>

          <div className="space-y-12">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`relative flex flex-col md:flex-row items-center justify-between fade-in ${
                  isLoaded ? "visible" : ""
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}
              >
                {/* Desktop Left Content */}
                <div
                  className={`hidden md:block w-5/12 ${
                    step.align === "left" ? "text-right pr-8" : "invisible"
                  }`}
                >
                  {step.align === "left" && (
                    <div className="card-new p-6 text-left">
                      <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
                        {step.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm m-0">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Center Circle */}
                <div className="z-10 flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg)] border-4 border-[var(--surface)] shadow-lg relative mb-6 md:mb-0">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full cta-gradient text-white flex items-center justify-center font-bold text-sm shadow-md">
                    {step.id}
                  </div>
                  {step.icon}
                </div>

                {/* Desktop Right Content */}
                <div
                  className={`hidden md:block w-5/12 ${
                    step.align === "right" ? "pl-8" : "invisible"
                  }`}
                >
                  {step.align === "right" && (
                    <div className="card-new p-6 text-left">
                      <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
                        {step.title}
                      </h3>
                      <p className="text-[var(--text-secondary)] text-sm m-0">
                        {step.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mobile Content */}
                <div className="md:hidden w-full px-4">
                  <div className="card-new p-6 text-center">
                    <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)]">
                      {step.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] text-sm m-0">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
