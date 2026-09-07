"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  EyeOff,
  Globe2,
  LockKeyhole,
  RefreshCcw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import {
  PAGE_ACCESS_PAGES,
  getDefaultPageAccessRules,
  sanitizePageAccessRules,
  type PageAccessCategory,
  type PageAccessLevel,
} from "@/src/shared/config/pageAccess";

const ACCESS_META: Record<
  PageAccessLevel,
  {
    label: string;
    description: string;
    icon: typeof Globe2;
    badge: string;
  }
> = {
  public: {
    label: "সবার জন্য",
    description: "লগইন ছাড়াই দেখা যাবে",
    icon: Globe2,
    badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  },
  logged_in: {
    label: "লগইন প্রয়োজন",
    description: "শুধু লগইন করা ব্যবহারকারী",
    icon: LockKeyhole,
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
  },
  admin: {
    label: "অ্যাডমিন",
    description: "অ্যাডমিন ও সুপার অ্যাডমিন",
    icon: ShieldCheck,
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300",
  },
  super_admin: {
    label: "সুপার অ্যাডমিন",
    description: "শুধুমাত্র সুপার অ্যাডমিন",
    icon: ShieldAlert,
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-300",
  },
  hidden: {
    label: "বন্ধ",
    description: "কাউকেই পেজটি দেখানো হবে না",
    icon: EyeOff,
    badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

const ACCESS_LEVELS = Object.keys(ACCESS_META) as PageAccessLevel[];
const CATEGORIES = Array.from(new Set(PAGE_ACCESS_PAGES.map((page) => page.category)));

function sameRules(a: Record<string, PageAccessLevel>, b: Record<string, PageAccessLevel>) {
  return PAGE_ACCESS_PAGES.every((page) => a[page.id] === b[page.id]);
}

export default function PageAccessAdmin() {
  const { user, isLoggedIn, loading: authChecking } = useAuth();
  const [accessRules, setAccessRules] = useState<Record<string, PageAccessLevel>>(() => getDefaultPageAccessRules());
  const [savedRules, setSavedRules] = useState<Record<string, PageAccessLevel>>(() => getDefaultPageAccessRules());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchText, setSearchText] = useState("");
  const [category, setCategory] = useState<PageAccessCategory | "সব">("সব");
  const [accessFilter, setAccessFilter] = useState<PageAccessLevel | "সব">("সব");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [updatedBy, setUpdatedBy] = useState<string | null>(null);

  const allowed = isLoggedIn && isSuperAdminRole(user?.role);

  const loadRules = async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/page-access", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "পেজ অনুমতি লোড করা যায়নি।");

      const next = sanitizePageAccessRules(data?.access);
      setAccessRules(next);
      setSavedRules(next);
      setUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : null);
      setUpdatedBy(typeof data?.updatedBy === "string" ? data.updatedBy : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "পেজ অনুমতি লোড করা যায়নি।");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authChecking) return;
    void loadRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authChecking, allowed]);

  const dirty = useMemo(() => !sameRules(accessRules, savedRules), [accessRules, savedRules]);
  const dirtyCount = useMemo(
    () => PAGE_ACCESS_PAGES.filter((page) => accessRules[page.id] !== savedRules[page.id]).length,
    [accessRules, savedRules],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(ACCESS_LEVELS.map((level) => [level, 0])) as Record<PageAccessLevel, number>;
    PAGE_ACCESS_PAGES.forEach((page) => {
      result[accessRules[page.id] ?? page.defaultAccess] += 1;
    });
    return result;
  }, [accessRules]);

  const filteredPages = useMemo(() => {
    const query = searchText.trim().toLocaleLowerCase("bn-BD");
    return PAGE_ACCESS_PAGES.filter((page) => {
      const level = accessRules[page.id] ?? page.defaultAccess;
      if (category !== "সব" && page.category !== category) return false;
      if (accessFilter !== "সব" && level !== accessFilter) return false;
      if (!query) return true;
      return `${page.name} ${page.id} ${page.description} ${page.category}`.toLocaleLowerCase("bn-BD").includes(query);
    });
  }, [accessRules, accessFilter, category, searchText]);

  const handleChange = (pageId: string, level: PageAccessLevel) => {
    setSuccess("");
    setAccessRules((previous) => ({ ...previous, [pageId]: level }));
  };

  const handleBulkChange = (level: PageAccessLevel) => {
    if (!filteredPages.length) return;
    if ((level === "hidden" || level === "super_admin") && !window.confirm(
      `দেখানো ${filteredPages.length.toLocaleString("bn-BD")}টি পেজে “${ACCESS_META[level].label}” প্রয়োগ করবেন?`,
    )) return;

    setSuccess("");
    setAccessRules((previous) => {
      const next = { ...previous };
      filteredPages.forEach((page) => {
        next[page.id] = level;
      });
      return next;
    });
  };

  const handleSave = async () => {
    if (!dirty || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/page-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access: accessRules }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || "পেজ অনুমতি সংরক্ষণ করা যায়নি।");

      const next = sanitizePageAccessRules(data?.access);
      setAccessRules(next);
      setSavedRules(next);
      setUpdatedAt(typeof data?.updatedAt === "string" ? data.updatedAt : new Date().toISOString());
      setUpdatedBy(typeof data?.updatedBy === "string" ? data.updatedBy : user?.email ?? null);
      setSuccess("সব পেজের অনুমতি সফলভাবে আপডেট হয়েছে।");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "পেজ অনুমতি সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  };

  if (authChecking || loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center px-4">
        <div className="text-center">
          <RefreshCcw className="mx-auto h-9 w-9 animate-spin text-[#17663A]" />
          <p className="mt-3 text-sm font-medium text-slate-500">পেজ অনুমতি লোড হচ্ছে…</p>
        </div>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl items-center px-4 py-12">
        <div className="w-full rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm dark:border-red-900/60 dark:bg-slate-900">
          <ShieldAlert size={44} className="mx-auto mb-4 text-red-500" />
          <h1 className="text-2xl font-bold">অনুমতি নেই</h1>
          <p className="mt-2 text-sm leading-7 text-slate-500">পুরো সাইটের পেজ অনুমতি শুধুমাত্র সুপার অ্যাডমিন নিয়ন্ত্রণ করতে পারবেন।</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-slate-800 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#17663A]/10 px-3 py-1.5 text-xs font-bold text-[#17663A] dark:text-emerald-300">
              <Shield size={15} /> সুপার অ্যাডমিন নিয়ন্ত্রণ
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-3xl">পেজ অ্যাক্সেস নিয়ন্ত্রণ</h1>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
              ল্যান্ডবিডির সব ব্যবহারকারী-মুখী পেজ কে দেখতে পারবে তা একটি জায়গা থেকে নিয়ন্ত্রণ করুন। পরিবর্তন সংরক্ষণের পর সব নিবন্ধিত পেজে একই নিয়ম কার্যকর হবে।
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-xs leading-6 text-slate-500 backdrop-blur dark:border-slate-700 dark:bg-slate-950/60 dark:text-slate-400">
            <div><strong className="text-slate-700 dark:text-slate-200">মোট নিয়ন্ত্রিত পেজ:</strong> {PAGE_ACCESS_PAGES.length.toLocaleString("bn-BD")}</div>
            <div><strong className="text-slate-700 dark:text-slate-200">শেষ আপডেট:</strong> {updatedAt ? new Date(updatedAt).toLocaleString("bn-BD") : "এখনও সংরক্ষণ করা হয়নি"}</div>
            {updatedBy ? <div><strong className="text-slate-700 dark:text-slate-200">আপডেট করেছেন:</strong> {updatedBy}</div> : null}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {ACCESS_LEVELS.map((level) => {
          const meta = ACCESS_META[level];
          const Icon = meta.icon;
          return (
            <button
              key={level}
              type="button"
              onClick={() => setAccessFilter((current) => current === level ? "সব" : level)}
              className={`rounded-2xl border p-4 text-left transition ${accessFilter === level ? "border-[#17663A] ring-2 ring-[#17663A]/15" : "border-slate-200 hover:border-slate-300 dark:border-slate-800"} bg-white dark:bg-slate-900`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.badge}`}><Icon size={18} /></span>
                <span className="text-xl font-bold tabular-nums">{counts[level].toLocaleString("bn-BD")}</span>
              </div>
              <p className="mt-3 text-sm font-bold">{meta.label}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">{meta.description}</p>
            </button>
          );
        })}
      </section>

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/20 dark:text-red-200">
          <AlertTriangle className="mt-0.5 shrink-0" size={19} />
          <div className="flex-1"><strong className="block">কাজটি সম্পন্ন হয়নি</strong><span className="mt-1 block">{error}</span></div>
          <button type="button" onClick={() => void loadRules()} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold dark:border-red-800">আবার চেষ্টা করুন</button>
        </div>
      ) : null}

      {success ? (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">
          <CheckCircle2 size={19} /> {success}
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <label className="relative block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="পেজের নাম বা রুট খুঁজুন…"
                className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/15 dark:border-slate-700 dark:bg-slate-950"
              />
            </label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as PageAccessCategory | "সব")}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#17663A] dark:border-slate-700 dark:bg-slate-950"
              aria-label="পেজ বিভাগ"
            >
              <option value="সব">সব বিভাগ</option>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            <select
              value={accessFilter}
              onChange={(event) => setAccessFilter(event.target.value as PageAccessLevel | "সব")}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#17663A] dark:border-slate-700 dark:bg-slate-950"
              aria-label="অনুমতির ধরন"
            >
              <option value="সব">সব অনুমতি</option>
              {ACCESS_LEVELS.map((level) => <option key={level} value={level}>{ACCESS_META[level].label}</option>)}
            </select>
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <SlidersHorizontal size={15} /> দেখানো হচ্ছে {filteredPages.length.toLocaleString("bn-BD")}টি পেজ
            </div>
            <div className="flex flex-wrap gap-1.5">
              <span className="mr-1 self-center text-xs font-semibold text-slate-500">দেখানো সব পেজ:</span>
              {ACCESS_LEVELS.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => handleBulkChange(level)}
                  disabled={!filteredPages.length}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:border-[#17663A]/40 hover:text-[#17663A] disabled:opacity-40 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                >
                  {ACCESS_META[level].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredPages.map((page) => {
            const currentLevel = accessRules[page.id] ?? page.defaultAccess;
            const meta = ACCESS_META[currentLevel];
            const Icon = meta.icon;
            const changed = savedRules[page.id] !== currentLevel;

            return (
              <article key={page.id} className={`p-4 sm:p-5 ${changed ? "bg-amber-50/40 dark:bg-amber-950/10" : ""}`}>
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-bold text-slate-950 dark:text-white">{page.name}</h2>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{page.category}</span>
                      {changed ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">পরিবর্তিত</span> : null}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{page.description}</p>
                    <code className="mt-2 inline-block break-all rounded-lg bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-950 dark:text-slate-300">{page.id}</code>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${meta.badge}`}><Icon size={14} /></span>
                      বর্তমান অনুমতি: {meta.label}
                    </span>
                    <select
                      value={currentLevel}
                      onChange={(event) => handleChange(page.id, event.target.value as PageAccessLevel)}
                      className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-[#17663A] focus:ring-2 focus:ring-[#17663A]/15 dark:border-slate-700 dark:bg-slate-950"
                    >
                      {ACCESS_LEVELS.map((level) => <option key={level} value={level}>{ACCESS_META[level].label} — {ACCESS_META[level].description}</option>)}
                    </select>
                  </label>
                </div>
              </article>
            );
          })}

          {!filteredPages.length ? (
            <div className="p-10 text-center text-sm text-slate-500">এই ফিল্টারে কোনো পেজ পাওয়া যায়নি।</div>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 text-xs leading-6 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200">
        <strong className="block text-sm">সিস্টেম সুরক্ষা</strong>
        অ্যাডমিন প্যানেল, লগইন, এপিআই এবং ত্রুটি পেজ ইচ্ছাকৃতভাবে এই তালিকার বাইরে রাখা হয়েছে। তাই কোনো ভুল পেজ সেটিংসের কারণে সুপার অ্যাডমিন নিয়ন্ত্রণ প্যানেল থেকে লক হয়ে যাবেন না।
      </section>

      <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold">{dirty ? `${dirtyCount.toLocaleString("bn-BD")}টি অসংরক্ষিত পরিবর্তন` : "সব পরিবর্তন সংরক্ষিত"}</p>
            <p className="mt-0.5 text-xs text-slate-500">সংরক্ষণ না করা পর্যন্ত লাইভ পেজে পরিবর্তন কার্যকর হবে না।</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setAccessRules({ ...savedRules });
                setError("");
                setSuccess("");
              }}
              disabled={!dirty || saving}
              className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-700 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200"
            >
              পরিবর্তন বাতিল
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!dirty || saving}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#17663A] px-5 text-sm font-bold text-white transition hover:bg-[#10552f] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <RefreshCcw size={17} className="animate-spin" /> : <Save size={17} />}
              {saving ? "সংরক্ষণ হচ্ছে…" : "সব পরিবর্তন সংরক্ষণ করুন"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
