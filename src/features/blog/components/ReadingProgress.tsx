"use client";

import { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight) {
        setProgress(Number((currentScrollY / scrollHeight).toFixed(4)) * 100);
      }
    };

    window.addEventListener("scroll", updateScroll);
    updateScroll();

    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 z-3" 
      style={{ height: "4px", backgroundColor: "var(--card-bg-secondary)" }}
    >
      <div 
        className="h-100 bg-primary transition-all" 
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
