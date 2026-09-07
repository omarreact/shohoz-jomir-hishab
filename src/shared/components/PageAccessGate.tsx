"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { EyeOff, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isAdminRole, isSuperAdminRole } from "@/src/modules/auth/roles";
import {
  getDefaultPageAccessRules,
  getPageAccessLevel,
  isSystemPageAccessBypass,
  resolvePageDefinition,
  sanitizePageAccessRules,
  type PageAccessLevel,
} from "@/src/shared/config/pageAccess";

function LoadingState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 px-4 text-center">
      <Loader2 className="h-9 w-9 animate-spin text-[#17663A]" />
      <p className="text-sm font-medium text-[var(--muted-foreground)]">পেজের অনুমতি যাচাই হচ্ছে…</p>
    </div>
  );
}

function BlockedState({
  type,
  featureName,
  pathname,
}: {
  type: "hidden" | "login" | "forbidden";
  featureName: string;
  pathname: string;
}) {
  const next = encodeURIComponent(pathname || "/");
  const hidden = type === "hidden";
  const login = type === "login";
  const Icon = hidden ? EyeOff : login ? LockKeyhole : ShieldAlert;

  return (
    <div className="mx-auto flex min-h-[65vh] w-full max-w-xl items-center justify-center px-4 py-12">
      <div className="w-full rounded-3xl border border-[var(--border-color)] bg-[var(--card-bg)] p-7 text-center shadow-sm sm:p-9">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl ${
            hidden
              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              : login
                ? "bg-amber-500/10 text-amber-600"
                : "bg-red-500/10 text-red-600"
          }`}
        >
          <Icon size={30} />
        </div>
        <h1 className="text-2xl font-bold text-[var(--foreground)]">
          {hidden ? "পেজটি বর্তমানে বন্ধ" : login ? "লগইন প্রয়োজন" : "এই পেজে আপনার অনুমতি নেই"}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-[var(--muted-foreground)]">
          {hidden
            ? `${featureName} সাময়িকভাবে বন্ধ রাখা হয়েছে। পরে আবার চেষ্টা করুন।`
            : login
              ? `${featureName} দেখতে আপনার ল্যান্ডবিডি অ্যাকাউন্টে লগইন করতে হবে।`
              : `${featureName} আপনার বর্তমান ভূমিকার জন্য অনুমোদিত নয়।`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {login ? (
            <Link
              href={`/login?from=${next}`}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#17663A] px-6 text-sm font-bold text-white no-underline hover:bg-[#10552f]"
            >
              লগইন করুন
            </Link>
          ) : null}
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border-color)] bg-[var(--secondary)] px-6 text-sm font-bold text-[var(--foreground)] no-underline"
          >
            হোমে ফিরে যান
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PageAccessGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [rules, setRules] = useState<Record<string, PageAccessLevel>>(() => getDefaultPageAccessRules());
  const [rulesLoading, setRulesLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setRulesLoading(true);

    void fetch("/api/public/page-access", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("পৃষ্ঠা অনুমতি লোড করা যায়নি");
        return response.json();
      })
      .then((data) => setRules(sanitizePageAccessRules(data?.access)))
      .catch((error) => {
        if (!controller.signal.aborted) {
          console.error("Page access rules failed to load", error);
          setRules(getDefaultPageAccessRules());
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setRulesLoading(false);
      });

    return () => controller.abort();
  }, []);

  const page = useMemo(() => resolvePageDefinition(pathname), [pathname]);
  const requiredAccess = useMemo(() => getPageAccessLevel(pathname, rules), [pathname, rules]);

  if (isSystemPageAccessBypass(pathname) || !page) return <>{children}</>;
  if (rulesLoading) return <LoadingState />;
  if (requiredAccess === "public") return <>{children}</>;
  if (requiredAccess === "hidden") {
    return <BlockedState type="hidden" featureName={page.name} pathname={pathname} />;
  }

  if (authLoading) return <LoadingState />;
  if (!isLoggedIn) {
    return <BlockedState type="login" featureName={page.name} pathname={pathname} />;
  }

  if (requiredAccess === "admin" && !isAdminRole(user?.role)) {
    return <BlockedState type="forbidden" featureName={page.name} pathname={pathname} />;
  }

  if (requiredAccess === "super_admin" && !isSuperAdminRole(user?.role)) {
    return <BlockedState type="forbidden" featureName={page.name} pathname={pathname} />;
  }

  return <>{children}</>;
}
