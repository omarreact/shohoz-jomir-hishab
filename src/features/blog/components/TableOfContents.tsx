"use client";

import { useState, useEffect } from "react";
import { Card, CardBody } from "@/components/ui/Card";

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
    <div className="position-sticky" style={{ top: "100px" }}>
      <Card className="border-0 shadow-sm" style={{ backgroundColor: "var(--card-bg)" }}>
        <CardBody className="p-4">
          <h5 className="fw-bold mb-4 text-white">সূচিপত্র</h5>
          <nav className="d-flex flex-column gap-2">
            {dummyHeaders.map((header) => (
              <a
                key={header.id}
                href={`#${header.id}`}
                className={`text-decoration-none transition-all p-2 rounded ${
                  activeId === header.id ? "bg-primary bg-opacity-10 text-primary fw-bold" : "text-secondary hover-bg-dark"
                }`}
                onClick={() => setActiveId(header.id)}
              >
                {header.text}
              </a>
            ))}
          </nav>
        </CardBody>
      </Card>
    </div>
  );
}
