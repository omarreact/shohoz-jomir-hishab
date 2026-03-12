import { Calculator, RotateCcw } from "lucide-react";

// সমাধান: এখানে শুধু `: any` যুক্ত করা হয়েছে
export default function FixedActionBar({
  onCalculate,
  onClear,
}: any) {
  return (
    <div className="position-fixed bottom-0 start-0 w-100 bg-white border-top shadow-lg p-3 z-3 no-print" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="container d-flex justify-content-center gap-3">
        <button
          onClick={onClear}
          className="btn btn-outline-danger fw-bold px-4 rounded-pill d-flex align-items-center"
        >
          <RotateCcw size={18} className="me-2" /> মুছুন
        </button>
        <button
          onClick={onCalculate}
          className="btn btn-success fw-bold px-5 rounded-pill shadow-sm d-flex align-items-center"
        >
          <Calculator size={18} className="me-2" /> হিসাব করুন
        </button>
      </div>
    </div>
  );
}