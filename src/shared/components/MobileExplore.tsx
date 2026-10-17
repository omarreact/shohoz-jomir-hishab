"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight, BookOpen, Calculator, Check, Compass, Download,
  FileSearch, FileText, Home, MapPinned, Search, ShieldCheck,
  Smartphone, UserRound, X, type LucideIcon,
} from "lucide-react";
import { NAV_SECTIONS, navRoute } from "@/src/shared/config/navigation";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isStaffRole } from "@/src/modules/auth/roles";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";

const SECTION_ICONS: Record<string, LucideIcon> = {
  records: FileSearch,
  calculations: Calculator,
  maps: MapPinned,
  documents: FileText,
  guides: BookOpen,
};
const QUICK_LINKS = [
  { href: FEATURE_ROUTES.dlrmsKhatian, label: "খতিয়ান খুঁজুন", icon: FileSearch },
  { href: FEATURE_ROUTES.landMeasurement, label: "জমি পরিমাপ", icon: Calculator },
  { href: FEATURE_ROUTES.landMap, label: "জিআইএস মানচিত্র", icon: MapPinned },
  { href: FEATURE_ROUTES.history, label: "হিসাব ইতিহাস", icon: BookOpen },
] as const;

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function InstallAction() {
  const [promptEvent, setPromptEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallEvent);
    };
    const onInstalled = () => { setInstalled(true); setPromptEvent(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) {
    return (
      <p className="flex items-center gap-2 text-sm font-bold text-[var(--primary)]">
        <Check size={18} /> LandBD হোম স্ক্রিনে যোগ হয়েছে
      </p>
    );
  }

  return promptEvent ? (
    <button type="button"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 py-2 text-sm font-extrabold text-[var(--primary-foreground)]"
      onClick={async () => {
        await promptEvent.prompt();
        await promptEvent.userChoice;
        setPromptEvent(null);
      }}>
      <Download size={18} /> হোম স্ক্রিনে যোগ করুন
    </button>
  ) : (
    <p className="text-xs leading-6 text-[var(--muted-foreground)]">
      Chrome-এর ⋮ মেনু থেকে <strong>Install app</strong> বা <strong>Add to Home screen</strong> বেছে নিন।
    </p>
  );
}

