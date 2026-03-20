"use client";

import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Ruler,
  Users,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ArrowUpRight,
  Sparkles,
  Scale,
  LucideIcon,
} from "lucide-react";
import LatestBlogs from "@/components/shared/LatestBlogs";

// ==========================================
// Reusable Feature Card Component
// ==========================================
interface FeatureCardProps {
  href: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  Icon: LucideIcon;
}

function FeatureCard({
  href,
  title,
  description,
  badge,
  badgeColor,
  Icon,
}: FeatureCardProps) {
  return (
    <Link href={href} className="text-decoration-none h-100 d-block">
      <div className="card h-100 border-0 shadow-sm rounded-4 transition-all hover-shadow bg-white overflow-hidden">
        <div className="card-body p-4 p-xl-5 position-relative">
          <div
            className="position-absolute top-0 end-0 opacity-10 translate-middle-y me-n4 mt-4"
            style={{ pointerEvents: "none" }}
          >
            <Icon size={120} className="text-success" />
          </div>

          <div className="d-flex justify-content-between align-items-start mb-4 position-relative z-1">
            <div
              className="bg-success bg-opacity-10 rounded-4 d-flex align-items-center justify-content-center"
              style={{ width: 65, height: 65 }}
            >
              <Icon size={32} className="text-success" />
            </div>
            {badge && (
              <span
                className={`badge bg-${badgeColor} rounded-pill px-3 py-2 fw-bold shadow-sm d-flex align-items-center`}
              >
                {badge === "New" && <Sparkles size={14} className="me-1" />}{" "}
                {badge}
              </span>
            )}
          </div>

          <h4 className="fw-bold mb-3 text-dark position-relative z-1">
            {title}
          </h4>
          <p className="text-secondary mb-4 position-relative z-1 lh-lg">
            {description}
          </p>

          <div className="d-inline-flex align-items-center fw-bold text-success position-relative z-1 mt-auto">
            হিসাব শুরু করুন <ArrowRight size={18} className="ms-2" />
          </div>
        </div>
      </div>
    </Link>
  );
}
// ==========================================
// Main Home Page Component
// ==========================================
export default function HomePage() {
  return (
    <div className="fade-in">
      {/* ==========================================
          Hero Section (Modern & Eye-Catching)
          ========================================== */}
      <section
        className="position-relative overflow-hidden py-5 hero-banner"
        style={{ backgroundColor: "#f8fafc" }}
      >
        {/* Decorative Blur Orbs */}
        <div
          className="position-absolute top-0 start-0 translate-middle bg-success bg-opacity-20 rounded-circle blur-effect"
          style={{ width: "400px", height: "400px", filter: "blur(80px)" }}
        ></div>
        <div
          className="position-absolute bottom-0 end-0 translate-middle-y bg-primary bg-opacity-10 rounded-circle blur-effect"
          style={{ width: "500px", height: "500px", filter: "blur(100px)" }}
        ></div>

        <div className="container py-4 py-lg-5 position-relative z-1">
          <div className="row align-items-center g-5">
            {/* Left Content */}
            <div className="col-lg-6 text-center text-lg-start">
              <div
                className="d-inline-flex align-items-center bg-white rounded-pill px-3 py-2 shadow-sm mb-4 border border-success border-opacity-25 fade-in"
                style={{ animationDelay: "0.1s" }}
              >
                <span className="badge bg-danger rounded-pill me-2 px-3">
                  ১০০% ফ্রি
                </span>
                <span className="text-dark small fw-bold">
                  বাংলাদেশের সবচেয়ে নির্ভুল ভূমি ক্যালকুলেটর!
                </span>
              </div>

              <h1
                className="fw-bolder display-4 mb-4 text-dark lh-sm fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                ভূমি হিসাব ও ফারায়েজের <br className="d-none d-lg-block" />
                <span className="text-success position-relative">
                  সবচেয়ে স্মার্ট সমাধান
                  <svg
                    className="position-absolute w-100 start-0 bottom-0"
                    viewBox="0 0 100 15"
                    preserveAspectRatio="none"
                    style={{
                      height: "12px",
                      transform: "translateY(5px)",
                      opacity: 0.3,
                    }}
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
                style={{ maxWidth: "550px", animationDelay: "0.3s" }}
              >
                খতিয়ানের আনা-গন্ডা, জমির সঠিক পরিমাপ এবং আইনি উত্তরাধিকার
                (ফারায়েজ)—সবকিছুর নির্ভুল হিসাব করুন এক ক্লিকেই। কোনো
                খাতা-কলমের প্রয়োজন নেই!
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
                  className="btn btn-white btn-lg rounded-pill px-4 py-3 fw-bold d-flex align-items-center shadow-sm border hover-shadow bg-white text-dark"
                >
                  <Ruler size={20} className="me-2 text-primary" /> জমি পরিমাপ
                </Link>
              </div>
            </div>

            {/* Right Content (Floating Cards Grid) */}
            <div
              className="col-lg-6 d-none d-lg-block fade-in"
              style={{ animationDelay: "0.5s" }}
            >
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
                    <p className="text-muted small mb-0">
                      কোরআনিক নিয়মে ফারায়েজ
                    </p>
                  </div>
                  <div className="bg-dark p-4 rounded-4 shadow-lg border-0 text-center hover-shadow">
                    <div className="bg-white bg-opacity-10 rounded-circle d-inline-flex p-3 mb-3">
                      <Calculator size={36} className="text-white" />
                    </div>
                    <h5 className="fw-bold text-white">আনা-গন্ডা হিসাব</h5>
                    <p className="text-white text-opacity-75 small mb-0">
                      সিএস, এসএ, আরএস খতিয়ান
                    </p>
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
                    <p className="text-muted small mb-0">
                      জমি ক্রয়-বিক্রয় ব্লগ
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container pb-5">
        {/* ==========================================
            Features Grid
            ========================================== */}
        <div className="text-center mb-5 pb-2 pt-5">
          <span className="text-success fw-bold tracking-wider text-uppercase small bg-success bg-opacity-10 px-3 py-1 rounded-pill mb-3 d-inline-block">
            সার্ভিসেস
          </span>
          <h2 className="fw-bold text-dark display-6 mb-3">
            আমাদের প্রধান সেবাসমূহ
          </h2>
          <p
            className="text-secondary fs-6 mx-auto"
            style={{ maxWidth: "600px" }}
          >
            আপনার প্রয়োজনীয় ক্যালকুলেটরটি বেছে নিন এবং সেকেন্ডের মধ্যে নিখুঁত
            হিসাব বের করুন।
          </p>
        </div>

        <div className="row g-4 mb-5 pb-4">
          <div className="col-md-6">
            <FeatureCard
              href="/khatiyan"
              title="খতিয়ান ক্যালকুলেটর"
              description="সিএস, এসএ, আরএস খতিয়ানের আনা-গন্ডা, কড়া, ক্রান্তি দিয়ে অংশীদারদের জমির সঠিক পরিমাণ বের করুন খুব সহজেই।"
              Icon={Calculator}
            />
          </div>
          <div className="col-md-6">
            <FeatureCard
              href="/faraez"
              title="ফারায়েজ ক্যালকুলেটর"
              description="মুসলিম ও হিন্দু উত্তরাধিকার আইন অনুযায়ী ওয়ারিশদের মাঝে জমি, স্বর্ণ ও নগদ অর্থ নির্ভুলভাবে বন্টন করুন।"
              badge="New"
              badgeColor="danger"
              Icon={Users}
            />
          </div>
          <div className="col-md-6">
            <FeatureCard
              href="/land-measurement"
              title="জমি মাপ ক্যালকুলেটর"
              description="চার বাহু এবং কর্ণ (Heron's formula) ব্যবহার করে আয়তাকার বা আঁকাবাঁকা জমির নিখুঁত ক্ষেত্রফল বের করুন।"
              badge="Popular"
              badgeColor="primary"
              Icon={Ruler}
            />
          </div>
          <div className="col-md-6">
            <FeatureCard
              href="/blog"
              title="ভূমি ও আইন ব্লগ"
              description="ভূমি বিষয়ক আইন, দলিল রেজিস্ট্রি, নামজারি, এবং আইনি পরামর্শ সংক্রান্ত আমাদের বিশেষজ্ঞদের লেখা আর্টিকেল পড়ুন।"
              Icon={BookOpen}
            />
          </div>
        </div>

        {/* ==========================================
            Why Choose Us Section (Dark Contrast)
            ========================================== */}
        <div className="bg-dark rounded-4 p-4 p-lg-5 shadow-lg position-relative overflow-hidden mb-5">
          {/* Background Pattern */}
          <div
            className="position-absolute top-0 end-0 opacity-10 w-100 h-100"
            style={{
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "30px 30px",
            }}
          ></div>

          <div className="row g-5 align-items-center position-relative z-1">
            <div className="col-lg-5 text-center text-lg-start">
              <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2 mb-3 border border-success border-opacity-50">
                কেন আমরা সেরা?
              </span>
              <h3 className="fw-bold text-white mb-4 display-6">
                কেন সহজ জমির হিসাব ব্যবহার করবেন?
              </h3>
              <p className="text-light text-opacity-75 fs-5 mb-4 lh-lg">
                আমরা মানুষের ভূমি সংক্রান্ত জটিল হিসাবগুলোকে সহজ, দ্রুত এবং
                নির্ভুল করার লক্ষ্যে কাজ করছি।
              </p>
              <Link
                href="/p/about-us"
                className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center"
              >
                আমাদের সম্পর্কে জানুন{" "}
                <ArrowUpRight size={18} className="ms-2" />
              </Link>
            </div>

            <div className="col-lg-7">
              <div className="row g-4">
                <div className="col-sm-6">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-10 p-4 rounded-4 h-100 backdrop-blur">
                    <ShieldCheck size={40} className="text-success mb-3" />
                    <h5 className="fw-bold text-white mb-2">১০০% নিরাপদ</h5>
                    <p className="text-light text-opacity-50 small mb-0 lh-lg">
                      আপনার কোনো ব্যক্তিগত ডাটা বা জমির তথ্য আমাদের সার্ভারে
                      সংরক্ষণ করা হয় না।
                    </p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-10 p-4 rounded-4 h-100 backdrop-blur">
                    <CheckCircle2 size={40} className="text-primary mb-3" />
                    <h5 className="fw-bold text-white mb-2">সরকারি সূত্র</h5>
                    <p className="text-light text-opacity-50 small mb-0 lh-lg">
                      প্রচলিত সরকারি আইন এবং আধুনিক জ্যামিতিক সূত্রের সাহায্যে
                      একদম নিখুঁত ফলাফল।
                    </p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-10 p-4 rounded-4 h-100 backdrop-blur">
                    <Smartphone size={40} className="text-warning mb-3" />
                    <h5 className="fw-bold text-white mb-2">
                      ডিভাইস ফ্রেন্ডলি
                    </h5>
                    <p className="text-light text-opacity-50 small mb-0 lh-lg">
                      মোবাইল, ট্যাবলেট বা কম্পিউটার—যেকোনো ডিভাইস থেকে খুব সহজেই
                      ব্যবহারযোগ্য।
                    </p>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-10 p-4 rounded-4 h-100 backdrop-blur">
                    <Sparkles size={40} className="text-danger mb-3" />
                    <h5 className="fw-bold text-white mb-2">সবার জন্য ফ্রি</h5>
                    <p className="text-light text-opacity-50 small mb-0 lh-lg">
                      কোনো লুকানো চার্জ নেই। দেশের মানুষের উপকারের জন্য এটি
                      আজীবন ফ্রি থাকবে।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================
            Latest Blogs Section
            ========================================== */}
        <LatestBlogs />
      </div>
    </div>
  );
}
