"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-10 text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center">
          <ShieldAlert size={42} />
        </div>
        <p className="text-sm font-bold uppercase tracking-wider text-red-600 mb-2">403</p>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">অ্যাক্সেস অনুমোদিত নয়</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          এই অংশটি শুধুমাত্র অনুমোদিত অ্যাডমিন বা এডিটরদের জন্য। আপনার অ্যাকাউন্টের অনুমতি পরীক্ষা করুন।
        </p>
        <Link href="/" className="inline-flex items-center justify-center rounded-xl bg-[#006a4e] px-6 py-3 font-bold text-white hover:bg-[#00523b] transition-colors">
          হোমপেজে ফিরে যান
        </Link>
      </div>
    </main>
  );
}
