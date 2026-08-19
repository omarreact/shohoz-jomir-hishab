"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Calculator, Search, Map, FileText, BookOpen, Ruler, Users, Menu, X, LogIn, LogOut, ShieldCheck, User, Moon, Sun, Layers3 } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { useTheme } from "next-themes";

type NavItem = { href: string; label: string; icon: typeof Calculator };
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "হোম", icon: Calculator },
  { href: "/dap-map", label: "ম্যাপ", icon: Map },
  { href: "/geospatial-map", label: "জিওস্পেশিয়াল", icon: Layers3 },
  { href: "/khatiyan", label: "খতিয়ান", icon: Calculator },
  { href: "/land-measurement", label: "জমি মাপ", icon: Ruler },
  { href: "/faraez", label: "ফারায়েজ", icon: Users },
  { href: "/blog", label: "ব্লগ", icon: BookOpen },
];
function activePath(pathname: string, href: string) { return href === "/" ? pathname === "/" : pathname.startsWith(href); }

export default function Navbar() {
  const pathname = usePathname();
  const isMapRoute = pathname.startsWith("/dap-map") || pathname.startsWith("/geospatial-map") || pathname.startsWith("/lios-map");
  const { theme, setTheme } = useTheme();
  const { isLoggedIn, loading: authLoading, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setSearchOpen(true); }
      if (event.key === "Escape") { setSearchOpen(false); setMobileOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return NAV_ITEMS.filter(item => !q || item.label.toLowerCase().includes(q) || item.href.includes(q));
  }, [query]);
  const handleLogout = async () => { await logout(); window.location.assign("/"); };
  const shell = "border border-[var(--border-color)] bg-[color-mix(in_srgb,var(--card-bg)_92%,transparent)] text-[var(--foreground)] shadow-sm backdrop-blur-xl";

  return <>
    <nav className={`${isMapRoute ? "absolute top-0 left-0 right-0" : "sticky top-0"} z-[1100] px-3 pt-3 sm:px-4`} aria-label="প্রধান নেভিগেশন">
      <div className={`mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 rounded-2xl px-3 sm:px-4 ${shell}`}>
        <Link href="/" className="flex shrink-0 items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--primary-foreground)]"><Calculator size={18} /></span>
          <span className="hidden text-base font-bold tracking-tight sm:block">সহজ জমির হিসাব</span><span className="text-sm font-bold sm:hidden">LandBD</span>
        </Link>
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_ITEMS.map(({ href, label }) => { const active = activePath(pathname, href); return <Link key={href} href={href} className={`rounded-xl px-3 py-2 text-sm font-semibold no-underline transition-colors ${active ? "bg-[var(--secondary)] text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"}`}>{label}</Link>; })}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" aria-label="সার্চ" onClick={() => setSearchOpen(true)} className="hidden items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-3 py-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] md:flex"><Search size={15}/><span>সার্চ</span><kbd className="rounded-md border border-[var(--border-color)] bg-[var(--card-bg)] px-1.5 py-0.5 text-[10px]">Ctrl K</kbd></button>
          {mounted && <button aria-label="থিম পরিবর্তন" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="hidden h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] hover:bg-[var(--secondary)] md:flex">{theme === "dark" ? <Moon size={16}/> : <Sun size={16}/>}</button>}
          {authLoading ? null : isLoggedIn ? <div className="hidden items-center gap-2 md:flex"><Link href="/admin" className="flex items-center gap-1.5 rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm font-semibold no-underline hover:bg-[var(--secondary)]"><ShieldCheck size={15}/> ড্যাশবোর্ড</Link><button onClick={handleLogout} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"><LogOut size={15}/> লগআউট</button></div> : <Link href="/login" className="hidden items-center gap-1.5 rounded-xl bg-[var(--foreground)] px-4 py-2 text-sm font-bold text-[var(--primary-foreground)] no-underline hover:opacity-90 md:flex"><LogIn size={15}/> লগইন</Link>}
          <button type="button" aria-label="মেনু" onClick={() => setMobileOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] lg:hidden"><Menu size={19}/></button>
        </div>
      </div>
    </nav>
    {searchOpen && <div className="fixed inset-0 z-[1300] flex items-start justify-center bg-black/40 p-4 pt-24 backdrop-blur-sm" onMouseDown={() => setSearchOpen(false)}><div className={`w-full max-w-xl overflow-hidden rounded-2xl ${shell}`} onMouseDown={e => e.stopPropagation()}><div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4"><Search size={18}/><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="সেবা বা পেজ খুঁজুন..." className="h-14 flex-1 bg-transparent text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"/><button onClick={() => setSearchOpen(false)}><X size={18}/></button></div><div className="p-2">{results.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => setSearchOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-[var(--muted-foreground)] no-underline hover:bg-[var(--secondary)] hover:text-[var(--foreground)]"><Icon size={17}/> {label}</Link>)}{!results.length && <p className="px-3 py-6 text-center text-sm text-[var(--muted-foreground)]">কোনো ফলাফল পাওয়া যায়নি</p>}</div></div></div>}
    {mobileOpen && <div className="fixed inset-0 z-[1250] lg:hidden" role="dialog" aria-modal="true"><button aria-label="মেনু বন্ধ করুন" className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/><aside className={`absolute right-0 top-0 flex h-full w-[310px] max-w-[88vw] flex-col p-4 ${shell}`}><div className="flex items-center justify-between border-b border-[var(--border-color)] pb-4"><Link href="/" className="flex items-center gap-2 no-underline" onClick={() => setMobileOpen(false)}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--foreground)] text-[var(--primary-foreground)]"><Calculator size={18}/></span><strong>সহজ জমির হিসাব</strong></Link><button onClick={() => setMobileOpen(false)}><X/></button></div><div className="flex flex-1 flex-col gap-1 overflow-y-auto py-4">{NAV_ITEMS.map(({href,label,icon:Icon}) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline ${activePath(pathname,href) ? "bg-[var(--secondary)]" : "text-[var(--muted-foreground)] hover:bg-[var(--secondary)]"}`}><Icon size={18}/> {label}</Link>)}<Link href="/rajuk-test" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline hover:bg-[var(--secondary)]"><Map size={18}/> ডাটা টেস্ট</Link><Link href="/porcha" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold no-underline hover:bg-[var(--secondary)]"><FileText size={18}/> পর্চা</Link></div><div className="border-t border-[var(--border-color)] pt-4">{mounted && <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="mb-3 flex w-full items-center justify-between rounded-xl border border-[var(--border-color)] px-4 py-3 text-sm"><span className="flex items-center gap-2">{theme === "dark" ? <Moon size={16}/> : <Sun size={16}/>} থিম</span><span>{theme === "dark" ? "ডার্ক" : "লাইট"}</span></button>}{isLoggedIn ? <div className="grid gap-2"><Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] py-3 font-bold text-[var(--primary-foreground)] no-underline"><User size={16}/> ড্যাশবোর্ড</Link><button onClick={handleLogout} className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-red-600"><LogOut size={16}/> লগআউট</button></div> : <Link href="/login" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-2 rounded-xl bg-[var(--foreground)] py-3 font-bold text-[var(--primary-foreground)] no-underline"><LogIn size={16}/> লগইন</Link>}</div></aside></div>}
  </>;
}