/** All app destinations in normal document flow, with no modal or slide-over. */
export default function MobileExplore() {
  const { user, isLoggedIn } = useAuth();
  const [query, setQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState("all");
  const canSeeMapQa = isLoggedIn && isAdminRole(user?.role);
  const canSeeAdmin = isLoggedIn && isStaffRole(user?.role);
  const groups = useMemo(() =>
    NAV_SECTIONS.map(section => ({
      ...section,
      routes: section.keys
        .filter(key => key !== "mapQa" || canSeeMapQa)
        .map(key => navRoute(key)),
    })),
    [canSeeMapQa],
  );
  const filteredGroups = groups
    .filter(group => sectionFilter === "all" || group.id === sectionFilter)
    .map(group => ({
      ...group,
      routes: group.routes.filter(item =>
        [item.label, item.href, item.key].join(" ").toLowerCase().includes(query.trim().toLowerCase()),
      ),
    })).filter(group => group.routes.length > 0);

  return (
    <div className="landbd-explore mx-auto w-full max-w-3xl px-4 pb-8 pt-4 sm:px-6">
      <section className="relative overflow-hidden rounded-[26px] bg-[var(--brand-green-faint)] p-5 ring-1 ring-[var(--border-color)]">
        <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full bg-[var(--primary)] opacity-[.07]" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[.14em] text-[var(--brand-gold-text)]">
              LANDBD APP · SERVICES
            </p>
            <h1 className="mt-1 text-[25px] font-black leading-tight">আপনার ভূমি সেবা</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
              সব হিসাব, রেকর্ড, ম্যাপ ও সনদ এক জায়গায়।
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-gold)] text-[var(--primary-foreground)]">
            <Compass size={25} />
          </span>
        </div>
        <div className="relative mt-5 flex min-h-12 items-center gap-2.5 rounded-[15px] border border-[var(--border-color)] bg-[var(--card-bg)] px-3 shadow-sm">
          <Search size={20} className="shrink-0 text-[var(--primary)]" />
          <label className="sr-only" htmlFor="mobile-service-search">সেবা খুঁজুন</label>
          <input id="mobile-service-search" type="search" enterKeyHint="search" autoComplete="off"
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="খতিয়ান, পরিমাপ, মানচিত্র..."
            className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-[var(--muted-foreground)]"
          />
          {query && <button type="button" aria-label="সার্চ মুছুন" onClick={() => setQuery("")}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--muted-foreground)]">
            <X size={18} />
          </button>}
        </div>
      </section>

      {!query && sectionFilter === "all" && (
        <section className="mt-6" aria-label="দ্রুত সেবা">
          <h2 className="mb-3 text-lg font-black">দ্রুত ব্যবহার করুন</h2>
          <div className="grid grid-cols-2 gap-3">
            {QUICK_LINKS.map(item => {
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.href}
                  className="flex min-h-28 flex-col justify-between gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--card-bg)] p-4 text-[var(--foreground)] no-underline shadow-sm active:scale-[.98]">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-green-faint)] text-[var(--primary)]">
                    <Icon size={21} />
                  </span>
                  <span className="text-sm font-black leading-5">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-7" aria-label="সকল সেবা">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-lg font-black">সব বিভাগ</h2>
          <span className="text-xs font-semibold text-[var(--muted-foreground)]">
            {filteredGroups.reduce((count, group) => count + group.routes.length, 0)} সেবা
          </span>
        </div>
        <div role="group" aria-label="সেবার বিভাগ" className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
          {[{ id: "all", label: "সব" }, ...NAV_SECTIONS].map(section => (
            <button type="button" key={section.id}
              aria-pressed={sectionFilter === section.id}
              onClick={() => setSectionFilter(section.id)}
              className={[
                "min-h-11 shrink-0 snap-start rounded-full border px-4 text-xs font-extrabold",
                sectionFilter === section.id
                  ? "border-[var(--primary)] bg-[var(--brand-gold)] text-[var(--primary-foreground)]"
                  : "border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)]",
              ].join(" ")}>
              {section.label}
            </button>
          ))}
        </div>
        {filteredGroups.map(group => {
          const GroupIcon = SECTION_ICONS[group.id] ?? FileText;
          return (
            <div key={group.id} className="mb-5 overflow-hidden rounded-[20px] border border-[var(--border-color)] bg-[var(--card-bg)] shadow-sm">
              <div className="flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--secondary)] px-4 py-3">
                <GroupIcon size={18} className="text-[var(--primary)]" />
                <h3 className="text-sm font-black">{group.label}</h3>
              </div>
              <div className="divide-y divide-[var(--border-color)]">
                {group.routes.map(item => (
                  <Link key={item.href} href={item.href}
                    className="flex min-h-[3.8rem] items-center gap-3 px-4 py-3 text-[var(--foreground)] no-underline active:bg-[var(--brand-green-faint)]">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-green-faint)] text-[var(--primary)]">
                      <ArrowRight size={18} />
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-bold">{item.label}</span>
                    <ArrowRight size={16} className="shrink-0 text-[var(--muted-foreground)]" />
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
        {!filteredGroups.length && (
          <div className="rounded-2xl border border-dashed border-[var(--border-color)] p-8 text-center text-sm text-[var(--muted-foreground)]">
            এই নামে কোনো সেবা পাওয়া যায়নি।
          </div>
        )}
      </section>

      <section className="mt-5 space-y-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
        <h2 className="text-base font-black">আমার LandBD</h2>
        <Link
          href={canSeeAdmin ? FEATURE_ROUTES.admin : isLoggedIn ? "/my-purchases" : FEATURE_ROUTES.login}
          className="flex min-h-12 items-center gap-3 rounded-xl bg-[var(--secondary)] px-3 text-sm font-bold text-[var(--foreground)] no-underline">
          {canSeeAdmin ? <ShieldCheck size={19} /> : <UserRound size={19} />}
          <span className="flex-1">{canSeeAdmin ? "অ্যাডমিন ড্যাশবোর্ড" : isLoggedIn ? "আমার কেনাকাটা" : "অ্যাকাউন্ট লগইন"}</span>
          <ArrowRight size={17} />
        </Link>
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-bold text-[var(--foreground)] no-underline">
          <Home size={19} /> <span className="flex-1">ওয়েবসাইট হোম</span><ArrowRight size={17} />
        </Link>
      </section>

      <section className="mt-5 flex items-start gap-3 rounded-[20px] border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
        <Smartphone size={22} className="mt-1 shrink-0 text-[var(--primary)]" />
        <div className="min-w-0">
          <h2 className="mb-1 text-sm font-black">ফোনে অ্যাপের মতো ব্যবহার করুন</h2>
          <InstallAction />
        </div>
      </section>
      <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-3 text-xs font-semibold text-[var(--muted-foreground)]">
        <Link href="/privacy" className="text-inherit">গোপনীয়তা</Link>
        <Link href="/terms" className="text-inherit">শর্তাবলি</Link>
        <Link href="/contact" className="text-inherit">যোগাযোগ</Link>
      </div>
    </div>
  );
}
