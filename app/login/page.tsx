"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // 유জারনেমকে ইমেইলে কনভার্ট করা হচ্ছে (যেহেতু ফায়ারবেস ইমেইল সাপোর্ট করে)
    const email = `${username.toLowerCase()}@smartkhatiyan.com`;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/blog");
    } catch (err) {
      setError("ভুল ইউজারনেম বা পাসওয়ার্ড!");
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
                <label className="form-label text-muted fw-bold small">ইউজারনেম</label>
                <input type="text" className="form-control" placeholder="যেমন: admin" value={username} onChange={(e) => setUsername(e.target.value)} required />
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