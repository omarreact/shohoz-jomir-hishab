"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Compass, LogIn, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isStaffRole } from "@/src/modules/auth/roles";
import { buildLoginHref } from "@/src/modules/auth/loginRedirect";
import { FEATURE_ROUTES } from "@/src/shared/config/feature-routes";
import { NAV_SECTIONS, isFeatureRouteActive, navRoute } from "@/src/shared/config/navigation";

type CmsSection = {
  title: string;
  links: Array<{ href: string; label: string }>;
};

/** The public-site drawer belongs to small screens only (under 768px). */
export default function MobileSidebar() {
  const pathname = usePathname() || "/";
  const { user, isLoggedIn, logout } = useAuth();
  const canAccessAdmin = isLoggedIn && isStaffRole(user?.role);
  const canSeeMapQa = isLoggedIn && isAdminRole(user?.role);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cmsSections, setCmsSections] = useState<CmsSection[]>([]);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/public/navigation", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Navigation unavailable")))
      .then((data: { sections?: CmsSection[] }) => {
        if (active && Array.isArray(data.sections)) {
          setCmsSections(data.sections.filter((section) => Array.isArray(section.links)));
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  // Close after client-side navigation, including back/forward navigation.
  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const focusable = document.querySelectorAll<HTMLElement>(
        "#landbd-mobile-sidebar a[href], #landbd-mobile-sidebar button:not([disabled])"
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
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const onResize = () => { if (breakpoint.matches) setOpen(false); };
    onResize();
    document.addEventListener("keydown", onKeyDown);
    breakpoint.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      breakpoint.removeEventListener("change", onResize);
      openButtonRef.current?.focus();
    };
  }, [open]);

  const groups: Array<{ id: string; label: string; links: Array<{ href: string; label: string }> }> = [
    ...NAV_SECTIONS.map((section) => ({
      id: section.id,
      label: section.label,
      links: section.keys
        .filter((key) => key !== "mapQa" || canSeeMapQa)
        .map((key) => navRoute(key)),
    })),
    ...cmsSections.map((section, index) => ({
      id: "cms-" + index,
      label: section.title,
      links: section.links,
    })),
  ];

  const openDrawer = () => {
    setExpanded(groups.find((group) => group.links.some((link) =>
      isFeatureRouteActive(pathname, link.href)))?.id ?? "records");
    setOpen(true);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    window.location.assign("/");
  };

  const drawer = open ? (
    <div
      className="fixed inset-0 z-[1500] md:hidden print:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="মোবাইল সাইডবার মেনু"
    >
      <button
        type="button"
        aria-label="সাইডবার বন্ধ করুন"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside
        id="landbd-mobile-sidebar"
        className="absolute inset-y-0 right-0 flex w-[min(21rem,92vw)] flex-col border-l border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-4">
          <div>
            <p className="text-base font-extrabold">LandBD</p>
            <p className="text-xs text-[var(--muted-foreground)]">ভূমি সেবা মেনু</p>
          </div>
          <button
            type="button"
            ref={closeButtonRef}
            onClick={() => setOpen(false)}
            aria-label="মেনু বন্ধ করুন"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--border-color)]"
          >
            <X size={20} />
          </button>
        </div>
        <nav aria-label="মোবাইল নেভিগেশন ও সাবমেনু" className="flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center rounded-xl px-4 text-sm font-bold no-underline hover:bg-[var(--secondary)]"
          >
            হোম
          </Link>
          {groups.filter((group) => group.links.length > 0).map((group) => {
            const opened = expanded === group.id;
            const active = group.links.some((link) => isFeatureRouteActive(pathname, link.href));
            return (
              <div key={group.id} className="rounded-xl border border-[var(--border-color)]">
                <button
                  type="button"
                  aria-expanded={opened}
                  aria-controls={"landbd-drawer-section-" + group.id}
                  onClick={() => setExpanded(opened ? null : group.id)}
                  className={[
                    "flex min-h-12 w-full items-center gap-3 rounded-xl px-4 text-left text-sm font-bold",
                    active ? "bg-[var(--brand-gold-faint)] text-[var(--brand-gold-text)]" : "hover:bg-[var(--secondary)]",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1">{group.label}</span>
                  <ChevronDown size={17} className={opened ? "rotate-180" : ""} />
                </button>
                {opened && (
                  <div id={"landbd-drawer-section-" + group.id} className="space-y-1 border-t border-[var(--border-color)] p-2">
                    {group.links.map((link) => (
                      <Link
                        key={link.href + link.label}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={isFeatureRouteActive(pathname, link.href) ? "page" : undefined}
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium no-underline hover:bg-[var(--secondary)]"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          <Link
            href="/explore"
            onClick={() => setOpen(false)}
            className="flex min-h-12 items-center gap-2 rounded-xl px-4 text-sm font-bold no-underline hover:bg-[var(--secondary)]"
          >
            <Compass size={17} /> সব সেবা ও সার্চ
          </Link>
        </nav>
        <div className="space-y-2 border-t border-[var(--border-color)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {canAccessAdmin && (
            <Link
              href={FEATURE_ROUTES.admin}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold no-underline hover:bg-[var(--secondary)]"
            >
              <ShieldCheck size={17} /> অ্যাডমিন ড্যাশবোর্ড
            </Link>
          )}
          {isLoggedIn ? (
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="flex min-h-11 w-full items-center gap-2 rounded-xl px-4 text-left text-sm font-bold text-red-600 hover:bg-red-50"
            >
              <LogOut size={17} /> লগআউট
            </button>
          ) : (
            <Link
              href={buildLoginHref(pathname)}
              onClick={() => setOpen(false)}
              className="flex min-h-11 items-center gap-2 rounded-xl bg-[var(--brand-gold)] px-4 text-sm font-bold text-[var(--primary-foreground)] no-underline"
            >
              <LogIn size={17} /> লগইন
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
        aria-label="মোবাইল মেনু খুলুন"
        aria-expanded={open}
        aria-controls={open ? "landbd-mobile-sidebar" : undefined}
        onClick={openDrawer}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] md:hidden print:hidden"
      >
        <Menu size={21} />
      </button>
      {drawer && typeof document !== "undefined" ? createPortal(drawer, document.body) : null}
    </>
  );
}
