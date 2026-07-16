import Link from "next/link";
import { ShieldCheck, CheckCircle2, Smartphone, Sparkles, ArrowUpRight } from "lucide-react";

const pillars = [
  {
    Icon: ShieldCheck,
    color: "text-success",
    title: "১০০% নিরাপদ",
    body: "আপনার কোনো ব্যক্তিগত ডাটা বা জমির তথ্য আমাদের সার্ভারে সংরক্ষণ করা হয় না।",
  },
  {
    Icon: CheckCircle2,
    color: "text-primary",
    title: "সরকারি সূত্র",
    body: "প্রচলিত সরকারি আইন এবং আধুনিক জ্যামিতিক সূত্রের সাহায্যে একদম নিখুঁত ফলাফল।",
  },
  {
    Icon: Smartphone,
    color: "text-warning",
    title: "ডিভাইস ফ্রেন্ডলি",
    body: "মোবাইল, ট্যাবলেট বা কম্পিউটার—যেকোনো ডিভাইস থেকে খুব সহজেই ব্যবহারযোগ্য।",
  },
  {
    Icon: Sparkles,
    color: "text-danger",
    title: "সবার জন্য ফ্রি",
    body: "কোনো লুকানো চার্জ নেই। দেশের মানুষের উপকারের জন্য এটি আজীবন ফ্রি থাকবে।",
  },
];

/**
 * "Why Choose Us" dark-contrast section.
 * Pure server component — no state or effects.
 */
export default function WhyUsSection() {
  return (
    <section className="container pb-5">
      <div className="bg-dark rounded-4 p-4 p-lg-5 shadow-lg position-relative overflow-hidden mb-5">
        {/* Dot pattern background */}
        <div
          className="position-absolute top-0 end-0 opacity-10 w-100 h-100"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "30px 30px",
          }}
        />

        <div className="row g-5 align-items-center position-relative z-1">
          {/* Left: text + CTA */}
          <div className="col-lg-5 text-center text-lg-start">
            <span className="badge bg-success bg-opacity-25 text-success rounded-pill px-3 py-2 mb-3 border border-success border-opacity-50">
              কেন আমরা সেরা?
            </span>
            <h3 className="fw-bold text-white mb-4 display-6">
              কেন LandBD ব্যবহার করবেন?
            </h3>
            <p className="text-light text-opacity-75 fs-5 mb-4 lh-lg">
              আমরা মানুষের ভূমি সংক্রান্ত জটিল হিসাবগুলোকে সহজ, দ্রুত এবং নির্ভুল করার
              লক্ষ্যে কাজ করছি।
            </p>
            <Link
              href="/p/about-us"
              className="btn btn-outline-light rounded-pill px-4 py-2 fw-bold d-inline-flex align-items-center"
            >
              আমাদের সম্পর্কে জানুন <ArrowUpRight size={18} className="ms-2" />
            </Link>
          </div>

          {/* Right: 4 pillar cards */}
          <div className="col-lg-7">
            <div className="row g-4">
              {pillars.map(({ Icon, color, title, body }) => (
                <div key={title} className="col-sm-6">
                  <div className="bg-white bg-opacity-10 border border-white border-opacity-10 p-4 rounded-4 h-100 backdrop-blur">
                    <Icon size={40} className={`${color} mb-3`} />
                    <h5 className="fw-bold text-white mb-2">{title}</h5>
                    <p className="text-light text-opacity-50 small mb-0 lh-lg">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
