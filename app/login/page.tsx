"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, LogIn, Home } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { SITE_CONFIG } from "@/src/shared/config/site";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, isLoggedIn } = useAuth();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_admin") {
      setError("অ্যাক্সেস ডিনাইড: আপনার স্টাফ অনুমতি নেই।");
    } else if (errorParam === "suspended") {
      setError("আপনার একাউন্টটি সাময়িকভাবে বন্ধ করা হয়েছে।");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && isLoggedIn) {
      const from = searchParams.get("from") || "/admin";
      router.replace(from);
    }
  }, [loading, isLoggedIn, router, searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const emailToUse = username.includes("@")
      ? username.toLowerCase().trim()
      : `${username.toLowerCase().trim()}@landbd.com`;

    try {
      await login(emailToUse, password);
      const from = searchParams.get("from") || "/admin";
      router.push(from);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("লক")) {
        setError(msg);
      } else if (msg.includes("credentials") || msg.includes("password") || msg.includes("auth/")) {
        setError("ভুল ইমেইল বা পাসওয়ার্ড।");
      } else {
        setError(msg || "লগিন করতে সমস্যা হয়েছে।");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4 flex items-center justify-center fade-in visible">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link
            href={FEATURE_ROUTES.home}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-[#006a4e]"
          >
            <Home size={16} /> {SITE_CONFIG.name}
          </Link>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm p-8 md:p-10 border-t-4 border-t-[#006a4e] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Lock size={120} className="text-slate-900 dark:text-white" />
          </div>

          <div className="relative z-10 text-center mb-8">
            <div className="bg-[#006a4e]/10 text-[#006a4e] rounded-full inline-flex p-4 mb-4 shadow-sm">
              <Lock size={32} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-2xl mb-2">
              স্টাফ লগইন
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
              শুধুমাত্র অনুমোদিত স্টাফ ও অ্যাডমিনের জন্য — সাধারণ ব্যবহারকারীর অ্যাকাউন্ট নয়
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 text-center text-sm font-bold mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-slate-900 dark:text-white font-bold mb-2">
                ইমেইল বা ইউজারনেম
              </label>
              <input
                type="text"
                placeholder="ইমেইল লিখুন"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-900 dark:text-white font-bold mb-2">
                পাসওয়ার্ড
              </label>
              <input
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 focus:outline-none focus:border-[#006a4e] transition-colors shadow-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="w-full bg-[#006a4e] hover:bg-[#00523b] text-white font-bold rounded-xl px-4 py-3.5 shadow-md hover:-translate-y-0.5 transition-all flex justify-center items-center mt-4 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
            >
              {loading || submitting ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={20} className="mr-2" /> লগিন করুন
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-[#006a4e] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
