import { Calculator } from "lucide-react";

export default function AppHeader() {
  return (
    <div className="text-center mb-5">
      <div
        className="d-inline-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle shadow-sm mb-3"
        style={{ width: "64px", height: "64px" }}
      >
        <Calculator size={32} />
      </div>
      <h1 className="fw-bold text-dark mb-2">স্মার্ট খতিয়ান ক্যালকুলেটর</h1>
      <p className="text-secondary">
        নির্ভুল আনা-গন্ডা হিসাব এবং আধুনিক বন্টন নামা
      </p>
    </div>
  );
}
