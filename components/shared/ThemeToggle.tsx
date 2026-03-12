"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="btn btn-dark shadow-lg rounded-circle position-fixed d-flex align-items-center justify-content-center border-0"
      style={{ 
        bottom: "90px", // মোবাইলের বটম নেভবারের উপরে থাকার জন্য 90px
        right: "20px", 
        width: "55px", 
        height: "55px", 
        zIndex: 1050,
        backgroundColor: isDark ? "#1e293b" : "#0f172a",
        color: isDark ? "#fbbf24" : "#ffffff",
        transition: "all 0.3s ease"
      }}
      title="থিম পরিবর্তন করুন"
    >
      {isDark ? <Sun size={26} /> : <Moon size={26} />}
    </button>
  );
}