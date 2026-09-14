"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  Layers3,
  LockKeyhole,
  LogIn,
  Mail,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
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

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
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
    <main className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[var(--shadow-lg)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="p-6 sm:p-10 lg:p-12">
          <Link
            href={FEATURE_ROUTES.home}
            className="mb-10 inline-flex items-center gap-3 text-[var(--foreground)] no-underline"
          >
            <span className="landbd-icon-tile h-11 w-11">
              <Home size={20} />
            </span>
            <span>
              <strong className="block text-lg leading-tight">LandBD</strong>
              <span className="text-xs text-[var(--muted-foreground)]">{SITE_CONFIG.name}</span>
            </span>
          </Link>

          <div className="max-w-md">
            <span className="landbd-section-kicker inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold">
              <ShieldCheck size={14} /> স্টাফ নিরাপদ প্রবেশ
            </span>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)] sm:text-4xl">
              আবার স্বাগতম 👋
            </h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)] sm:text-base">
              শুধুমাত্র অনুমোদিত স্টাফ, এডিটর ও অ্যাডমিনের জন্য।
            </p>
          </div>

          {error && (
            <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-bold text-red-600 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-7 max-w-md space-y-5">
            <div>
              <label htmlFor="landbd-login-user" className="mb-2 block text-sm font-bold text-[var(--foreground)]">
                ইমেইল বা ইউজারনেম
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
                <input
                  id="landbd-login-user"
                  type="text"
                  placeholder="আপনার ইমেইল লিখুন"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoComplete="username"
                  className="landbd-input h-12 w-full pl-11 pr-4 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="landbd-login-password" className="mb-2 block text-sm font-bold text-[var(--foreground)]">
                পাসওয়ার্ড
              </label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
                <input
                  id="landbd-login-password"
                  type="password"
                  placeholder="পাসওয়ার্ড দিন"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  className="landbd-input h-12 w-full pl-11 pr-4 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || submitting}
              className="landbd-primary-button flex h-12 w-full items-center justify-center gap-2 px-5 text-base font-extrabold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading || submitting ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary-foreground)] border-t-transparent" />
              ) : (
                <>
                  <LogIn size={19} />
                  লগইন করুন
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 max-w-md border-t border-[var(--border-color)] pt-5 text-xs leading-6 text-[var(--muted-foreground)]">
            আপনার অ্যাক্সেস রোল অনুযায়ী Admin Panel-এর অনুমোদিত অংশগুলো দেখানো হবে।
          </div>
        </section>

        <aside className="relative hidden min-h-[680px] overflow-hidden border-l border-[var(--border-color)] bg-[var(--brand-gold-faint)] lg:block">
          <div
            aria-hidden
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(circle at 68% 42%, rgba(244,185,40,.30), transparent 12rem), radial-gradient(circle at 45% 62%, rgba(34,160,107,.12), transparent 15rem), linear-gradient(145deg, rgba(255,255,255,.75), rgba(255,246,211,.7))",
            }}
          />
          <div aria-hidden className="absolute left-[18%] top-[22%] h-72 w-72 rotate-[-9deg] rounded-[38%_62%_52%_48%/46%_38%_62%_54%] border border-emerald-500/15 bg-emerald-500/10" />
          <div aria-hidden className="absolute left-[29%] top-[31%] h-48 w-40 rotate-[13deg] rounded-[44%_56%_48%_52%/39%_45%_55%_61%] border border-emerald-500/20 bg-emerald-500/10" />

          <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-12">
            <div className="flex justify-end">
              <div className="landbd-card flex items-center gap-3 px-4 py-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Layers3 size={18} />
                </span>
                <div>
                  <p className="text-xs font-extrabold text-[var(--foreground)]">GIS & ভূমি তথ্য</p>
                  <p className="text-[11px] text-[var(--muted-foreground)]">LandBD Workspace</p>
                </div>
              </div>
            </div>

            <div className="mx-auto flex max-w-sm flex-col items-center text-center">
              <span className="flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-[var(--brand-gold)] text-[var(--primary-foreground)] shadow-[0_18px_40px_rgba(222,164,20,.25)]">
                <MapPinned size={36} />
              </span>
              <h2 className="mt-6 text-3xl font-extrabold text-[var(--foreground)]">LandBD Admin Workspace</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
                ভূমি রেকর্ড, GIS, কনটেন্ট, ব্যবহারকারী ও সিস্টেম পর্যবেক্ষণের কেন্দ্রীয় কর্মক্ষেত্র।
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {["নিরাপদ", "নির্ভরযোগ্য", "রোল-ভিত্তিক"].map((label) => (
                <div key={label} className="rounded-xl border border-[var(--border-color)] bg-white/75 px-3 py-3 text-center text-xs font-bold text-slate-700 backdrop-blur-sm">
                  {label}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
          <span className="h-9 w-9 animate-spin rounded-full border-4 border-[var(--brand-gold-soft)] border-t-[var(--brand-gold)]" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
