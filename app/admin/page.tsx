"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  Blocks,
  Database,
  FileText,
  PenTool,
  RefreshCw,
  Users,
  Zap,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole } from "@/src/modules/auth/roles";

type Tone = "green" | "amber" | "red" | "slate" | "blue";

type KpiCard = {
  title: string;
  value: string;
  helper: string;
  icon: typeof Users;
  tone: Tone;
};

type StatusRow = {
  name: string;
  detail: string;
  status: string;
  tone: Tone;
  href?: string;
};

const toneCard: Record<Tone, string> = {
  green:
    "bg-white dark:bg-slate-900 border border-emerald-500/25 border-l-4 border-l-emerald-500",
  amber:
    "bg-white dark:bg-slate-900 border border-amber-500/25 border-l-4 border-l-amber-500",
  red: "bg-white dark:bg-slate-900 border border-red-500/25 border-l-4 border-l-red-500",
  slate:
    "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 border-l-4 border-l-slate-400",
  blue: "bg-white dark:bg-slate-900 border border-blue-500/25 border-l-4 border-l-blue-500",
};

const tonePill: Record<Tone, string> = {
  green:
    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber:
    "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  slate:
    "bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
};

function KpiSkeleton() {
  return (
    <div className="rounded-3xl p-6 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="h-3 w-24 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-8 w-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="h-3 w-28 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
        <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}

function StatusSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 animate-pulse flex justify-between gap-4"
        >
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-3 w-48 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
          <div className="h-8 w-20 rounded-full bg-slate-200 dark:bg-slate-700" />
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const admin = isAdminRole(user?.role);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KpiCard[]>([]);
  const [statusRows, setStatusRows] = useState<StatusRow[]>([]);

  const serviceCards = useMemo(() => {
    const all = [
      {
        title: "ব্লগ ম্যানেজমেন্ট",
        description: "পোস্ট তৈরি, সম্পাদনা ও প্রকাশ নিয়ন্ত্রণ করুন।",
        href: "/admin/blog",
        icon: PenTool,
        adminOnly: false,
      },
      {
        title: "কাস্টম পেজ",
        description: "স্থির পেজ ও কন্টেন্ট পরিচালনা করুন।",
        href: "/admin/custom-pages",
        icon: FileText,
        adminOnly: false,
      },
      {
        title: "ডেটা মনিটর",
        description: "Rajuk, Firebase ও LandBD API-র অবস্থা দেখুন।",
        href: "/admin/data-monitor",
        icon: BarChart3,
        adminOnly: true,
      },
      {
        title: "ইউজার ম্যানেজমেন্ট",
        description: "রোল ও অ্যাক্সেস নিয়ন্ত্রণ করুন।",
        href: "/admin/users",
        icon: Users,
        adminOnly: true,
      },
      {
        title: "সেটিংস",
        description: "সাইট কনফিগ ও রক্ষণাবেক্ষণ মোড।",
        href: "/admin/settings",
        icon: Database,
        adminOnly: true,
      },
    ];
    return all.filter((c) => (c.adminOnly ? admin : true));
  }, [admin]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/dashboard-kpis", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ড্যাশবোর্ড ডেটা লোড হয়নি");

      const blogCount =
        typeof data.blogCount === "number" ? data.blogCount : null;
      const pageCount =
        typeof data.pageCount === "number" ? data.pageCount : null;
      const userCount =
        typeof data.userCount === "number" ? data.userCount : null;
      const rajukSet = data.rajukTokenSet === true;
      const maintenance = data.maintenanceMode === true;
      const dbOk = data.database?.connected === true;
      const healthStatus = data.healthStatus as string | null;
      const latency =
        typeof data.database?.latency === "number"
          ? data.database.latency
          : null;

      const nextKpis: KpiCard[] = [];

      if (userCount != null) {
        nextKpis.push({
          title: "মোট ইউজার",
          value: userCount.toLocaleString("bn-BD"),
          helper: "রেজিস্টার্ড অ্যাকাউন্ট",
          icon: Users,
          tone: "blue",
        });
      }

      nextKpis.push({
        title: "ব্লগ পোস্ট",
        value: blogCount != null ? blogCount.toLocaleString("bn-BD") : "—",
        helper:
          pageCount != null
            ? `${pageCount.toLocaleString("bn-BD")} কাস্টম পেজ`
            : "কন্টেন্ট",
        icon: FileText,
        tone: "green",
      });

      if (data.rajukTokenSet != null) {
        nextKpis.push({
          title: "রাজউক টোকেন",
          value: rajukSet ? "সেট" : "নেই",
          helper: rajukSet ? "কনফিগার করা আছে" : "সেটিংস থেকে যোগ করুন",
          icon: Zap,
          tone: rajukSet ? "green" : "amber",
        });
      }

      if (healthStatus != null) {
        nextKpis.push({
          title: "সিস্টেম হেলথ",
          value:
            healthStatus === "healthy"
              ? "সচল"
              : healthStatus === "degraded"
                ? "দুর্বল"
                : "বন্ধ",
          helper:
            latency != null
              ? `DB ${latency} ms`
              : maintenance
                ? "রক্ষণাবেক্ষণ মোড চালু"
                : "Firestore",
          icon: Activity,
          tone:
            healthStatus === "healthy"
              ? "green"
              : healthStatus === "degraded"
                ? "amber"
                : "red",
        });
      }

      if (nextKpis.length < 2 && pageCount != null) {
        nextKpis.push({
          title: "কাস্টম পেজ",
          value: pageCount.toLocaleString("bn-BD"),
          helper: "সম্পাদনাযোগ্য পেজ",
          icon: FileText,
          tone: "slate",
        });
      }

      setKpis(nextKpis);

      if (data.database != null || data.rajukTokenSet != null) {
        setStatusRows([
          {
            name: "Firebase / Firestore",
            detail: dbOk
              ? "ইউজার, ব্লগ ও সেটিংস সিঙ্ক সচল"
              : "ডাটাবেস সংযোগ যাচাই করুন",
            status: dbOk ? "সচল" : "সমস্যা",
            tone: dbOk ? "green" : "red",
            href: "/admin/data-monitor",
          },
          {
            name: "Rajuk Token",
            detail: rajukSet
              ? "সাইট সেটিংসে টোকেন সংরক্ষিত"
              : "টোকেন সেট করা হয়নি",
            status: rajukSet ? "কনফিগারড" : "অনুপস্থিত",
            tone: rajukSet ? "green" : "amber",
            href: "/admin/settings",
          },
          {
            name: "রক্ষণাবেক্ষণ মোড",
            detail: maintenance
              ? "পাবলিক সাইট লক থাকতে পারে"
              : "পাবলিক সাইট উন্মুক্ত",
            status: maintenance ? "চালু" : "বন্ধ",
            tone: maintenance ? "amber" : "green",
            href: "/admin/settings",
          },
        ]);
      } else {
        setStatusRows([
          {
            name: "কন্টেন্ট ওয়ার্কস্পেস",
            detail: "ব্লগ ও কাস্টম পেজ সম্পাদনা করতে দ্রুত এক্সেস ব্যবহার করুন",
            status: "প্রস্তুত",
            tone: "green",
            href: "/admin/blog",
          },
        ]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "লোড ব্যর্থ");
      setKpis([]);
      setStatusRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="fade-in visible" data-admin-panel="true">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            অ্যাডমিন ড্যাশবোর্ড
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {admin
              ? "ইউজার, কন্টেন্ট ও সিস্টেম স্বাস্থ্য — লাইভ ডেটা।"
              : "ব্লগ ও পেজ পরিচালনা — আপনার ওয়ার্কস্পেস।"}
            {user?.role ? (
              <span className="ml-2 text-xs font-semibold text-[#006a4e]">
                ({user.role})
              </span>
            ) : null}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="px-5 py-2.5 rounded-full font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm inline-flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            রিফ্রেশ
          </button>
          {admin && (
            <Link href="/admin/data-monitor" className="text-decoration-none">
              <button className="px-6 py-2.5 rounded-full font-bold bg-[#006a4e] text-white hover:bg-[#00523b] hover:-translate-y-0.5 transition-all shadow-md">
                ডেটা মনিটর
              </button>
            </Link>
          )}
          <Link href="/" className="text-decoration-none">
            <button className="px-6 py-2.5 rounded-full font-bold border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
              ওয়েবসাইটে যান
            </button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
          <span>{error}</span>
          <button type="button" className="font-bold underline" onClick={() => void load()}>
            আবার চেষ্টা
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {loading
          ? [0, 1, 2, 3].map((i) => <KpiSkeleton key={i} />)
          : kpis.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.title}
                  className={`rounded-3xl p-6 shadow-sm flex items-center justify-between ${toneCard[stat.tone]}`}
                >
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                      {stat.title}
                    </p>
                    <h2 className="text-3xl font-bold mb-1 text-slate-900 dark:text-white">
                      {stat.value}
                    </h2>
                    <small className="font-medium text-slate-500 dark:text-slate-400">
                      {stat.helper}
                    </small>
                  </div>
                  <div className="bg-[#006a4e]/10 text-[#006a4e] p-4 rounded-2xl">
                    <Icon size={28} />
                  </div>
                </div>
              );
            })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm h-full p-8 border-l-4 border-l-[#006a4e]">
            <div className="mb-8">
              <h5 className="font-bold text-xl text-slate-900 dark:text-white mb-2">
                {admin ? "সিস্টেম অবস্থা" : "কাজের সারাংশ"}
              </h5>
              <p className="text-slate-500 dark:text-slate-400 mb-0">
                {admin
                  ? "Firebase, রাজউক ও রক্ষণাবেক্ষণ — বিস্তারিত লিংক সহ।"
                  : "কন্টেন্ট ওয়ার্কস্পেসের দ্রুত অবস্থা।"}
              </p>
            </div>

            {loading ? (
              <StatusSkeleton />
            ) : (
              <div className="space-y-4">
                {statusRows.map((row) => {
                  const inner = (
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-[#006a4e]/40 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white mb-1 text-lg">
                          {row.name}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">
                          {row.detail}
                          {row.href ? (
                            <span className="ml-2 text-[#006a4e] font-semibold text-xs">
                              বিস্তারিত →
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <span
                        className={`px-4 py-2 rounded-full font-bold text-sm shrink-0 border ${tonePill[row.tone]}`}
                      >
                        {row.status}
                      </span>
                    </div>
                  );
                  return row.href ? (
                    <Link key={row.name} href={row.href} className="block no-underline">
                      {inner}
                    </Link>
                  ) : (
                    <div key={row.name}>{inner}</div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="xl:col-span-1">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm h-full p-8">
            <div className="flex items-center gap-3 mb-8">
              <Blocks size={24} className="text-[#006a4e]" />
              <h5 className="font-bold text-xl text-slate-900 dark:text-white mb-0">
                দ্রুত এক্সেস
              </h5>
            </div>

            <div className="space-y-4">
              {serviceCards.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} href={item.href} className="block group">
                    <div className="bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex items-center justify-between group-hover:border-[#006a4e]/50 transition-colors">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-[#006a4e] transition-colors">
                          {item.title}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-sm">
                          {item.description}
                        </div>
                      </div>
                      <Icon
                        size={24}
                        className="text-slate-400 group-hover:text-[#006a4e] transition-colors shrink-0 ml-4"
                      />
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
