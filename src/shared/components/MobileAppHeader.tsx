"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MapPinned, Search, ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isStaffRole } from "@/src/modules/auth/roles";
import { FEATURE_ROUTES, FEATURE_LABELS } from "@/src/shared/config/feature-routes";
import { NAV_SECTIONS, isFeatureRouteActive } from "@/src/shared/config/navigation";

/** Native-style mobile app bar. Normal-flow except the full-screen GIS workspace. */
export default function MobileAppHeader() {
  const pathname = usePathname() || "/";
  const { user, isLoggedIn } = useAuth();
  const onMap = pathname.startsWith("/geospatial-map") || pathname.startsWith("/lios-map");
  const activeKey = NAV_SECTIONS.flatMap((section) => section.keys)
    .find((key) => isFeatureRouteActive(pathname, FEATURE_ROUTES[key]));
  const title = pathname === "/"
    ? "LandBD"
    : pathname === "/explore"
      ? "সব সেবা"
      : (activeKey ? FEATURE_LABELS[activeKey].bn : "LandBD");
  const accountHref = isLoggedIn && isStaffRole(user?.role)
    ? FEATURE_ROUTES.admin
    : isLoggedIn ? "/my-purchases" : FEATURE_ROUTES.login;

  return (
    <header
      className={[
        "landbd-mobile-appbar md:hidden print:hidden",
        onMap ? "absolute inset-x-0 top-0 z-[1150]" : "sticky top-0 z-[1150]",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[3.75rem] max-w-screen-sm items-center gap-2.5 px-3">
        <Link
          href="/"
          aria-label="LandBD হোম"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--brand-gold)] text-[var(--primary-foreground)] no-underline shadow-sm"
        >
          {onMap ? <MapPinned size={21} /> : <Home size={21} />}
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[.13em] text-[var(--muted-foreground)]">
            LANDBD · ভূমি সেবা
          </p>
          <p className="truncate text-[17px] font-black leading-tight text-[var(--foreground)]">{title}</p>
        </div>
        <Link
          href="/explore"
          aria-label="সেবা ও সার্চ"
          aria-current={pathname === "/explore" ? "page" : undefined}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--foreground)] no-underline"
        >
          <Search size={21} />
        </Link>
        <Link
          href={accountHref}
          aria-label={isLoggedIn ? "আমার অ্যাকাউন্ট" : "লগইন"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--primary)] no-underline"
        >
          {isLoggedIn && isStaffRole(user?.role) ? <ShieldCheck size={21} /> : <UserRound size={21} />}
        </Link>
      </div>
    </header>
  );
}
