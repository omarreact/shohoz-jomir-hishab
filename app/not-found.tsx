import Link from "next/link";
import { AlertTriangle, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container py-5 text-center fade-in d-flex flex-column justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
      <AlertTriangle size={80} className="text-warning mb-4" />
      <h1 className="fw-bold display-4 text-dark mb-2">৪0৪</h1>
      <h4 className="text-secondary mb-4">দুঃখিত! আপনি যে পেজটি খুঁজছেন তা পাওয়া যায়নি।</h4>
      <p className="text-muted mb-4">হয়তো লিংকটি পরিবর্তন করা হয়েছে অথবা মুছে ফেলা হয়েছে।</p>
      <Link href="/" className="btn btn-success rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center shadow-sm">
        <Home size={18} className="me-2" /> হোমপেজে ফিরে যান
      </Link>
    </div>
  );
}