"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Blocks,
  Database,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const quickStats = [
  {
    title: "লিভ API",
    value: "18",
    helper: "সক্রিয় এন্ডপয়েন্ট",
    icon: Zap,
    tone: "primary",
  },
  {
    title: "ল্যান্ডবিড প্রক্সি",
    value: "Online",
    helper: "লোকাল + প্রোডাকশন",
    icon: ExternalLink,
    tone: "success",
  },
  {
    title: "রেজিস্টার্ড ইউজার",
    value: "1,245",
    helper: "সক্রিয় একাউন্ট",
    icon: Users,
    tone: "warning",
  },
  {
    title: "সিস্টেম হেলথ",
    value: "98%",
    helper: "নির্ভরযোগ্যতা",
    icon: Activity,
    tone: "danger",
  },
];

const serviceCards = [
  {
    title: "ডেটা মনিটর",
    description: "সকল Rajuk, Firebase ও Landbd API-র বর্তমান অবস্থা দেখুন।",
    href: "/admin/data-monitor",
    icon: BarChart3,
  },
  {
    title: "রাজউক কনফিগ",
    description: "টোকেন, API সেটিংস ও কনফিগারেশন পরিচালনা করুন।",
    href: "/admin/rajuk-config",
    icon: Database,
  },
  {
    title: "ইউজার ম্যানেজমেন্ট",
    description: "অ্যাডমিন এবং ইউজারদের অ্যাক্সেস কন্ট্রোল বজায় রাখুন।",
    href: "/admin/users",
    icon: Users,
  },
];

export default function AdminDashboard() {
  return (
    <div className="fade-in" data-admin-panel="true">
      <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-4">
        <SectionHeader 
          title="অ্যাডমিন ড্যাশবোর্ড" 
          subtitle="Rajuk, Firebase এবং Landbd API-র কার্যক্রম একসাথে পর্যবেক্ষণ করুন।"
          className="mb-0"
        />
        <div className="d-flex gap-2 flex-wrap">
          <Link href="/admin/data-monitor" className="text-decoration-none">
            <Button variant="primary" className="rounded-pill px-3" leftIcon={<BarChart3 size={16} />}>
              ডেটা মনিটর
            </Button>
          </Link>
          <Link href="/" className="text-decoration-none">
            <Button variant="outline" className="rounded-pill px-3" leftIcon={<ExternalLink size={16} />}>
              ওয়েবসাইটে যান
            </Button>
          </Link>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const toneClass =
            stat.tone === "primary"
              ? "bg-primary"
              : stat.tone === "success"
                ? "bg-success"
                : stat.tone === "warning"
                  ? "bg-warning"
                  : "bg-danger";

          return (
            <div className="col-md-6 col-xl-3" key={index}>
              <div
                className={`card border-0 rounded-4 text-white shadow-sm h-100 ${toneClass}`}
              >
                <div className="card-body p-4 d-flex align-items-center justify-content-between">
                  <div>
                    <p className="mb-1 opacity-75 small">{stat.title}</p>
                    <h2 className="fw-bold mb-0">{stat.value}</h2>
                    <small className="opacity-75">{stat.helper}</small>
                  </div>
                  <Icon size={34} className="opacity-50" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="row g-4 mb-4">
        <div className="col-xl-8">
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "var(--card-bg)" }}>
            <CardBody className="p-4">
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div>
                  <h5 className="fw-bold mb-1 text-white">সিস্টেম অবস্থা</h5>
                  <p className="text-secondary small mb-0">
                    অ্যাপের মূল সেবা এবং কনফিগারেশন এক নজরে।
                  </p>
                </div>
                <span className="badge bg-primary bg-opacity-25 text-primary rounded-pill px-3 py-2 border border-primary border-opacity-25">
                  <Sparkles size={14} className="me-1" /> উন্নত মডেল
                </span>
              </div>

              <div className="row g-3">
                {[
                  [
                    "Landbd Proxy",
                    "মেইন পেজ ও API রিকোয়েস্টের জন্য প্রক্সি সক্রিয়",
                    "Online",
                  ],
                  [
                    "Rajuk Token",
                    "Firebase কনফিগে টোকেন ব্যবহারযোগ্য",
                    "Configured",
                  ],
                  [
                    "Firebase Sync",
                    "ব্লগ, কনফিগ ও ইউজার ডেটা আপডেটেড",
                    "Healthy",
                  ],
                ].map(([name, detail, status]) => (
                  <div className="col-12" key={name}>
                    <div className="border border-secondary border-opacity-25 rounded-3 p-3 d-flex align-items-center justify-content-between" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                      <div>
                        <div className="fw-bold text-white mb-1">{name}</div>
                        <div className="small text-secondary">{detail}</div>
                      </div>
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2">
                        {status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        <div className="col-xl-4">
          <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: "var(--card-bg)" }}>
            <CardBody className="p-4">
              <div className="d-flex align-items-center gap-2 mb-4">
                <Blocks size={18} className="text-primary" />
                <h5 className="fw-bold mb-0 text-white">দ্রুত এক্সেস</h5>
              </div>
              <div className="d-grid gap-3">
                {serviceCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="text-decoration-none"
                    >
                      <div className="border border-secondary border-opacity-25 rounded-3 p-3 d-flex align-items-center justify-content-between hover-bg-secondary transition-all" style={{ backgroundColor: "var(--card-bg-secondary)" }}>
                        <div>
                          <div className="fw-bold text-white mb-1">
                            {item.title}
                          </div>
                          <div className="small text-secondary">
                            {item.description}
                          </div>
                        </div>
                        <Icon size={18} className="text-primary opacity-75" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
