"use client";

import { useState, useEffect, useCallback } from "react";

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
}

/**
 * Reads the access_token cookie, decodes the JWT payload (client-side,
 * no signature verification — the server validates on every API call).
 * Provides login/logout helpers that call the existing /api/auth/* routes.
 */
function parseJwtPayload(
  token: string,
): { userId: string; role: string; exp: number } | null {
  try {
    const base64 = token.split(".")[1];
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)access_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isTokenValid(token: string): boolean {
  const payload = parseJwtPayload(token);
  if (!payload) return false;
  // Give a 10-second buffer before expiry
  return payload.exp * 1000 > Date.now() + 10_000;
}

export function useAuth(): AuthState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<boolean>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoggedIn: false,
    loading: true,
  });

  const loadFromToken = useCallback(async () => {
    const token = getAccessToken();

    if (token && isTokenValid(token)) {
      const payload = parseJwtPayload(token)!;
      // Fetch full user profile from the server
      try {
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "same-origin",
        });
        if (res.ok) {
          const data = await res.json();
          setState({ user: data.user, isLoggedIn: true, loading: false });
          return;
        }
      } catch {
        // fall through to payload-only mode
      }
      // Fallback: use JWT payload directly (no name/email available)
      setState({
        user: { id: payload.userId, email: "", name: null, role: payload.role },
        isLoggedIn: true,
        loading: false,
      });
      return;
    }

    // No valid token — try to silently refresh
    const refreshed = await silentRefresh();
    if (!refreshed) {
      setState({ user: null, isLoggedIn: false, loading: false });
    }
  }, []);

  async function silentRefresh(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.accessToken) {
        setAccessTokenCookie(data.accessToken);
        await loadFromToken();
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }

  function setAccessTokenCookie(token: string) {
    const payload = parseJwtPayload(token);
    const maxAge = payload
      ? Math.floor((payload.exp * 1000 - Date.now()) / 1000)
      : 900;
    document.cookie = `access_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax`;
  }

  useEffect(() => {
    loadFromToken();
    // Re-check on tab focus (token may have been refreshed in another tab)
    const onFocus = () => loadFromToken();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadFromToken]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "লগিন ব্যর্থ হয়েছে");

    setAccessTokenCookie(data.accessToken);
    setState({
      user: data.user,
      isLoggedIn: true,
      loading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore network errors
    }
    // Clear cookie
    document.cookie = "access_token=; path=/; max-age=0";
    setState({ user: null, isLoggedIn: false, loading: false });
  }, []);

  return { ...state, login, logout, refresh: () => silentRefresh() };
}
