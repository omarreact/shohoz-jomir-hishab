"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Home,
  Eye,
  EyeOff,
  LayoutDashboard,
  FileText,
  LockKeyhole,
  LogIn,
  Mail,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { resolvePostLoginTarget } from "@/src/modules/auth/loginRedirect";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();
  const { login, loading, isLoggedIn, user } = useAuth();
  const redirectingRef = useRef(false);
  const fromTarget = searchParams.get("from");

  const redirectToTarget = useCallback((role: unknown) => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;

    // Use a full navigation after authentication so the first request to the
    // protected destination definitely includes the freshly-written auth cookie.
    window.location.replace(resolvePostLoginTarget(fromTarget, role));
  }, [fromTarget]);

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
      redirectToTarget(user?.role);
    }
  }, [loading, isLoggedIn, user?.role, redirectToTarget]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || loading || redirectingRef.current) return;
    setError("");
    setSubmitting(true);


    try {
      const profile = await login(username.trim(), password);
      redirectToTarget(profile.role);
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
    <main className="min-h-[100dvh] bg-[var(--background)] text-[var(--foreground)]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-10">
        <Link href={FEATURE_ROUTES.home} className="flex items-center gap-3 text-inherit no-underline">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-gold)] text-[var(--primary-foreground)]"><MapPinned size={23} /></span>
          <span><strong className="block text-xl tracking-tight">LandBD</strong><span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Admin workspace</span></span>
        </Link>
        <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-color)] px-3 text-xs font-semibold text-[var(--muted-foreground)] no-underline hover:bg-[var(--card-bg)] sm:px-4 sm:text-sm"><Home size={16} /> ওয়েবসাইটে যান</Link>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 pb-8 pt-4 sm:px-10 sm:pt-10 lg:min-h-[calc(100dvh-160px)] lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pb-14">
        <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--brand-green-faint)] p-7 sm:p-10 lg:p-12" aria-labelledby="workspace-title">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full bg-[var(--brand-gold)] opacity-10 blur-3xl" />
          <span className="relative inline-flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--card-bg)] px-3 py-2 text-[11px] font-bold tracking-wide"><ShieldCheck size={14} className="text-emerald-600" /> ADMIN ACCESS</span>
          <h1 id="workspace-title" className="relative mt-7 max-w-sm text-3xl font-extrabold leading-snug tracking-tight sm:text-4xl lg:text-5xl">LandBD পরিচালনা,<br /><span className="text-[var(--primary)]">এক জায়গা থেকেই।</span></h1>
          <p className="relative mt-5 max-w-sm text-sm leading-7 text-[var(--muted-foreground)]">ভূমি তথ্য, মানচিত্র ও কনটেন্ট পরিচালনার জন্য আপনার কেন্দ্রীয় অ্যাডমিন ওয়ার্কস্পেস।</p>
          <div className="relative mt-8 hidden space-y-3 sm:block">
            {[
              { icon: LayoutDashboard, title: "ড্যাশবোর্ড ও পর্যবেক্ষণ", detail: "সিস্টেম স্বাস্থ্য ও কার্যক্রমের সারসংক্ষেপ" },
              { icon: MapPinned, title: "GIS ও ভূমি তথ্য", detail: "মানচিত্র, রেকর্ড ও API ব্যবস্থাপনা" },
              { icon: FileText, title: "কনটেন্ট ও অ্যাক্সেস", detail: "ব্লগ, পেজ ও ব্যবহারকারীর অনুমতি" },
            ].map(({ icon: Icon, title, detail }) => (
              <div key={title} className="flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-gold-faint)] text-[var(--foreground)]"><Icon size={19} /></span>
                <div><p className="text-sm font-bold">{title}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{detail}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-md py-2 sm:py-6" aria-labelledby="login-title">
          <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary)]"><LockKeyhole size={23} /></span>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">Welcome back</p>
          <h2 id="login-title" className="mt-2 text-3xl font-extrabold tracking-tight">অ্যাডমিন লগইন</h2>
          <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">আপনার অনুমোদিত অ্যাকাউন্ট দিয়ে প্রবেশ করুন। লগইনের পর সরাসরি ড্যাশবোর্ড খুলবে।</p>

          {error && <div id="login-error" role="alert" className="mt-5 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm leading-6 text-red-700 dark:text-red-300">{error}</div>}

          <form onSubmit={handleLogin} aria-busy={submitting} aria-describedby={error ? "login-error" : undefined} className="mt-7 space-y-5">
            <div>
              <label htmlFor="landbd-login-user" className="mb-2 block text-sm font-bold">অ্যাডমিন ইউজারনেম</label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
                <input id="landbd-login-user" name="username" type="text" placeholder="আপনার অ্যাডমিন ইউজারনেম" value={username} onChange={event => setUsername(event.target.value)} required autoComplete="username" autoCapitalize="none" spellCheck={false} disabled={submitting} className="landbd-input h-14 w-full pl-11 pr-4 text-base disabled:opacity-60" />
              </div>
            </div>
            <div>
              <label htmlFor="landbd-login-password" className="mb-2 block text-sm font-bold">পাসওয়ার্ড</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" size={18} />
                <input id="landbd-login-password" name="password" type={showPassword ? "text" : "password"} placeholder="আপনার পাসওয়ার্ড" value={password} onChange={event => setPassword(event.target.value)} onKeyUp={event => setCapsLock(event.getModifierState("CapsLock"))} onKeyDown={event => setCapsLock(event.getModifierState("CapsLock"))} onBlur={() => setCapsLock(false)} required autoComplete="current-password" disabled={submitting} aria-describedby={capsLock ? "caps-lock-warning" : undefined} className="landbd-input h-14 w-full pl-11 pr-14 text-base disabled:opacity-60" />
                <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"} aria-pressed={showPassword} className="absolute right-1 top-1 flex h-12 w-12 items-center justify-center rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]">{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
              </div>
              {capsLock && <p id="caps-lock-warning" role="status" className="mt-2 text-xs text-amber-700 dark:text-amber-400">Caps Lock চালু আছে।</p>}
            </div>
            <button type="submit" disabled={loading || submitting} className="landbd-primary-button flex min-h-14 w-full items-center justify-center gap-3 px-5 text-base font-bold disabled:cursor-not-allowed disabled:opacity-60">
              {loading || submitting ? <><span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" /><span role="status">{submitting ? "যাচাই করা হচ্ছে…" : "সেশন যাচাই হচ্ছে…"}</span></> : <><LogIn size={19} /> ড্যাশবোর্ডে প্রবেশ করুন <ArrowRight size={18} /></>}
            </button>
          </form>
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" /><p className="text-xs leading-6 text-[var(--muted-foreground)]">এই প্রবেশপথ শুধুমাত্র Super Admin-এর জন্য। সার্ভারে নির্ধারিত ইউজারনেম ও পাসওয়ার্ড ব্যবহার করুন।</p>
          </div>
        </section>
      </div>
      <footer className="mx-auto max-w-7xl px-5 pb-6 text-center text-[11px] text-[var(--muted-foreground)] sm:px-10">LandBD · ভূমি তথ্য ও ব্যবস্থাপনা</footer>
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
