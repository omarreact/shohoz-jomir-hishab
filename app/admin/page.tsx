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

const quickStats = [
  {
    title: "লিভ API",
    value: "18",
    helper: "সক্রিয় এন্ডপয়েন্ট",
    icon: Zap,
    tone: "blue",
  },
  {
    title: "ল্যান্ডবিড প্রক্সি",
    value: "Online",
    helper: "লোকাল + প্রোডাকশন",
    icon: ExternalLink,
    tone: "green",
  },
  {
    title: "রেজিস্টার্ড ইউজার",
    value: "1,245",
    helper: "সক্রিয় একাউন্ট",
    icon: Users,
    tone: "yellow",
  },
  {
    title: "সিস্টেম হেলথ",
    value: "98%",
    helper: "নির্ভরযোগ্যতা",
    icon: Activity,
    tone: "red",
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
    <div className="fade-in visible" data-admin-panel="true">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">অ্যাডমিন ড্যাশবোর্ড</h1>
          <p className="text-[var(--text-secondary)]">Rajuk, Firebase এবং Landbd API-র কার্যক্রম একসাথে পর্যবেক্ষণ করুন।</p>
        </div>
        <div className="flex gap-4 flex-wrap">
          <Link href="/admin/data-monitor" className="text-decoration-none">
            <button className="px-6 py-2.5 rounded-full font-bold bg-[var(--text-primary)] text-[var(--bg)] hover:scale-105 transition-transform shadow-md">
              ডেটা মনিটর
            </button>
          </Link>
          <Link href="/" className="text-decoration-none">
            <button className="px-6 py-2.5 rounded-full font-bold border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)] transition-colors">
              ওয়েবসাইটে যান
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const toneClasses = {
            blue: "bg-blue-500 text-white",
            green: "bg-green-500 text-white",
            yellow: "bg-yellow-500 text-white",
            red: "bg-red-500 text-white",
          }[stat.tone];

          return (
            <div key={index} className={`rounded-2xl p-6 shadow-sm flex items-center justify-between ${toneClasses}`}>
              <div>
                <p className="mb-1 opacity-75 text-sm font-medium">{stat.title}</p>
                <h2 className="text-3xl font-bold mb-1">{stat.value}</h2>
                <small className="opacity-75 font-medium">{stat.helper}</small>
              </div>
              <div className="bg-white/20 p-4 rounded-xl">
                <Icon size={32} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="card-new h-full p-8 border-l-4 border-l-[var(--accent)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
              <div>
                <h5 className="font-bold text-xl text-[var(--text-primary)] mb-2">সিস্টেম অবস্থা</h5>
                <p className="text-[var(--text-secondary)] mb-0">
                  অ্যাপের মূল সেবা এবং কনফিগারেশন এক নজরে।
                </p>
              </div>
              <span className="bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-4 py-2 font-bold text-sm flex items-center shrink-0">
                <Sparkles size={16} className="mr-2" /> উন্নত মডেল
              </span>
            </div>

            <div className="space-y-4">
              {[
                [
                  "Landbd Proxy",
                  "মেইন পেজ ও API রিকোয়েস্টের জন্য প্রক্সি সক্রিয়",
                  "Online",
                  "green"
                ],
                [
                  "Rajuk Token",
                  "Firebase কনফিগে টোকেন ব্যবহারযোগ্য",
                  "Configured",
                  "blue"
                ],
                [
                  "Firebase Sync",
                  "ব্লগ, কনফিগ ও ইউজার ডেটা আপডেটেড",
                  "Healthy",
                  "green"
                ],
              ].map(([name, detail, status, color]) => (
                <div key={name} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-[var(--text-primary)] mb-1 text-lg">{name}</div>
                    <div className="text-[var(--text-secondary)] text-sm">{detail}</div>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-bold text-sm shrink-0 border ${
                    color === 'green' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                  }`}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="card-new h-full p-8">
            <div className="flex items-center gap-3 mb-8">
              <Blocks size={24} className="text-[var(--accent)]" />
              <h5 className="font-bold text-xl text-[var(--text-primary)] mb-0">দ্রুত এক্সেস</h5>
            </div>
            
            <div className="space-y-4">
              {serviceCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="block group"
                  >
                    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 flex items-center justify-between group-hover:border-[var(--accent)] transition-colors">
                      <div>
                        <div className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-[var(--accent)] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[var(--text-secondary)] text-sm">
                          {item.description}
                        </div>
                      </div>
                      <Icon size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors shrink-0 ml-4" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
