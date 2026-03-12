import { Calculator } from "lucide-react";

export default function Loading() {
  return (
    <div className="d-flex justify-content-center align-items-center flex-column fade-in" style={{ minHeight: "60vh" }}>
      <div className="bg-success bg-opacity-10 text-success p-3 rounded-circle mb-3 shadow-sm placeholder-glow">
        <Calculator size={40} className="spinner-border spinner-border-sm" role="status" />
      </div>
      <h5 className="fw-bold text-success">লোড হচ্ছে...</h5>
      <p className="text-muted small">অনুগ্রহ করে একটু অপেক্ষা করুন</p>
    </div>
  );
}