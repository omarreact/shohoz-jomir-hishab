"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useAnnouncement } from "@/src/shared/hooks/useAnnouncement";

export default function AnnouncementBanner() {
  const message = useAnnouncement();
  const [visible, setVisible] = useState(true);

  if (!message || !visible) return null;

  return (
    <div
      className="relative z-[1000] border-b border-amber-500/30 bg-amber-500/15 px-4 py-2.5 text-center text-sm font-semibold text-amber-950 dark:text-amber-100"
      role="status"
    >
      <span className="mr-1" aria-hidden>
        🔔
      </span>
      {message}
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-amber-900/70 hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-200"
        aria-label="বন্ধ করুন"
      >
        <X size={16} />
      </button>
    </div>
  );
}
