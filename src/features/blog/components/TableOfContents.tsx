"use client";

import { useState, useEffect } from "react";

export default function TableOfContents() {
  const [activeId, setActiveId] = useState<string>("");

  // In a real app, you'd parse headers from markdown/html
  const dummyHeaders = [
    { id: "introduction", text: "LandBD এর ভূমিকা" },
    { id: "how-it-works", text: "সার্চ ইঞ্জিন কীভাবে কাজ করে" },
    { id: "benefits", text: "সার্ভেয়ারদের জন্য সুবিধাসমূহ" },
    { id: "future", text: "ভবিষ্যতের রূপরেখা" },
  ];

  useEffect(() => {
    // Simple intersection observer logic for active states could go here
  }, []);

  return (
    <div className="sticky top-24">
      <div className="card-new overflow-hidden border-l-4 border-l-[#006a4e]">
        <div className="p-6">
          <h5 className="font-bold mb-5 text-slate-900 dark:text-white text-xl border-b border-slate-200 dark:border-slate-800 pb-3">সূচিপত্র</h5>
          <nav className="flex flex-col gap-2">
            {dummyHeaders.map((header) => (
              <a
                key={header.id}
                href={`#${header.id}`}
                className={`transition-colors p-3 rounded-lg font-medium ${
                  activeId === header.id 
                  ? "bg-[#006a4e]/10 text-[#006a4e]" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:bg-slate-800 hover:text-slate-900 dark:text-white"
                }`}
                onClick={() => setActiveId(header.id)}
              >
                {header.text}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
