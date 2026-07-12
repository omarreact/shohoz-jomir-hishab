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
    const errorParam = searchParams.get('error');
    if (errorParam === 'not_admin') {
      setError("অ্যাক্সেস ডিনাইড: আপনি এই সিস্টেমের অ্যাডমিন নন।");
    } else if (errorParam === 'suspended') {
      setError("আপনার একাউন্টটি সাময়িকভাবে বন্ধ (Suspended) করা হয়েছে।");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const emailToUse = username.includes('@') 
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
        err.code === 'auth/invalid-credential' || 
        err.code === 'auth/wrong-password' || 
        err.code === 'auth/user-not-found'
      ) {
        setError("ভুল ইমেইল বা পাসওয়ার্ড!");
      } else {
        setError("লগিন করতে সমস্যা হয়েছে: " + err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="container py-5 fade-in">
      <div className="row justify-content-center mt-4">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="bg-success bg-opacity-10 text-success rounded-circle d-inline-flex p-3 mb-3">
                <Lock size={32} />
              </div>
              <h3 className="fw-bold">অ্যাডমিন লগিন</h3>
              <p className="text-muted small">শুধুমাত্র অনুমোদিত ইউজারদের জন্য</p>
            </div>

            {error && <div className="alert alert-danger py-2 text-center small fw-bold">{error}</div>}

            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <label className="form-label text-muted fw-bold small">ইমেইল বা ইউজারনেম</label>
                <input type="text" className="form-control" placeholder="যেমন: admin@smartkhatiyan.com" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="form-label text-muted fw-bold small">পাসওয়ার্ড</label>
                <input type="password" className="form-control" placeholder="পাসওয়ার্ড দিন" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn btn-success w-100 fw-bold d-flex justify-content-center align-items-center">
                {loading ? "লগিন হচ্ছে..." : <><LogIn size={18} className="me-2" /> লগিন করুন</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center mt-5"><div className="spinner-border text-success"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}