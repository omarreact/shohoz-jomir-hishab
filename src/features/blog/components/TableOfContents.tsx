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
      <div className="card-new overflow-hidden border-l-4 border-l-[var(--accent)]">
        <div className="p-6">
          <h5 className="font-bold mb-5 text-[var(--text-primary)] text-xl border-b border-[var(--border)] pb-3">সূচিপত্র</h5>
          <nav className="flex flex-col gap-2">
            {dummyHeaders.map((header) => (
              <a
                key={header.id}
                href={`#${header.id}`}
                className={`transition-colors p-3 rounded-lg font-medium ${
                  activeId === header.id 
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]" 
                  : "text-[var(--text-secondary)] hover:bg-[var(--border)] hover:text-[var(--text-primary)]"
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
