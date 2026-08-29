"use client";

import { WifiOff } from "lucide-react";
import { useNetworkStatus } from "@/src/shared/hooks/useNetworkStatus";

export default function OfflineMapNotice() {
  const isOnline = useNetworkStatus();
  if (isOnline) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-[900] flex justify-center px-4">
      <div
        role="status"
        className="pointer-events-auto max-w-md rounded-2xl border border-amber-300/60 bg-background/95 px-5 py-4 text-center shadow-xl backdrop-blur-md dark:border-amber-700/60"
      >
        <div className="mb-1 flex items-center justify-center gap-2 font-bold text-foreground">
          <WifiOff size={18} className="text-amber-600" />
          অফলাইন মোড
        </div>
        <p className="text-sm leading-6 text-muted-foreground">
          লাইভ GIS মানচিত্র দেখতে ইন্টারনেট সংযোগ প্রয়োজন। তবে <strong className="text-foreground">খতিয়ান</strong> ও <strong className="text-foreground">ফারায়েজ</strong> ক্যালকুলেটর নেভিগেশন মেনু থেকে সম্পূর্ণভাবে ব্যবহার করা যাবে।
        </p>
      </div>
    </div>
  );
}
