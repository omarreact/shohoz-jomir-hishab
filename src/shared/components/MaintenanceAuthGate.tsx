"use client";

import { Construction, LoaderCircle } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";

export default function MaintenanceAuthGate() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
        <div className="flex flex-col items-center gap-3 text-[var(--brand-gold-text)]" role="status">
          <LoaderCircle className="h-9 w-9 animate-spin" />
          <span className="text-sm font-semibold text-[var(--muted-foreground)]">অ্যাকাউন্ট যাচাই হচ্ছে…</span>
        </div>
      </div>
    );
  }

  if (isLoggedIn) return null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-12 text-center">
      <section className="w-full max-w-xl rounded-3xl border border-[var(--border-color)] bg-white px-5 py-10 shadow-[var(--shadow-md)] sm:px-10 sm:py-12">
        <span className="landbd-icon-tile mx-auto h-16 w-16">
          <Construction size={29} />
        </span>
        <span className="landbd-section-kicker mt-5 inline-flex px-3 py-1.5 text-xs font-extrabold">সাময়িক আপডেট</span>
        <h1 className="mt-3 text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl">সাইট মেইনটেন্যান্স চলছে</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
          আমাদের ওয়েবসাইট আপডেট করার কাজ চলছে। সাময়িক এই অসুবিধার জন্য আমরা আন্তরিকভাবে দুঃখিত। খুব শীঘ্রই আমরা ফিরে আসবো!
        </p>
      </section>
    </main>
  );
}
