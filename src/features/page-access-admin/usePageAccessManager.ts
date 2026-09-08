"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/src/modules/auth/hooks/useAuth";
import { isSuperAdminRole } from "@/src/modules/auth/roles";
import {
  PAGE_ACCESS_PAGES,
  getDefaultPageAccessRules,
  sanitizePageAccessRules,
  type PageAccessCategory,
  type PageAccessLevel,
} from "@/src/shared/config/pageAccess";
import { ACCESS_LEVELS, ACCESS_META } from "./pageAccessUi";

function sameRules(
  a: Record<string, PageAccessLevel>,
  b: Record<string, PageAccessLevel>,
): boolean {
  return PAGE_ACCESS_PAGES.every((page) => a[page.id] === b[page.id]);
}

export function usePageAccessManager() {
  const { user, isLoggedIn, loading: authChecking } = useAuth();
  const [accessRules, setAccessRules] = useState<Record<string, PageAccessLevel>>(
    () => getDefaultPageAccessRules(),
  );
  const [savedRules, setSavedRules] = useState<Record<string, PageAccessLevel>>(
    () => getDefaultPageAccessRules(),
  );
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

  const loadRules = useCallback(async () => {
    if (!allowed) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/page-access", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "পেজ অনুমতি লোড করা যায়নি।");
      }

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
  }, [allowed]);

  useEffect(() => {
    if (authChecking) return;
    void loadRules();
  }, [authChecking, loadRules]);

  const dirty = useMemo(
    () => !sameRules(accessRules, savedRules),
    [accessRules, savedRules],
  );

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
    const result = Object.fromEntries(
      ACCESS_LEVELS.map((level) => [level, 0]),
    ) as Record<PageAccessLevel, number>;

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
      return `${page.name} ${page.id} ${page.description} ${page.category}`
        .toLocaleLowerCase("bn-BD")
        .includes(query);
    });
  }, [accessRules, accessFilter, category, searchText]);

  const changeRule = useCallback((pageId: string, level: PageAccessLevel) => {
    setSuccess("");
    setAccessRules((previous) => ({ ...previous, [pageId]: level }));
  }, []);

  const bulkChange = useCallback((level: PageAccessLevel) => {
    if (!filteredPages.length) return;

    if (
      (level === "hidden" || level === "super_admin") &&
      !window.confirm(
        `দেখানো ${filteredPages.length.toLocaleString("bn-BD")}টি পেজে “${ACCESS_META[level].label}” প্রয়োগ করবেন?`,
      )
    ) {
      return;
    }

    setSuccess("");
    setAccessRules((previous) => {
      const next = { ...previous };
      filteredPages.forEach((page) => {
        next[page.id] = level;
      });
      return next;
    });
  }, [filteredPages]);

  const discardChanges = useCallback(() => {
    setAccessRules({ ...savedRules });
    setError("");
    setSuccess("");
  }, [savedRules]);

  const saveRules = useCallback(async () => {
    if (!dirty || saving || !allowed) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/admin/page-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ access: accessRules }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || "পেজ অনুমতি সংরক্ষণ করা যায়নি।");
      }

      const next = sanitizePageAccessRules(data?.access);
      setAccessRules(next);
      setSavedRules(next);
      setUpdatedAt(
        typeof data?.updatedAt === "string" ? data.updatedAt : new Date().toISOString(),
      );
      setUpdatedBy(
        typeof data?.updatedBy === "string" ? data.updatedBy : user?.email ?? null,
      );
      setSuccess("সব পেজের অনুমতি সফলভাবে আপডেট হয়েছে।");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "পেজ অনুমতি সংরক্ষণ করা যায়নি।");
    } finally {
      setSaving(false);
    }
  }, [accessRules, allowed, dirty, saving, user?.email]);

  return {
    authChecking,
    loading,
    saving,
    allowed,
    accessRules,
    savedRules,
    error,
    success,
    searchText,
    setSearchText,
    category,
    setCategory,
    accessFilter,
    setAccessFilter,
    updatedAt,
    updatedBy,
    counts,
    filteredPages,
    dirty,
    dirtyCount,
    changeRule,
    bulkChange,
    discardChanges,
    saveRules,
    loadRules,
  };
}
