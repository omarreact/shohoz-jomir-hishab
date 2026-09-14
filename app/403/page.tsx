"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-lg rounded-3xl border border-[var(--border-color)] bg-white px-5 py-9 text-center shadow-[var(--shadow-md)] sm:px-10 sm:py-11">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 ring-1 ring-red-100 sm:h-16 sm:w-16">
          <ShieldAlert size={30} />
        </div>
        <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-red-600">403</p>
        <h1 className="mt-2 text-2xl font-extrabold text-[var(--foreground)] sm:text-3xl">অ্যাক্সেস অনুমোদিত নয়</h1>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)] sm:text-base">
          এই অংশটি শুধুমাত্র অনুমোদিত অ্যাডমিন বা এডিটরদের জন্য। আপনার অ্যাকাউন্টের অনুমতি পরীক্ষা করুন।
        </p>
        <Link
          href="/"
          className="landbd-primary-button mt-7 inline-flex min-h-12 w-full items-center justify-center px-6 text-sm font-extrabold no-underline sm:w-auto"
        >
          হোমপেজে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
