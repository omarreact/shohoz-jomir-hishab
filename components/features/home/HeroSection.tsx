import Link from "next/link";
import { Calculator, Ruler, Scale, BookOpen, ArrowRight, Map } from "lucide-react";

/**
 * Hero Section — the above-the-fold landing section with headline,
 * CTA buttons, and the floating card grid on the right (desktop).
 * Pure server component — no client state needed.
 */
export default function HeroSection() {
  return (
    <section
      className="position-relative overflow-hidden py-5 hero-banner"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Decorative blur orbs */}
      <div
        className="position-absolute top-0 start-0 translate-middle bg-success bg-opacity-20 rounded-circle"
        style={{ width: 400, height: 400, filter: "blur(80px)", pointerEvents: "none" }}
      />
      <div
        className="position-absolute bottom-0 end-0 translate-middle-y bg-primary bg-opacity-10 rounded-circle"
        style={{ width: 500, height: 500, filter: "blur(100px)", pointerEvents: "none" }}
      />

      <div className="container py-4 py-lg-5 position-relative z-1">
        <div className="row align-items-center g-5">

          {/* ── Left: Headline + CTA ─────────────────────────────── */}
          <div className="col-lg-6 text-center text-lg-start">
            <div
              className="d-inline-flex align-items-center bg-white rounded-pill px-3 py-2 shadow-sm mb-4 border border-success border-opacity-25 fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="badge bg-danger rounded-pill me-2 px-3">১০০% ফ্রি</span>
              <span className="text-dark small fw-bold">বাংলাদেশের সবচেয়ে নির্ভুল ভূমি ক্যালকুলেটর!</span>
            </div>

            <h1
              className="fw-bolder display-4 mb-4 text-dark lh-sm fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              ভূমি হিসাব ও ফারায়েজের{" "}
              <br className="d-none d-lg-block" />
              <span className="text-success position-relative">
                সবচেয়ে স্মার্ট সমাধান
                <svg
                  className="position-absolute w-100 start-0 bottom-0"
                  viewBox="0 0 100 15"
                  preserveAspectRatio="none"
                  style={{ height: 12, transform: "translateY(5px)", opacity: 0.3 }}
                >
                  <path
                    d="M0 10 Q 50 0 100 10"
                    stroke="var(--bs-success)"
                    strokeWidth="4"
                    fill="transparent"
                  />
                </svg>
              </span>
            </h1>

            <p
              className="text-secondary mb-5 fs-5 lh-lg fade-in"
              style={{ maxWidth: 550, animationDelay: "0.3s" }}
            >
              খতিয়ানের আনা-গন্ডা, জমির সঠিক পরিমাপ এবং আইনি উত্তরাধিকার
              (ফারায়েজ)—সবকিছুর নির্ভুল হিসাব করুন এক ক্লিকেই। কোনো
              খাতা-কলমের প্রয়োজন নেই!
            </p>

            <div
              className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-3 fade-in"
              style={{ animationDelay: "0.4s" }}
            >
              <Link
                href="/khatiyan"
                className="btn btn-success btn-lg rounded-pill px-4 py-3 fw-bold shadow-lg d-flex align-items-center hover-shadow"
              >
                <Calculator size={20} className="me-2" /> খতিয়ান ক্যালকুলেটর
              </Link>
              <Link
                href="/land-measurement"
                className="btn btn-lg rounded-pill px-4 py-3 fw-bold d-flex align-items-center shadow-sm border hover-shadow bg-white text-dark"
              >
                <Ruler size={20} className="me-2 text-primary" /> জমি পরিমাপ
              </Link>
            </div>

            {/* Quick-access chip row */}
            <div className="d-flex flex-wrap gap-2 mt-4 justify-content-center justify-content-lg-start">
              <Link href="/dap-map" className="badge bg-dark text-white text-decoration-none px-3 py-2 rounded-pill fw-normal d-flex align-items-center gap-1">
                <Map size={13} /> ফুল ড্যাপ ম্যাপ
              </Link>
              <Link href="/faraez" className="badge bg-dark text-white text-decoration-none px-3 py-2 rounded-pill fw-normal d-flex align-items-center gap-1">
                <ArrowRight size={13} /> ফারায়েজ ক্যালকুলেটর
              </Link>
              <Link href="/blog" className="badge bg-dark text-white text-decoration-none px-3 py-2 rounded-pill fw-normal d-flex align-items-center gap-1">
                <BookOpen size={13} /> ভূমি ব্লগ
              </Link>
            </div>
          </div>

          {/* ── Right: Floating Cards (desktop only) ──────────────── */}
          <div className="col-lg-6 d-none d-lg-block fade-in" style={{ animationDelay: "0.5s" }}>
            <div className="row g-4 align-items-center">
              <div className="col-6">
                <div
                  className="bg-white p-4 rounded-4 shadow-lg border-0 mb-4 text-center hover-shadow"
                  style={{ transform: "translateY(20px)" }}
                >
                  <div className="bg-success bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <Scale size={36} className="text-success" />
                  </div>
                  <h5 className="fw-bold text-dark">নির্ভুল বন্টন</h5>
                  <p className="text-muted small mb-0">কোরআনিক নিয়মে ফারায়েজ</p>
                </div>
                <div className="bg-dark p-4 rounded-4 shadow-lg border-0 text-center hover-shadow">
                  <div className="bg-white bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <Calculator size={36} className="text-white" />
                  </div>
                  <h5 className="fw-bold text-white">আনা-গন্ডা হিসাব</h5>
                  <p className="text-white text-opacity-75 small mb-0">সিএস, এসএ, আরএস খতিয়ান</p>
                </div>
              </div>
              <div className="col-6">
                <div
                  className="bg-white p-4 rounded-4 shadow-lg border-0 mb-4 text-center hover-shadow"
                  style={{ transform: "translateY(-20px)" }}
                >
                  <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <Ruler size={36} className="text-primary" />
                  </div>
                  <h5 className="fw-bold text-dark">জমি মাপ</h5>
                  <p className="text-muted small mb-0">স্কয়ার ফিট ও শতাংশ</p>
                </div>
                <div className="bg-white p-4 rounded-4 shadow-lg border-0 text-center hover-shadow position-relative overflow-hidden">
                  <div className="bg-danger bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                    <BookOpen size={36} className="text-danger" />
                  </div>
                  <h5 className="fw-bold text-dark">আইনি পরামর্শ</h5>
                  <p className="text-muted small mb-0">জমি ক্রয়-বিক্রয় ব্লগ</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
