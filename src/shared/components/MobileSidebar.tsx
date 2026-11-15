"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, LayoutGrid, LogIn, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";
import { buildLoginHref } from "@/src/modules/auth/loginRedirect";
import { FEATURE_LABELS, FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { GLOBAL_NAVIGATION, isFeatureRouteActive } from "@/src/shared/config/navigation";

/** Responsive drawer rendering the exact same navigation inventory as the desktop header. */
export default function MobileSidebar() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const { user, isLoggedIn, logout } = useAuth();
  const canAccessAdmin = isLoggedIn && isStaffRole(user?.role);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const openButton = openButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = document.querySelectorAll<HTMLElement>(
        "#landbd-mobile-navigation a[href], #landbd-mobile-navigation button:not([disabled])",
      );
      const first = focusable.item(0);
      const last = focusable.item(focusable.length - 1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    const breakpoint = window.matchMedia("(min-width: 1280px)");
    const onBreakpoint = () => { if (breakpoint.matches) setOpen(false); };
    document.addEventListener("keydown", onKeyDown);
    breakpoint.addEventListener("change", onBreakpoint);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      breakpoint.removeEventListener("change", onBreakpoint);
      openButton?.focus();
    };
  }, [open]);

  const openDrawer = () => {
    const activeDropdown = GLOBAL_NAVIGATION.find((item) =>
      item.type === "dropdown" && item.keys.some((key) =>
        isFeatureRouteActive(pathname, FEATURE_ROUTES[key]),
      ),
    );
    setExpanded(activeDropdown?.type === "dropdown" ? activeDropdown.id : null);
    setOpen(true);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  const drawer = open ? (
    <div className="fixed inset-0 z-[1600] xl:hidden print:hidden" role="dialog" aria-modal="true" aria-label="প্রধান নেভিগেশন">
      <button type="button" aria-label="মেনু বন্ধ করুন" className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <aside id="landbd-mobile-navigation" className="absolute inset-y-0 right-0 flex w-[min(24rem,94vw)] flex-col border-l border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
          <div>
            <p lang="en" className="text-lg font-bold">LandBD</p>
            <p className="text-sm font-semibold text-[var(--muted-foreground)]">ভূমি সেবা মেনু</p>
          </div>
          <button ref={closeButtonRef} type="button" onClick={() => setOpen(false)} aria-label="মেনু বন্ধ করুন" className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)]">
            <X size={21} aria-hidden="true" />
          </button>
        </div>

        <nav aria-label="মোবাইল নেভিগেশন" className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-xl px-4 text-base font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]">হোম</Link>
          {GLOBAL_NAVIGATION.map((item) => {
            if (item.type === "link") {
              const href = FEATURE_ROUTES[item.key];
              const active = isFeatureRouteActive(pathname, href);
              return (
                <Link
                  key={item.key}
                  href={href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center rounded-xl px-4 text-base font-bold no-underline ${active ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]" : "text-[var(--foreground)] hover:bg-[var(--secondary)]"}`}
                >
                  {item.label}
                </Link>
              );
            }

            const opened = expanded === item.id;
            const active = item.keys.some((key) => isFeatureRouteActive(pathname, FEATURE_ROUTES[key]));
            return (
              <div key={item.id} className="overflow-hidden rounded-xl border border-[var(--border-color)]">
                <button
                  type="button"
                  aria-expanded={opened}
                  aria-controls={`mobile-navigation-${item.id}`}
                  onClick={() => setExpanded(opened ? null : item.id)}
                  className={`flex min-h-12 w-full items-center gap-3 px-4 text-left text-base font-bold ${active ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]" : "hover:bg-[var(--secondary)]"}`}
                >
                  <span className="flex-1">{item.label}</span>
                  <ChevronDown size={18} className={`transition-transform ${opened ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
                {opened ? (
                  <div id={`mobile-navigation-${item.id}`} className="space-y-1 border-t border-[var(--border-color)] p-2">
                    {item.keys.map((key) => {
                      const href = FEATURE_ROUTES[key];
                      const linkActive = isFeatureRouteActive(pathname, href);
                      return (
                        <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={linkActive ? "page" : undefined} className={`flex min-h-11 items-center rounded-lg px-3 text-base font-semibold no-underline ${linkActive ? "bg-[var(--secondary)] text-[var(--primary)]" : "text-[var(--foreground)] hover:bg-[var(--secondary)]"}`}>
                          {FEATURE_LABELS[key].bn}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-[var(--border-color)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Link href={FEATURE_ROUTES.allServices} onClick={() => setOpen(false)} className="flex min-h-12 items-center gap-2 rounded-xl bg-[var(--brand-green-faint)] px-4 text-base font-bold text-[var(--primary)] no-underline">
            <LayoutGrid size={19} aria-hidden="true" /> সকল সেবা দেখুন
          </Link>
          {canAccessAdmin ? (
            <Link href={FEATURE_ROUTES.admin} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-base font-bold text-[var(--foreground)] no-underline hover:bg-[var(--secondary)]">
              <ShieldCheck size={18} aria-hidden="true" /> অ্যাডমিন ড্যাশবোর্ড
            </Link>
          ) : null}
          {isLoggedIn ? (
            <button type="button" onClick={() => void handleLogout()} className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 text-left text-base font-bold text-red-600 hover:bg-red-50">
              <LogOut size={18} aria-hidden="true" /> লগআউট
            </button>
          ) : (
            <Link href={buildLoginHref(pathname)} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 text-base font-bold text-[var(--primary-foreground)] no-underline">
              <LogIn size={18} aria-hidden="true" /> লগইন
            </Link>
          )}
        </div>
      </aside>
    </div>
  ) : null;

  return (
    <>
      <button
        ref={openButtonRef}
        type="button"
        aria-label="মেনু খুলুন"
        aria-expanded={open}
        aria-controls={open ? "landbd-mobile-navigation" : undefined}
        onClick={openDrawer}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] xl:hidden print:hidden"
      >
        <Menu size={22} aria-hidden="true" />
      </button>
      {drawer && typeof document !== "undefined" ? createPortal(drawer, document.body) : null}
    </>
  );
}
