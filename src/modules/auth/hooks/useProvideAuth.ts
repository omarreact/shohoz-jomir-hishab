"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { normalizeRole } from "@/src/modules/auth/roles";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}
interface AuthState { user: AuthUser | null; isLoggedIn: boolean; loading: boolean; }
export type SessionUser = { id?: string; email?: string; name?: string | null; role?: string; };
const EMPTY: AuthState = { user: null, isLoggedIn: false, loading: false };

/** The temporary admin login uses an HttpOnly server session, not Firebase Auth. */
export function useProvideAuth(): AuthState & {
  login: (username: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
} {
  const [state, setState] = useState<AuthState>({ ...EMPTY, loading: true });
  const generation = useRef(0);

  const acceptUser = useCallback((user: SessionUser) => {
    if (!user.id || user.role !== "Super Admin") throw new Error("Unauthorized");
    setState({ user: { id: user.id, email: user.email || "", name: user.name || null, role: normalizeRole(user.role) }, isLoggedIn: true, loading: false });
  }, []);

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    try {
      const response = await fetch("/api/auth/me", { credentials: "same-origin", cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Unauthorized");
      const body = await response.json();
      if (current !== generation.current) return false;
      acceptUser(body.user);
      return true;
    } catch {
      if (current === generation.current) setState(EMPTY);
      return false;
    }
  }, [acceptUser]);

  useEffect(() => {
    const lifecycle = generation;
    void refresh();
    return () => { lifecycle.current++; };
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    ++generation.current;
    const response = await fetch("/api/auth/session", {
      method: "POST", credentials: "same-origin", cache: "no-store",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error || "লগইন করা যায়নি।");
    acceptUser(body.user);
    return body.user as SessionUser;
  }, [acceptUser]);

  const logout = useCallback(async () => {
    ++generation.current;
    const response = await fetch("/api/auth/session", { method: "DELETE", credentials: "same-origin", cache: "no-store" });
    if (!response.ok) throw new Error("লগআউট করা যায়নি। আবার চেষ্টা করুন।");
    setState(EMPTY);
  }, []);

  return { ...state, login, logout, refresh };
}
