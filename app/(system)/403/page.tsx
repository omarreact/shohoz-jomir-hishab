"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";

export default function ForbiddenPage() {
  const { user, isLoggedIn, loading, refresh } = useAuth();
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const checkAgain = async () => {
    setChecking(true);
    setNotice(null);
    const ok = await refresh();
    setChecking(false);
    if (!ok) {
      setNotice("সেশন যাচাই করা যায়নি। পুনরায় লগইন করে চেষ্টা করুন।");
      return;
    }
    // Navigation is still gated server-side; refreshing never grants privileges.
    window.location.assign("/admin");
  };

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
        {!loading && isLoggedIn ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-950">
            <p>বর্তমান যাচাইকৃত রোল: <strong>{user?.role || "User"}</strong></p>
            {!isStaffRole(user?.role) ? (
              <p className="mt-2 leading-6">
                Admin Dashboard খুলতে Firebase Auth custom claims-এ
                Super Admin, Admin অথবা Editor অনুমতি থাকতে হবে।
                আগে এই অনুমতি থাকলে Super Admin-এর মাধ্যমে রোল যাচাই করুন।
              </p>
            ) : (
              <p className="mt-2 leading-6">সেশন বা পেজ অনুমতি আবার যাচাই করুন।</p>
            )}
            <button
              type="button"
              onClick={() => void checkAgain()}
              disabled={checking}
              className="mt-3 min-h-10 rounded-lg border border-amber-400 bg-white px-3 py-2 font-bold text-amber-950 disabled:opacity-50"
            >
              {checking ? "যাচাই হচ্ছে…" : "অনুমতি আবার যাচাই করুন"}
            </button>
            {notice ? <p role="alert" className="mt-2 text-xs">{notice}</p> : null}
          </div>
        ) : null}
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
