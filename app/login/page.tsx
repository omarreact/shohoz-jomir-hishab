"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_admin") {
      setError("অ্যাক্সেস ডিনাইড: আপনি এই সিস্টেমের অ্যাডমিন নন।");
    } else if (errorParam === "suspended") {
      setError("আপনার একাউন্টটি সাময়িকভাবে বন্ধ (Suspended) করা হয়েছে।");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const emailToUse = username.includes("@")
      ? username.toLowerCase().trim()
      : `${username.toLowerCase().trim()}@smartkhatiyan.com`;

    try {
      // Step 1: Authenticate with Firebase
      await signInWithEmailAndPassword(auth, emailToUse, password);

      // Set a cookie so the Next.js middleware knows we are logged in
      document.cookie = "__session=1; path=/; max-age=86400; SameSite=Lax";

      // Step 2: Redirect to admin — the admin layout handles role verification
      router.push("/admin");
    } catch (err: any) {
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        setError("ভুল ইমেইল বা পাসওয়ার্ড!");
      } else {
        setError("লগিন করতে সমস্যা হয়েছে: " + err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] py-20 px-4 flex items-center justify-center fade-in visible">
      <div className="w-full max-w-md">
        <div className="card-new p-8 md:p-10 border-t-4 border-t-[var(--accent)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Lock size={120} className="text-[var(--text-primary)]" />
          </div>
          
          <div className="relative z-10 text-center mb-8">
            <div className="bg-[var(--accent)]/10 text-[var(--accent)] rounded-full inline-flex p-4 mb-4 shadow-sm">
              <Lock size={32} />
            </div>
            <h3 className="font-bold text-[var(--text-primary)] text-2xl mb-2">অ্যাডমিন লগিন</h3>
            <p className="text-[var(--text-secondary)] font-medium">
              শুধুমাত্র অনুমোদিত ইউজারদের জন্য
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg p-3 text-center text-sm font-bold mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5 relative z-10">
            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-2">ইমেইল বা ইউজারনেম</label>
              <input
                type="text"
                placeholder="যেমন: admin@smartkhatiyan.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-[var(--text-primary)] font-bold mb-2">পাসওয়ার্ড</label>
              <input
                type="password"
                placeholder="পাসওয়ার্ড দিন"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg)] border border-[var(--border)] text-[var(--text-primary)] rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] transition-colors shadow-sm"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full cta-gradient text-[var(--bg)] font-bold rounded-xl px-4 py-3.5 shadow-md hover:-translate-y-0.5 transition-all flex justify-center items-center mt-4 disabled:opacity-70 disabled:hover:translate-y-0 text-lg"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-[var(--bg)] border-t-transparent rounded-full animate-spin"></span>
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
        <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
          <span className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></span>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
